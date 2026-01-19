import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function PWAInstallPrompt() {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Get app name from theme, fallback to config, then default
  const appName = theme?.organizationName || window.APP_CONFIG?.APP_TITLE || 'Community Portal';

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed || standalone) return;

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show iOS prompt after a delay if on iOS Safari
    if (ios && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">Install {appName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isIOS
              ? 'Add to your home screen for quick access'
              : 'Install our app for a better experience'
            }
          </p>
        </div>
      </div>

      {isIOS ? (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <span>Tap</span>
            <Share className="w-4 h-4" />
            <span>then "Add to Home Screen"</span>
          </p>
        </div>
      ) : (
        <button
          onClick={handleInstall}
          className="mt-4 w-full btn btn-primary flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      )}
    </div>
  );
}
