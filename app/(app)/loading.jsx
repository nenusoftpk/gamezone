export default function Loading() {
  return (
    <section className="workspace-loading" aria-busy="true" aria-label="Loading workspace">
      <div className="workspace-loading-head">
        <div className="skeleton-block skeleton-title" aria-hidden="true" />
        <div className="skeleton-block skeleton-subtitle" aria-hidden="true" />
      </div>
      <div className="workspace-loading-stats" aria-hidden="true">
        {[1, 2, 3].map((item) => <div className="workspace-loading-stat" key={item}><span className="skeleton-block" /><span className="skeleton-block" /></div>)}
      </div>
      <div className="workspace-loading-panel" aria-hidden="true">
        <div className="skeleton-block skeleton-title" />
        <div className="workspace-loading-lines">
          {[1, 2, 3, 4].map((item) => <span className="skeleton-block" key={item} />)}
        </div>
      </div>
      <p className="workspace-loading-label" role="status"><span className="loading-spinner" aria-hidden="true" />Loading your workspace...</p>
    </section>
  );
}
