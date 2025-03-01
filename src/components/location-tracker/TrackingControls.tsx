
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, MapPin, CheckCircle2 } from "lucide-react";
import { Coordinates } from "@/types/location-tracker";

interface TrackingControlsProps {
  isTracking: boolean;
  isOnline: boolean;
  isGeolocationSupported: boolean;
  lastSentLocation: Coordinates | null;
  toggleTracking: () => void;
}

export const TrackingControls: React.FC<TrackingControlsProps> = ({
  isTracking,
  isOnline,
  isGeolocationSupported,
  lastSentLocation,
  toggleTracking
}) => {
  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <div className="mr-3">
            {isTracking ? (
              <div className="bg-green-500 status-indicator"></div>
            ) : (
              <div className="bg-gray-300 status-indicator"></div>
            )}
          </div>
          <div>
            <h3 className="font-medium">Location Tracking</h3>
            <p className="text-sm text-muted-foreground">
              {isTracking 
                ? "Actively monitoring your position" 
                : "Toggle to start tracking your location"}
            </p>
          </div>
        </div>
        
        <Switch
          checked={isTracking}
          onCheckedChange={toggleTracking}
          disabled={!isGeolocationSupported}
          className="data-[state=checked]:bg-green-500"
        />
      </div>
      
      <div className="w-full text-center text-sm text-muted-foreground">
        {lastSentLocation && (
          <p className="flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
            Last update: {new Date(lastSentLocation.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </>
  );
};

export const TrackingHeader: React.FC<{
  isTracking: boolean;
  isOnline: boolean;
}> = ({ isTracking, isOnline }) => (
  <>
    <div className="flex items-center justify-between mb-2">
      <Badge 
        variant={isTracking ? "default" : "outline"}
        className="transition-all duration-300"
      >
        {isTracking ? "Tracking Active" : "Tracking Inactive"}
      </Badge>
      
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="ml-2"
      >
        {isOnline ? 
          <Wifi className="h-3 w-3 mr-1" /> : 
          <WifiOff className="h-3 w-3 mr-1" />
        }
        {isOnline ? "Online" : "Offline"}
      </Badge>
    </div>
    
    <div className="text-xl flex items-center">
      <MapPin className="h-5 w-5 mr-2" />
      Geo Sentinel Tracker
    </div>
  </>
);
