import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";

interface TimedQuizConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId?: string;
}

export function TimedQuizConfig({ open, onOpenChange, topicId }: TimedQuizConfigProps) {
  const [, navigate] = useLocation();
  const [timeLimit, setTimeLimit] = useState(60); // Default: 60 seconds per question
  const [questionCount, setQuestionCount] = useState(10); // Default: 10 questions
  
  // Debug when dialog opens/closes
  useEffect(() => {
    console.log("TimedQuizConfig component - open state:", open);
  }, [open]);
  
  // Calculated total time
  const totalTime = timeLimit * questionCount;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start timed quiz with configurations
  const startTimedQuiz = () => {
    console.log("Starting timed quiz with config:", { timeLimit, questionCount, topicId });
    
    // Calculate the time limit in minutes
    const timeLimitInMinutes = Math.ceil(totalTime / 60);
    
    // Navigate to practice session with timed quiz parameters
    const timeLimitParam = `timeLimit=${timeLimitInMinutes}`;
    const questionCountParam = `count=${questionCount}`;
    const timedParam = 'timed=true';
    
    const path = topicId 
      ? `/practice/${topicId}?${timedParam}&${timeLimitParam}&${questionCountParam}`
      : `/practice?${timedParam}&${timeLimitParam}&${questionCountParam}`;
    
    console.log("Navigating to:", path);
    navigate(path);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.clock className="h-5 w-5 text-primary" />
            Configure Timed Quiz
          </DialogTitle>
          <DialogDescription>
            Set your preferred time limit and number of questions for this timed quiz.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Question Count */}
          <div className="space-y-2">
            <Label htmlFor="question-count">Number of Questions</Label>
            <Select 
              value={questionCount.toString()} 
              onValueChange={(value) => setQuestionCount(parseInt(value))}
            >
              <SelectTrigger id="question-count">
                <SelectValue placeholder="Select number of questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="15">15 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
                <SelectItem value="25">25 Questions</SelectItem>
                <SelectItem value="30">30 Questions</SelectItem>
                <SelectItem value="40">40 Questions</SelectItem>
                <SelectItem value="50">50 Questions</SelectItem>
                <SelectItem value="100">Up to 100 Questions</SelectItem>
                <SelectItem value="9999">All Questions in Topic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Time Limit Slider */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Time Per Question</Label>
              <span className="text-sm font-medium">{timeLimit} seconds</span>
            </div>
            
            <Slider
              value={[timeLimit]}
              min={15}
              max={180}
              step={15}
              onValueChange={(value) => setTimeLimit(value[0])}
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>15s</span>
              <span>30s</span>
              <span>60s</span>
              <span>90s</span>
              <span>120s</span>
              <span>180s</span>
            </div>
          </div>
          
          {/* Total Quiz Time */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Quiz Time</span>
              <span className="text-lg font-bold text-primary">{formatTime(totalTime)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You'll have {formatTime(totalTime)} to answer {questionCount} questions.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={startTimedQuiz} className="gap-2">
            <Icons.clock className="h-4 w-4" />
            Start Timed Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}