
import React from "react";
import { AlertCircle } from "lucide-react";

interface StatusNotificationsProps {
  error: string | null;
  pendingUpdates: number;
}

export const StatusNotifications: React.FC<StatusNotificationsProps> = ({
  error,
  pendingUpdates
}) => {
  return (
    <>
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {pendingUpdates > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 slide-up">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            <div>
              <h3 className="font-medium text-amber-700 dark:text-amber-300">Pending Updates</h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {pendingUpdates} location updates waiting to be sent
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
