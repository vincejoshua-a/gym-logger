import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Small toast for service-worker lifecycle events:
 *  - offlineReady → confirms the app is cached and works with no connection.
 *  - needRefresh  → a newer build is available; tap to reload into it.
 *
 * With registerType "autoUpdate" the new version is applied automatically on
 * next load; this just gives you a visible signal that it happened.
 */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__msg">
        {needRefresh ? "New version available." : "Ready to work offline."}
      </span>
      {needRefresh && (
        <button className="toast__btn" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      )}
      <button className="toast__close" onClick={dismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
