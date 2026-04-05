export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen-inner">
        <div className="loading-logo">
          <div className="loading-logo-icon">Z</div>
          <span className="loading-logo-text">
            Zentra<span className="loading-logo-highlight">CRM</span>
          </span>
        </div>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" />
        </div>
      </div>
    </div>
  );
}
