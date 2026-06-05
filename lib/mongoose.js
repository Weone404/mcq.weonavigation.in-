// Legacy shim for code that used to call connectDB when the project used MongoDB.
// The app now uses Postgres via `lib/db.js`. This stub is a no-op to keep
// older call-sites working without requiring `mongoose` to be installed.
export async function connectDB() {
  return;
}
