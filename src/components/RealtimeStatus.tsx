import React from "react";

interface RealtimeStatusProps {
  isConnected: boolean;
  error: string | null;
  className?: string;
}

export function RealtimeStatus({ isConnected, error, className = "" }: RealtimeStatusProps) {
  if (error) {
    // Optionally, you could show a red dot for error
    return (
      <span
        className={`inline-block w-3 h-3 rounded-full bg-red-500 ${className}`}
        aria-label="Connection Error"
        title="Connection Error"
      />
    );
  }
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"} ${className}`}
      aria-label={isConnected ? "Online" : "Offline"}
      title={isConnected ? "Online" : "Offline"}
    />
  );
}
