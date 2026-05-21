import { useState, useEffect } from 'react';

function isIOSSafari() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export default function InstallButton() {
  const [prompt,       setPrompt]       = useState(null);
  const [installed,    setInstalled]    = useState(isInstalled);
  const [showIOSHelp,  setShowIOSHelp]  = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  // Android / Chrome — native one-tap install
  if (prompt) {
    return (
      <button className="install-btn" onClick={async () => {
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') setInstalled(true);
        setPrompt(null);
      }}>
        Install App
      </button>
    );
  }

  // iOS Safari — can't trigger programmatically, show instructions
  if (isIOSSafari()) {
    return (
      <div className="ios-install">
        <button className="install-btn" onClick={() => setShowIOSHelp(h => !h)}>
          Install App
        </button>
        {showIOSHelp && (
          <div className="ios-tooltip">
            Tap the <strong>Share</strong> button then <strong>"Add to Home Screen"</strong>
          </div>
        )}
      </div>
    );
  }

  return null;
}
