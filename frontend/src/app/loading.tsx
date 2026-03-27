export default function Loading() {
  return (
    <div className="page-loader-overlay">
      {/* Top progress bar */}
      <div className="page-loader-bar" />

      {/* Centre spinner */}
      <div className="page-loader-center">
        <div className="page-loader-ring" />
        <p className="page-loader-text">Loading…</p>
      </div>
    </div>
  )
}
