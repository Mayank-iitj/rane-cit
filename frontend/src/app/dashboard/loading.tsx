export default function DashboardLoading() {
  return (
    <div className="page-loader-overlay page-loader-overlay--opaque">
      <div className="page-loader-bar" />
      <div className="page-loader-center">
        <div className="page-loader-ring" />
        <p className="page-loader-text">Loading dashboard…</p>
      </div>
    </div>
  )
}
