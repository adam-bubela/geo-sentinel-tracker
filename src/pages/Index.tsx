
import { useEffect } from "react";
import LocationTracker from "@/components/LocationTracker";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const Index = () => {
  // Register service worker for PWA capabilities
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            
            // Check for service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    toast.info("App update available", {
                      description: "Refresh to get the latest version.",
                      action: {
                        label: "Refresh",
                        onClick: () => window.location.reload()
                      }
                    });
                  }
                });
              }
            });
          })
          .catch(error => {
            console.error('ServiceWorker registration failed: ', error);
            toast.error("Service Worker Error", {
              description: "Background tracking may not work properly."
            });
          });
      });
    }
    
    // Request permission for notifications to enable background sync
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
    
    // Request wake lock if available to prevent device from sleeping
    if ('wakeLock' in navigator) {
      const requestWakeLock = async () => {
        try {
          // @ts-ignore - TypeScript doesn't know about wakeLock yet
          const wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock is active');
          
          // Release wake lock when page is hidden
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && wakeLock) {
              wakeLock.release().then(() => {
                console.log('Wake Lock released');
              });
            } else if (document.visibilityState === 'visible') {
              requestWakeLock();
            }
          });
        } catch (err) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      };
      
      requestWakeLock();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-4 flex flex-col items-center justify-center">
      <Toaster position="top-center" />
      
      <div className="w-full max-w-md px-4 pb-8 pt-16">
        <LocationTracker />
      </div>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Geo Sentinel Tracker &copy; {new Date().getFullYear()}</p>
        <p className="text-xs mt-1">Privacy focused location tracking</p>
      </footer>
    </div>
  );
};

export default Index;
