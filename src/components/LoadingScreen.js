const LoadingScreen = ({ message = "Preparing your session..." }) => (
  <main className="loading-screen" aria-live="polite">
    <div className="loading-mark">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <p>{message}</p>
  </main>
);

export default LoadingScreen;
