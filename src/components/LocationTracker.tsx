
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Wifi, WifiOff, AlertCircle, CheckCircle2, Camera, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";

// Define types
interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationState {
  isTracking: boolean;
  currentLocation: Coordinates | null;
  lastSentLocation: Coordinates | null;
  error: string | null;
  nextUpdateIn: number;
  isOnline: boolean;
  pendingUpdates: number;
  showDetails: boolean;
  capturedImage: string | null;
  isCameraActive: boolean;
}

// API endpoint configuration - should be updated with your actual API endpoint
const API_ENDPOINT = "https://your-api-endpoint.com/locations";
const UPDATE_INTERVAL = 60; // seconds

const LocationTracker = () => {
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
  
  // Check if geolocation is supported
  const isGeolocationSupported = 'geolocation' in navigator;
  // Check if camera is supported
  const isCameraSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  // Handle online/offline status
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

  // Start tracking function
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
      // Start watching position
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

      // Set interval for sending location
      sendIntervalId.current = window.setInterval(() => {
        if (state.currentLocation) {
          sendLocation(state.currentLocation);
        }
      }, UPDATE_INTERVAL * 1000);

      // Set countdown timer interval
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

  // Stop tracking function
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

  // Toggle tracking state
  const toggleTracking = () => {
    if (state.isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

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

  // Send location to API
  const sendLocation = async (location: Coordinates) => {
    if (!state.isOnline) {
      // If offline, store location to send later
      pendingLocations.current.push(location);
      setState(prev => ({ 
        ...prev, 
        pendingUpdates: pendingLocations.current.length
      }));
      return;
    }

    try {
      // Would be a real API call in production
      // Create data object including location and image if available
      const data = {
        location,
        image: state.capturedImage || null,
        timestamp: new Date().toISOString()
      };

      // Simulate API call for development
      console.log("Sending data to API:", data);
      
      // Reset countdown and clear captured image after sending
      setState(prev => ({
        ...prev,
        lastSentLocation: location,
        nextUpdateIn: UPDATE_INTERVAL,
        capturedImage: null // Clear image after sending
      }));
      
      // Simple success message for frequent updates
      if (!state.lastSentLocation) {
        toast.success("Location sent", {
          description: `Location${state.capturedImage ? ' and image' : ''} sent successfully.`,
        });
      }
    } catch (error) {
      console.error("Failed to send location:", error);
      
      // If we fail to send, add to pending
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

  // Send all pending locations
  const sendPendingLocations = useCallback(async () => {
    if (!state.isOnline || pendingLocations.current.length === 0) return;
    
    const locations = [...pendingLocations.current];
    pendingLocations.current = []; // Clear immediately to avoid duplicates
    
    setState(prev => ({ ...prev, pendingUpdates: 0 }));
    
    try {
      // Would be a batch API call in production
      // For each location, create a data object including the image if available
      const data = locations.map(location => ({
        location,
        image: state.capturedImage || null,
        timestamp: new Date().toISOString()
      }));

      // Simulate API call for development
      console.log("Sending pending data to API:", data);
      
      // Clear captured image after sending
      setState(prev => ({
        ...prev,
        capturedImage: null
      }));
      
      toast.success("Pending locations sent", {
        description: `${locations.length} location updates sent successfully.`,
      });
    } catch (error) {
      console.error("Failed to send pending locations:", error);
      
      // Put locations back in the queue
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

  // Clean up on unmount
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

  const toggleDetails = () => {
    setState(prev => ({ ...prev, showDetails: !prev.showDetails }));
  };

  // Format coordinates for display
  const formatCoord = (value: number) => {
    return value ? value.toFixed(6) : "N/A";
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-opacity-50 fade-in">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant={state.isTracking ? "default" : "outline"}
            className="transition-all duration-300"
          >
            {state.isTracking ? "Tracking Active" : "Tracking Inactive"}
          </Badge>
          
          <Badge 
            variant={state.isOnline ? "default" : "destructive"}
            className="ml-2"
          >
            {state.isOnline ? 
              <Wifi className="h-3 w-3 mr-1" /> : 
              <WifiOff className="h-3 w-3 mr-1" />
            }
            {state.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
        
        <CardTitle className="text-xl flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Geo Sentinel Tracker
        </CardTitle>
        
        <CardDescription>
          Secure location tracking with periodic updates to your server.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <div className="mr-3">
                {state.isTracking ? (
                  <div className="bg-green-500 status-indicator"></div>
                ) : (
                  <div className="bg-gray-300 status-indicator"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium">Location Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  {state.isTracking 
                    ? "Actively monitoring your position" 
                    : "Toggle to start tracking your location"}
                </p>
              </div>
            </div>
            
            <Switch
              checked={state.isTracking}
              onCheckedChange={toggleTracking}
              disabled={!isGeolocationSupported}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
          
          {/* Camera and Image Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Camera</h3>
                <p className="text-sm text-muted-foreground">
                  {state.capturedImage 
                    ? "Image ready to send with location" 
                    : state.isCameraActive
                      ? "Camera is active"
                      : "Capture image to send with location"}
                </p>
              </div>
              
              <div className="flex space-x-2">
                {!state.isCameraActive && !state.capturedImage && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={startCamera}
                    disabled={!isCameraSupported}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Open Camera
                  </Button>
                )}
                
                {state.isCameraActive && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={stopCamera}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={captureImage}
                    >
                      Capture
                    </Button>
                  </>
                )}
                
                {state.capturedImage && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={discardImage}
                  >
                    Discard
                  </Button>
                )}
              </div>
            </div>
            
            {state.isCameraActive && (
              <div className="rounded-lg overflow-hidden bg-black relative">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {state.capturedImage && (
              <div className="rounded-lg overflow-hidden relative bg-secondary p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Captured Image</span>
                </div>
                <img 
                  src={state.capturedImage} 
                  alt="Captured" 
                  className="w-full h-auto rounded"
                />
              </div>
            )}
            
            {/* Hidden canvas for image capturing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          {state.isTracking && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Next update in:</span>
                  <span className="font-medium">{state.nextUpdateIn}s</span>
                </div>
                <Progress 
                  value={(1 - state.nextUpdateIn / UPDATE_INTERVAL) * 100} 
                  className="h-2"
                />
              </div>
              
              {state.currentLocation && (
                <div className="bg-secondary rounded-lg p-4 space-y-2 slide-up">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Current Location</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2" 
                      onClick={toggleDetails}
                    >
                      {state.showDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Latitude</span>
                      <p className="font-mono text-sm">
                        {formatCoord(state.currentLocation.latitude)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Longitude</span>
                      <p className="font-mono text-sm">
                        {formatCoord(state.currentLocation.longitude)}
                      </p>
                    </div>
                  </div>
                  
                  {state.showDetails && (
                    <div className="pt-2 space-y-2 slide-up">
                      <Separator />
                      <div>
                        <span className="text-sm text-muted-foreground">Accuracy</span>
                        <p className="font-mono text-sm">
                          ±{state.currentLocation.accuracy.toFixed(1)} meters
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Timestamp</span>
                        <p className="font-mono text-sm">
                          {new Date(state.currentLocation.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Pending updates section for offline scenarios */}
          {state.pendingUpdates > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 slide-up">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <div>
                  <h3 className="font-medium text-amber-700 dark:text-amber-300">Pending Updates</h3>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {state.pendingUpdates} location updates waiting to be sent
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        {state.lastSentLocation && (
          <div className="w-full text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
              Last update: {new Date(state.lastSentLocation.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
        
        <div className="w-full flex justify-center">
          <Button 
            variant={state.isTracking ? "destructive" : "default"}
            onClick={toggleTracking}
            className="w-full max-w-xs transition-all duration-300"
            disabled={!isGeolocationSupported}
          >
            {state.isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LocationTracker;

