export default function AuthLoading() {
  return (
    <div className="page-loader-overlay">
      <div className="page-loader-bar" />
      <div className="page-loader-center">
        <div className="page-loader-ring" />
        <p className="page-loader-text">Loading…</p>
      </div>
    </div>
  )
}
