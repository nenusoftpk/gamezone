export default function Loading() {
  return (
    <main className="loading-screen" aria-busy="true">
      <div className="loading-card">
        <img className="loading-logo" src="/icon.png" alt="" width="52" height="52" />
        <div className="loading-spinner" aria-hidden="true" />
        <p role="status">Preparing your workspace...</p>
      </div>
    </main>
  );
}
