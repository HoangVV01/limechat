import React from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

interface RealtimeStatusProps {
  isConnected: boolean;
  error: string | null;
  className?: string;
}

export function RealtimeStatus({
  isConnected,
  error,
  className = "",
}: RealtimeStatusProps) {
  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs">Connection Error</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-xs text-green-600">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Connecting...</span>
        </>
      )}
    </div>
  );
}
