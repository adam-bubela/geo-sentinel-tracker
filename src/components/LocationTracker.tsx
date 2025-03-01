import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocationTracking } from "@/hooks/use-location-tracking";
import { LocationDisplay } from "@/components/location-tracker/LocationDisplay";
import { CameraCapture } from "@/components/location-tracker/CameraCapture";
import { StatusNotifications } from "@/components/location-tracker/StatusNotifications";
import { TrackingControls, TrackingHeader } from "@/components/location-tracker/TrackingControls";
import { UPDATE_INTERVAL } from "@/types/location-tracker";

const LocationTracker = () => {
  const {
    state,
    refs,
    capabilities,
    actions
  } = useLocationTracking();

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-opacity-50 fade-in">
      <CardHeader>
        <TrackingHeader 
          isTracking={state.isTracking} 
          isOnline={state.isOnline} 
        />
        
        <CardTitle>
          {/* Title content rendered via TrackingHeader */}
        </CardTitle>
        
        <CardDescription>
          Secure location tracking with periodic updates to your server.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <StatusNotifications 
            error={state.error} 
            pendingUpdates={state.pendingUpdates} 
          />
          
          <TrackingControls 
            isTracking={state.isTracking}
            isOnline={state.isOnline}
            isGeolocationSupported={capabilities.isGeolocationSupported}
            lastSentLocation={state.lastSentLocation}
            toggleTracking={actions.toggleTracking}
          />
          
          <CameraCapture 
            isCameraActive={state.isCameraActive}
            capturedImage={state.capturedImage}
            isCameraSupported={capabilities.isCameraSupported}
            videoRef={refs.videoRef}
            canvasRef={refs.canvasRef}
            startCamera={actions.startCamera}
            stopCamera={actions.stopCamera}
            captureImage={actions.captureImage}
            discardImage={actions.discardImage}
          />
          
          <LocationDisplay 
            isTracking={state.isTracking}
            currentLocation={state.currentLocation}
            nextUpdateIn={state.nextUpdateIn}
            updateInterval={UPDATE_INTERVAL}
            showDetails={state.showDetails}
            toggleDetails={actions.toggleDetails}
            formatCoord={actions.formatCoord}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="w-full flex justify-center">
          <Button 
            variant={state.isTracking ? "destructive" : "default"}
            onClick={actions.toggleTracking}
            className="w-full max-w-xs transition-all duration-300"
            disabled={!capabilities.isGeolocationSupported}
          >
            {state.isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LocationTracker;
