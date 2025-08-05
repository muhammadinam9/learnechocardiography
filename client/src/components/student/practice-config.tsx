import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PracticeConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId?: string;
}

export function PracticeConfig({ open, onOpenChange, topicId }: PracticeConfigProps) {
  const [, navigate] = useLocation();
  const [questionCount, setQuestionCount] = useState<string>("10");
  
  const handleQuestionCountChange = (value: string) => {
    setQuestionCount(value);
  };
  
  const startPractice = () => {
    const params = new URLSearchParams();
    params.append("count", questionCount);
    
    if (topicId) {
      navigate(`/practice/${topicId}?${params.toString()}`);
    } else {
      navigate(`/practice?${params.toString()}`);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regular Practice Configuration</DialogTitle>
          <DialogDescription>
            Configure your practice session settings for {topicId ? "this topic" : "all topics"}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Question Count */}
          <div className="space-y-2">
            <Label htmlFor="question-count">Number of Questions</Label>
            <Select
              value={questionCount}
              onValueChange={handleQuestionCountChange}
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
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center">
              <Icons.check className="h-4 w-4 text-gray-500 mr-2" />
              <p className="text-sm text-gray-600">
                Select how many questions you want to practice with. You can take your time and there's no time limit for regular practice.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={startPractice} className="gap-2">
            <Icons.questions className="h-4 w-4" />
            Start Practice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}