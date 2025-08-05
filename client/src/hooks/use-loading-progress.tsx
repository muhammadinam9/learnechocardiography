import { useState, useEffect } from "react";

// Used for simulating progress during async operations
export function useLoadingProgress(
  isLoading: boolean, 
  options: { 
    initialProgress?: number,
    incrementRate?: number, 
    maxProgress?: number,
    duration?: number
  } = {}
) {
  const {
    initialProgress = 0,
    incrementRate = 5,
    maxProgress = 95,
    duration = 100
  } = options;
  
  const [progress, setProgress] = useState(initialProgress);
  
  useEffect(() => {
    if (!isLoading) {
      setProgress(100); // Complete when done loading
      return;
    }
    
    setProgress(initialProgress);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        // Slow down progress as it gets closer to maxProgress
        const increment = Math.max(0.5, incrementRate * (1 - prev / 100));
        const newProgress = prev + increment;
        
        if (newProgress >= maxProgress) {
          clearInterval(interval);
          return maxProgress;
        }
        
        return newProgress;
      });
    }, duration);
    
    return () => clearInterval(interval);
  }, [isLoading, initialProgress, incrementRate, maxProgress, duration]);
  
  return progress;
}