export interface Track {
  id:       string;   // display name — filename stem (e.g. "10cm - 그러나")
  blobName: string;   // GCS object path (e.g. "grp0/10cm - 그러나.mp3")
}
