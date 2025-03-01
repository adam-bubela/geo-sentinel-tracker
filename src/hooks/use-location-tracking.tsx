
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Coordinates, LocationState, API_ENDPOINT, UPDATE_INTERVAL } from "@/types/location-tracker";

export function useLocationTracking() {
  const [state, setState] = useState<LocationState>({
    isTracking: false,
    currentLocation: null,
    lastSentLocation: null,
    error: null,
    nextUpdateIn: UPDATE_INTERVAL,
    isOnline: navigator.onLine,
    pendingUpdates: 0,
    showDetails: false,
    capturedImage: null,
    isCameraActive: false,
  });

  const locationWatchId = useRef<number | null>(null);
  const sendIntervalId = useRef<number | null>(null);
  const countdownIntervalId = useRef<number | null>(null);
  const pendingLocations = useRef<Coordinates[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const isGeolocationSupported = 'geolocation' in navigator;
  const isCameraSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  // Handle online status changes
  useEffect(() => {
    const handleOnlineStatus = () => {
      setState(prev => ({ ...prev, isOnline: navigator.onLine }));
      
      if (navigator.onLine && pendingLocations.current.length > 0) {
        toast("Connection restored", {
          description: `Sending ${pendingLocations.current.length} pending location updates.`,
        });
        
        sendPendingLocations();
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Clean up all resources on unmount
  useEffect(() => {
    return () => {
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
      
      if (sendIntervalId.current) {
        clearInterval(sendIntervalId.current);
      }
      
      if (countdownIntervalId.current) {
        clearInterval(countdownIntervalId.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startTracking = () => {
    if (!isGeolocationSupported) {
      setState(prev => ({ 
        ...prev, 
        error: "Geolocation is not supported by your browser.",
        isTracking: false 
      }));
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support location tracking.",
      });
      return;
    }

    try {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          setState(prev => ({
            ...prev,
            currentLocation: newLocation,
            error: null
          }));
        },
        (error) => {
          let errorMessage = "Unknown error occurred.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          
          setState(prev => ({ 
            ...prev, 
            error: errorMessage,
            isTracking: false 
          }));
          
          toast.error("Location error", {
            description: errorMessage,
          });
          
          stopTracking();
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 10000, 
          timeout: 10000 
        }
      );

      sendIntervalId.current = window.setInterval(() => {
        if (state.currentLocation) {
          sendLocation(state.currentLocation);
        }
      }, UPDATE_INTERVAL * 1000);

      countdownIntervalId.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          nextUpdateIn: prev.nextUpdateIn > 0 ? prev.nextUpdateIn - 1 : UPDATE_INTERVAL
        }));
      }, 1000);

      setState(prev => ({ 
        ...prev, 
        isTracking: true,
        nextUpdateIn: UPDATE_INTERVAL
      }));
      
      toast.success("Tracking started", {
        description: "Your location is now being tracked."
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: "Failed to start location tracking.",
        isTracking: false 
      }));
      
      toast.error("Tracking error", {
        description: "Failed to start location tracking.",
      });
    }
  };

  const stopTracking = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    
    if (sendIntervalId.current) {
      clearInterval(sendIntervalId.current);
      sendIntervalId.current = null;
    }
    
    if (countdownIntervalId.current) {
      clearInterval(countdownIntervalId.current);
      countdownIntervalId.current = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      isTracking: false
    }));
    
    toast.info("Tracking stopped", {
      description: "Location tracking has been stopped."
    });
  };

  const toggleTracking = () => {
    if (state.isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const sendLocation = async (location: Coordinates) => {
    if (!state.isOnline) {
      pendingLocations.current.push(location);
      setState(prev => ({ 
        ...prev, 
        pendingUpdates: pendingLocations.current.length
      }));
      return;
    }

    try {
      const data = {
        location,
        image: state.capturedImage || null,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      setState(prev => ({
        ...prev,
        lastSentLocation: location,
        nextUpdateIn: UPDATE_INTERVAL,
        capturedImage: null
      }));
      
      if (!state.lastSentLocation) {
        toast.success("Location sent", {
          description: `Location${state.capturedImage ? ' and image' : ''} sent successfully.`,
        });
      }
    } catch (error) {
      console.error("Failed to send location:", error);
      
      pendingLocations.current.push(location);
      setState(prev => ({ 
        ...prev, 
        pendingUpdates: pendingLocations.current.length
      }));
      
      toast.error("Failed to send location", {
        description: "We'll retry when connection improves.",
      });
    }
  };

  const sendPendingLocations = useCallback(async () => {
    if (!state.isOnline || pendingLocations.current.length === 0) return;
    
    const locations = [...pendingLocations.current];
    pendingLocations.current = []; // Clear immediately to avoid duplicates
    
    setState(prev => ({ ...prev, pendingUpdates: 0 }));
    
    try {
      for (const location of locations) {
        const data = {
          location,
          image: state.capturedImage || null,
          timestamp: new Date().toISOString()
        };

        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
      }
      
      setState(prev => ({
        ...prev,
        capturedImage: null
      }));
      
      toast.success("Pending locations sent", {
        description: `${locations.length} location updates sent successfully.`,
      });
    } catch (error) {
      console.error("Failed to send pending locations:", error);
      
      pendingLocations.current = [...pendingLocations.current, ...locations];
      setState(prev => ({ 
        ...prev, 
        pendingUpdates: pendingLocations.current.length
      }));
      
      toast.error("Failed to send pending locations", {
        description: "Will retry again later.",
      });
    }
  }, [state.isOnline, state.capturedImage]);

  // Camera functions
  const startCamera = async () => {
    if (!isCameraSupported) {
      toast.error("Camera not supported", {
        description: "Your browser doesn't support camera access.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setState(prev => ({ ...prev, isCameraActive: true, error: null }));
      }
    } catch (error) {
      console.error("Camera error:", error);
      setState(prev => ({ 
        ...prev, 
        error: "Failed to access camera. Please check permissions.",
        isCameraActive: false
      }));
      
      toast.error("Camera error", {
        description: "Failed to access camera. Please check permissions.",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setState(prev => ({ ...prev, isCameraActive: false }));
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setState(prev => ({ ...prev, capturedImage: imageData }));
      stopCamera();
      
      toast.success("Image captured", {
        description: "Image will be sent with the next location update.",
      });
    }
  };

  const discardImage = () => {
    setState(prev => ({ ...prev, capturedImage: null }));
    toast.info("Image discarded");
  };

  const toggleDetails = () => {
    setState(prev => ({ ...prev, showDetails: !prev.showDetails }));
  };

  const formatCoord = (value: number) => {
    return value ? value.toFixed(6) : "N/A";
  };

  return {
    state,
    refs: {
      videoRef,
      canvasRef
    },
    capabilities: {
      isGeolocationSupported,
      isCameraSupported
    },
    actions: {
      toggleTracking,
      startCamera,
      stopCamera,
      captureImage,
      discardImage,
      toggleDetails,
      formatCoord
    }
  };
}
