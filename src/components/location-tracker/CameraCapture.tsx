
import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, ImageIcon } from "lucide-react";

interface CameraCaptureProps {
  isCameraActive: boolean;
  capturedImage: string | null;
  isCameraSupported: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startCamera: () => void;
  stopCamera: () => void;
  captureImage: () => void;
  discardImage: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isCameraActive,
  capturedImage,
  isCameraSupported,
  videoRef,
  canvasRef,
  startCamera,
  stopCamera,
  captureImage,
  discardImage
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Camera</h3>
          <p className="text-sm text-muted-foreground">
            {capturedImage 
              ? "Image ready to send with location" 
              : isCameraActive
                ? "Camera is active"
                : "Capture image to send with location"}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {!isCameraActive && !capturedImage && (
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
          
          {isCameraActive && (
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
          
          {capturedImage && (
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
      
      {isCameraActive && (
        <div className="rounded-lg overflow-hidden bg-black relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-auto"
          />
        </div>
      )}
      
      {capturedImage && (
        <div className="rounded-lg overflow-hidden relative bg-secondary p-2">
          <div className="flex items-center space-x-2 mb-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Captured Image</span>
          </div>
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="w-full h-auto rounded"
          />
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
