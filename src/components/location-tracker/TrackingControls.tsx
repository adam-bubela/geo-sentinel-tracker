
import React from "react";
import { Clock, MapPin, Wifi, WifiOff, Check, X, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Coordinates } from "@/types/location-tracker";

interface TrackingHeaderProps {
  isTracking: boolean;
  isOnline: boolean;
  backgroundTracking?: boolean;
}

export const TrackingHeader: React.FC<TrackingHeaderProps> = ({
  isTracking,
  isOnline,
  backgroundTracking
}) => {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <Badge variant={isTracking ? "default" : "outline"} className="text-xs font-normal py-0">
        {isTracking ? "Active" : "Inactive"}
      </Badge>
      
      <Badge variant={isOnline ? "default" : "destructive"} className="text-xs font-normal py-0">
        {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {isOnline ? "Online" : "Offline"}
      </Badge>
      
      {backgroundTracking && (
        <Badge variant="secondary" className="text-xs font-normal py-0">
          <Smartphone className="h-3 w-3 mr-1" />
          Background
        </Badge>
      )}
    </div>
  );
};

interface TrackingControlsProps {
  isTracking: boolean;
  isOnline: boolean;
  isGeolocationSupported: boolean;
  lastSentLocation: Coordinates | null;
  toggleTracking: () => void;
  backgroundTracking?: boolean;
  toggleBackgroundTracking?: () => void;
  isBackgroundSyncSupported?: boolean;
}

export const TrackingControls: React.FC<TrackingControlsProps> = ({
  isTracking,
  isOnline,
  isGeolocationSupported,
  lastSentLocation,
  toggleTracking,
  backgroundTracking = false,
  toggleBackgroundTracking,
  isBackgroundSyncSupported = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant={isTracking ? "destructive" : "default"}
            size="sm"
            onClick={toggleTracking}
            disabled={!isGeolocationSupported}
            className="h-9 transition-all duration-300"
          >
            {isTracking ? (
              <>
                <X className="mr-1 h-4 w-4" /> Stop
              </>
            ) : (
              <>
                <Check className="mr-1 h-4 w-4" /> Start
              </>
            )}
          </Button>
          <div className="text-sm">
            <p className="font-medium">Tracking {isTracking ? "active" : "inactive"}</p>
            <p className="text-xs text-muted-foreground">
              {isTracking ? "Sending periodic updates" : "Press Start to begin"}
            </p>
          </div>
        </div>
        
        {isBackgroundSyncSupported && (
          <div className="flex items-center space-x-2">
            <Switch
              id="background-mode"
              checked={backgroundTracking}
              onCheckedChange={toggleBackgroundTracking}
              disabled={!isBackgroundSyncSupported}
            />
            <label 
              htmlFor="background-mode" 
              className="text-sm cursor-pointer select-none"
            >
              Background mode
            </label>
          </div>
        )}
      </div>
      
      {lastSentLocation && (
        <div className="bg-muted/50 rounded-lg p-3 text-xs">
          <div className="flex items-center mb-1">
            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="text-muted-foreground">Last update sent:</span>
          </div>
          <div className="flex items-start">
            <MapPin className="h-3 w-3 mr-1 mt-0.5 text-muted-foreground" />
            <div>
              <div>Lat: {lastSentLocation.latitude.toFixed(6)}</div>
              <div>Lng: {lastSentLocation.longitude.toFixed(6)}</div>
              <div className="text-muted-foreground">
                {new Date(lastSentLocation.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
