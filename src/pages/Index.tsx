
import { useEffect } from "react";
import LocationTracker from "@/components/LocationTracker";
import { Toaster } from "@/components/ui/sonner";

const Index = () => {
  // Register service worker for PWA capabilities
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          })
          .catch(error => {
            console.log('ServiceWorker registration failed: ', error);
          });
      });
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
