import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons";

interface CountdownTimerProps {
  initialTimeInSeconds: number;
  onTimeUp: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CountdownTimer({ 
  initialTimeInSeconds, 
  onTimeUp, 
  className,
  size = "md"
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isRunning, setIsRunning] = useState(true);
  
  // Calculate percentage of time left
  const percentage = Math.max(0, (timeLeft / initialTimeInSeconds) * 100);
  
  // Format the time as MM:SS
  const formatTime = useCallback((timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Get color based on time percentage
  const getTimerColor = useCallback((percentage: number) => {
    if (percentage > 50) return "text-green-600";
    if (percentage > 25) return "text-yellow-600";
    return "text-red-600";
  }, []);
  
  const getProgressColor = useCallback((percentage: number) => {
    if (percentage > 50) return "bg-green-600";
    if (percentage > 25) return "bg-yellow-600";
    return "bg-red-600";
  }, []);
  
  // Set up countdown timer
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          setIsRunning(false);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [isRunning, timeLeft, onTimeUp]);
  
  // Get size based on prop
  const getSize = () => {
    switch (size) {
      case "sm": return "text-sm";
      case "lg": return "text-lg";
      default: return "text-base";
    }
  };
  
  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icons.clock className={cn("mr-1 h-4 w-4", getTimerColor(percentage))} />
          <span className={cn("font-medium", getSize(), getTimerColor(percentage))}>
            {formatTime(timeLeft)}
          </span>
        </div>
        
        {size !== "sm" && (
          <div className="text-xs text-gray-500">
            {percentage <= 25 ? (
              <span className="text-red-600 font-medium">Running Out of Time!</span>
            ) : (
              <span>Time Remaining</span>
            )}
          </div>
        )}
      </div>
      
      <Progress 
        value={percentage} 
        className="h-1.5"
        indicatorClassName={getProgressColor(percentage)}
      />
    </div>
  );
}