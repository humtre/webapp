# humtre

Personal web music player with **hum-to-search**: hum a melody in the browser, find the song in your private library.

Music library lives in **gs://musicetre**.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  OFFLINE (run once, or when library changes)         │
│                                                      │
│  gs://musicetre                                      │
│       │                                              │
│       ▼  download                                    │
│  melody_extractor.py                                 │
│    ├─ basic-pitch  (polyphonic track → note events)  │
│    └─ pYIN         (monophonic humming → F0)         │
│       │                                              │
│       ▼  relative semitone intervals                 │
│  index_store.py  →  data/index/melody_index.joblib   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  ONLINE (per query, ~1-3s)                           │
│                                                      │
│  Browser mic  →  MediaRecorder (WebM/Opus)           │
│       │                                              │
│       ▼  POST /api/search                            │
│  query_processor.py                                  │
│    └─ pYIN → relative interval contour               │
│       │                                              │
│       ▼  DTW against each indexed segment            │
│  retrieval.py                                        │
│    └─ score = 1 / (1 + normalized_dtw_dist)          │
│    └─ best segment per track → top-k ranking         │
│       │                                              │
│       ▼  [{track_id, score, matched_segment, ...}]   │
│  Browser → render cards → click → signed URL → play  │
└──────────────────────────────────────────────────────┘
```

### Why this approach?

| Problem | Solution |
|---|---|
| Modality gap: voice vs. full track | Extract melody/pitch contour from both; compare in that space |
| Singer hums in wrong key | Relative semitone intervals (key-invariant) |
| Singer hums faster/slower | DTW (tempo-invariant warping) |
| Polyphonic track → hard to get melody | basic-pitch (Spotify ML model) |
| Large library, slow search | Offline segment indexing; online = just DTW array ops |

---

## Folder Structure

```
webapp/
├── backend/
│   ├── main.py               # FastAPI app
│   ├── config.py             # all tunable constants
│   ├── requirements.txt
│   ├── indexer/
│   │   ├── gcs.py            # GCS list/download helpers
│   │   ├── melody_extractor.py  # pitch extraction (pYIN + basic-pitch)
│   │   ├── build_index.py    # offline indexing pipeline
│   │   └── index_store.py    # save/load index (joblib)
│   ├── search/
│   │   ├── query_processor.py   # humming bytes → contour
│   │   └── retrieval.py      # DTW matching, top-k ranking, MRR eval
│   ├── api/
│   │   ├── search.py         # POST /api/search
│   │   └── tracks.py         # GET /api/tracks
│   └── data/
│       └── index/            # generated; not committed
├── frontend/
│   ├── index.html
│   ├── app.js                # recorder + API calls + player
│   └── style.css
└── scripts/
    ├── index_library.py      # run this offline
    ├── evaluate.py           # MRR / top-k evaluation
    └── test_search.py        # quick CLI smoke test
```

---

## Quick Start

### 1. Install dependencies

```bash
cd webapp/backend
pip install -r requirements.txt
```

### 2. Authenticate with GCS

```bash
gcloud auth application-default login
# or: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
```

### 3. Build the melody index (offline, run once)

```bash
cd webapp
python scripts/index_library.py
# Add --limit 5 to test with 5 tracks first
# Add --force to rebuild an existing index
```

### 4. Start the server

```bash
cd webapp/backend
uvicorn main:app --reload --port 8000
```

### 5. Open the app

Open `http://localhost:8000` in your browser.
Hold the record button, hum a melody, release → results appear.

---

## API

### `POST /api/search`

```
Content-Type: multipart/form-data
Fields:
  audio  (file)  – WebM/WAV audio blob
  top_k  (int)   – number of results (default 10)

Response 200:
{
  "results": [
    {
      "track_id": "bohemian_rhapsody",
      "score": 0.823,
      "matched_segment": { "start_sec": 45.0, "end_sec": 55.0 },
      "confidence": "high",
      "gcs_uri": "gs://musicetre/bohemian_rhapsody.mp3",
      "duration_sec": 354.2
    },
    ...
  ],
  "query_duration_sec": 6.2,
  "voiced_ratio": 0.74,
  "top_k": 10
}
```

### `GET /api/tracks`

List all indexed tracks with metadata.

### `GET /api/tracks/{track_id}/url`

Get a signed GCS URL for browser playback.

### `GET /api/health`

Returns index size (tracks, segments).

### `POST /api/admin/reindex`

Trigger re-indexing inline (for small libraries or testing).

---

## Evaluation

Record some humming samples where you know the answer:

```bash
# query-dir/ contains: song_name.wav files
# File stem must match the track_id in the index (audio filename without extension)
python scripts/evaluate.py --query-dir ./my_hums/ --top-k 10
```

Target metrics for a 100-track library:
- MRR > 0.3 = baseline is working
- MRR > 0.6 = good
- Top-1 > 50% = ready for daily use

---

## Roadmap

### Phase 1 – Baseline (current)
- [x] pYIN F0 extraction for humming
- [x] basic-pitch melody extraction for tracks
- [x] Relative semitone interval representation
- [x] DTW-based retrieval
- [x] Segment-based indexing (10s windows, 5s hop)
- [x] FastAPI backend + browser recorder frontend
- [x] GCS integration + signed URL playback

### Phase 2 – Better retrieval
- [ ] Vocal/accompaniment separation (Demucs) before pYIN on tracks
- [ ] Chromagram or log-mel based similarity (fallback/ensemble)
- [ ] Weighted score aggregation across segments
- [ ] Result caching
- [ ] Track metadata (artist, title from ID3 tags)

### Phase 3 – Learned retrieval (Google-inspired)
- [ ] Collect (humming, track_segment) paired data
- [ ] Generate synthetic humming via pitch-shift + noise augmentation
- [ ] Train CNN encoder: humming → embedding, track segment → embedding
- [ ] Contrastive / triplet loss to close the modality gap
- [ ] Replace DTW with ANN vector search (FAISS or Qdrant)

---

## Tuning Tips

**If results are poor:**
1. Check `voiced_ratio` in API response. If < 0.4, humming is not being detected.
2. Try `--source track_pyin` if basic-pitch is too slow.
3. Increase `SEGMENT_DURATION` in `config.py` for songs with long intros.
4. Lower `BASIC_PITCH_ONSET_THRESHOLD` in `config.py` to catch more notes.

**DTW window:**
- Set `DTW_WINDOW` in `config.py` to a small value (e.g. 20) to speed up DTW
  at the cost of less warping flexibility.
