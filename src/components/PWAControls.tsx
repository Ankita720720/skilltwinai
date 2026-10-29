import { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PWAControls() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.removeEventListener('appinstalled', onInstalled);
      };
    }

    let reloading = false;
    const onControllerChange = () => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setShowUpdate(true);
        }
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(worker);
              setShowUpdate(true);
            }
          });
        });
        // Check for a new build whenever the app is brought back into focus.
        const checkForUpdate = () => { if (document.visibilityState === 'visible') void registration.update(); };
        document.addEventListener('visibilitychange', checkForUpdate);
      })
      .catch((error) => console.error('Service worker registration failed:', error));

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') setInstallPrompt(null);
  };

  const update = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdate(false);
  };

  return (
    <>
      {!installed && (
        <button onClick={installPrompt ? install : () => setShowInstallHelp(true)} aria-label="Install SkillTwin Live"
          className="fixed bottom-5 right-5 z-[100] inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-xl hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
          <Download className="h-4 w-4" /> Install App
        </button>
      )} 
      {showInstallHelp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInstallHelp(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="install-help-title" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 id="install-help-title" className="font-bold text-navy">Install SkillTwin Live</h2>
              <button onClick={() => setShowInstallHelp(false)} aria-label="Close install help" className="p-1 text-muted"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-sm text-muted">Your browser doesn't offer a one-tap install prompt here. Try these steps:</p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-navy">
              <li><strong>Android / Chrome:</strong> open the browser menu (⋮) and choose <em>Install app</em> or <em>Add to Home screen</em>.</li>
              <li><strong>iPhone / iPad:</strong> open in Safari, tap Share, then <em>Add to Home Screen</em>.</li>
              <li><strong>Desktop:</strong> look for the install icon in the browser address bar or menu.</li>
            </ul>
          </section>
        </div>
      )}
      {showUpdate && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[110] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-2xl">
          <RefreshCw className="h-5 w-5 shrink-0 text-brand" />
          <p className="flex-1 text-sm text-navy">A new version of SkillTwin Live is ready.</p>
          <button onClick={update} className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white">Update</button>
          <button onClick={() => setShowUpdate(false)} aria-label="Dismiss update" className="p-1 text-muted"><X className="h-4 w-4" /></button>
        </div>
      )}
    </>
  );
}
