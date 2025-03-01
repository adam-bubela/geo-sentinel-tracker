
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Coordinates } from "@/types/location-tracker";

interface LocationDisplayProps {
  isTracking: boolean;
  currentLocation: Coordinates | null;
  nextUpdateIn: number;
  updateInterval: number;
  showDetails: boolean;
  toggleDetails: () => void;
  formatCoord: (value: number) => string;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  isTracking,
  currentLocation,
  nextUpdateIn,
  updateInterval,
  showDetails,
  toggleDetails,
  formatCoord
}) => {
  if (!isTracking || !currentLocation) return null;

  return (
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Next update in:</span>
          <span className="font-medium">{nextUpdateIn}s</span>
        </div>
        <Progress 
          value={(1 - nextUpdateIn / updateInterval) * 100} 
          className="h-2"
        />
      </div>
      
      <div className="bg-secondary rounded-lg p-4 space-y-2 slide-up">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Current Location</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2" 
            onClick={toggleDetails}
          >
            {showDetails ? (
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
              {formatCoord(currentLocation.latitude)}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Longitude</span>
            <p className="font-mono text-sm">
              {formatCoord(currentLocation.longitude)}
            </p>
          </div>
        </div>
        
        {showDetails && (
          <div className="pt-2 space-y-2 slide-up">
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <p className="font-mono text-sm">
                ±{currentLocation.accuracy.toFixed(1)} meters
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Timestamp</span>
              <p className="font-mono text-sm">
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
