import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { StudentHeader } from "@/components/student/header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Question, Topic, InsertSession, InsertSessionQuestion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { Progress } from "@/components/ui/progress";

export default function PracticeSession() {
  const { topicId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Get timed quiz parameters from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const isTimed = searchParams.get('timed') === 'true';
  const timeLimit = parseInt(searchParams.get('timeLimit') || '0', 10);
  
  // States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [timer, setTimer] = useState<number>(0);
  const [questionTimers, setQuestionTimers] = useState<number[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  
  // Get question count from URL search params
  const questionCount = parseInt(searchParams.get('count') || '10', 10);
  
  // Fetch questions for the selected topic
  const { data: questions, isLoading: isLoadingQuestions, error: questionsError } = useQuery<Question[]>({
    queryKey: ["/api/questions/random", topicId ? `?topicId=${topicId}` : "", `?count=${questionCount}`],
    queryFn: async () => {
      console.log(`Fetching ${questionCount} questions for topicId: ${topicId || "all topics"}`);
      const res = await fetch(`/api/questions/random?count=${questionCount}${topicId ? `&topicId=${topicId}` : ""}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        console.error("Failed to fetch questions:", errorData);
        throw new Error(`Failed to fetch questions: ${errorData.message || res.statusText}`);
      }
      const data = await res.json();
      console.log(`Received ${data.length} questions:`, data);
      return data;
    }
  });
  
  // Fetch topic details if topicId is provided
  const { data: topic } = useQuery<Topic>({
    queryKey: ["/api/topics", topicId],
    queryFn: async () => {
      if (!topicId) return null;
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("Failed to fetch topic");
      return res.json();
    },
    enabled: !!topicId
  });
  
  // Initialize answers array once questions are loaded
  useEffect(() => {
    if (questions) {
      setAnswers(new Array(questions.length).fill(null));
      setQuestionTimers(new Array(questions.length).fill(0));
    }
  }, [questions]);
  
  // Timer effect
  useEffect(() => {
    if (isLoadingQuestions || isSessionComplete) return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
      setQuestionTimers(prev => {
        const newTimers = [...prev];
        if (newTimers[currentQuestionIndex] !== undefined) {
          newTimers[currentQuestionIndex] += 1;
        }
        return newTimers;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLoadingQuestions, currentQuestionIndex, isSessionComplete]);
  
  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };
  
  // Navigate to previous/next question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const goToNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Complete session mutation
  const submitSessionMutation = useMutation({
    mutationFn: async () => {
      if (!questions) throw new Error("No questions available");
      
      // Calculate results
      const correctAnswers = answers.reduce((count, answer, index) => {
        if (answer === questions[index].correctOption) return count + 1;
        return count;
      }, 0);
      
      const totalQuestions = questions.length;
      const score = (correctAnswers / totalQuestions) * 100;
      
      // Create session
      const sessionData: InsertSession = {
        userId: 0, // This will be set by the server using the authenticated user
        topicId: topicId ? parseInt(topicId) : null,
        totalQuestions,
        correctAnswers,
        score,
        timeSpent: timer,
      };
      
      const sessionRes = await apiRequest("POST", "/api/sessions", sessionData);
      const session = await sessionRes.json();
      
      // Add session questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const answer = answers[i];
        const isCorrect = answer === question.correctOption;
        
        const sessionQuestionData: InsertSessionQuestion = {
          sessionId: session.id,
          questionId: question.id,
          selectedOption: answer,
          isCorrect,
          timeSpent: questionTimers[i],
        };
        
        await apiRequest("POST", `/api/sessions/${session.id}/questions`, sessionQuestionData);
      }
      
      return session;
    },
    onSuccess: (session) => {
      setIsSessionComplete(true);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/user"] });
      navigate(`/results/${session.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error submitting session",
        description: error.message || "Failed to submit your practice session. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Loading progress for submission animation
  const [showSubmitAnimation, setShowSubmitAnimation] = useState(false);
  const submissionProgress = useLoadingProgress(
    submitSessionMutation.isPending && showSubmitAnimation, 
    { initialProgress: 5, maxProgress: 90, duration: 80 }
  );

  // Submit the session
  const handleSubmitSession = () => {
    setShowSubmitAnimation(true);
    submitSessionMutation.mutate();
  };
  
  // Current question
  const currentQuestion = questions ? questions[currentQuestionIndex] : null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/">
                <a className="text-gray-500 hover:text-gray-700 mr-4">
                  <Icons.previous className="h-5 w-5" />
                </a>
              </Link>
              <div className="text-primary font-bold text-xl">MCQ Practice</div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isMobile && (
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {topicId ? topic?.name || "Loading..." : "All Topics"}
                </span>
              )}
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                Q {currentQuestionIndex + 1}/{questions?.length || "..."}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="py-6 px-4 sm:px-6 lg:px-8 mx-auto max-w-4xl">
        {/* Timer and Progress */}
        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center mb-6 ${isMobile ? 'gap-3' : ''}`}>
          <div className="flex items-center">
            {isTimed ? (
              <div className="bg-white px-3 py-2 rounded-lg shadow flex items-center">
                <CountdownTimer
                  initialTimeInSeconds={timeLimit * 60}
                  onTimeUp={() => {
                    setTimeExpired(true);
                    toast({
                      title: "Time's up!",
                      description: "Your time has expired. Your answers will be automatically submitted.",
                      variant: "destructive"
                    });
                    handleSubmitSession();
                  }}
                  size="md"
                  className="text-red-500 font-semibold"
                />
              </div>
            ) : (
              <div className="bg-white px-3 py-2 rounded-lg shadow-sm flex items-center">
                <Icons.clock className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-gray-900 font-medium">{formatTime(timer)}</span>
              </div>
            )}
            
            {isTimed && (
              <div className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-medium">
                Timed Quiz
              </div>
            )}
          </div>
          
          <div className="flex items-center w-full sm:w-auto">
            <div className="text-sm text-gray-500 mr-2">Progress:</div>
            <div className={`${isMobile ? 'w-full' : 'w-32'} bg-gray-200 rounded-full h-2 mr-2`}>
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${questions ? (currentQuestionIndex / questions.length) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              {currentQuestionIndex + 1}/{questions?.length || "..."}
            </div>
          </div>
        </div>
        
        {/* Question Card */}
        {isLoadingQuestions ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full mb-6" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-gray-200 bg-gray-50 p-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ) : currentQuestion ? (
          <Card className="mb-6">
            <CardHeader className="border-b border-gray-200">
              <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {topicId ? topic?.name : "Mixed Topics"}
                {currentQuestion.subtopic ? ` - ${currentQuestion.subtopic}` : ""}
              </p>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="mb-6">
                <p className="text-gray-900">{currentQuestion.text}</p>
                
                {/* Display question image if available */}
                {currentQuestion.imagePath && (
                  <div className="mt-4 flex justify-center bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <img 
                      src={currentQuestion.imagePath} 
                      alt="Question image" 
                      className="max-h-64 object-contain"
                    />
                  </div>
                )}
              </div>
              
              <RadioGroup 
                value={answers[currentQuestionIndex] || ""} 
                onValueChange={handleAnswerSelect}
                className="space-y-3"
              >
                {/* Answer option cards */}
                {[
                  { label: "A", value: "A", text: currentQuestion.optionA },
                  { label: "B", value: "B", text: currentQuestion.optionB },
                  { label: "C", value: "C", text: currentQuestion.optionC },
                  { label: "D", value: "D", text: currentQuestion.optionD },
                ].map((option) => (
                  <div className="answer-option" key={option.value}>
                    <Label 
                      htmlFor={`option-${option.value.toLowerCase()}`} 
                      className={`flex items-start p-4 border rounded-lg transition-all duration-200 
                        ${answers[currentQuestionIndex] === option.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-300 hover:border-primary/50'} 
                        cursor-pointer 
                        ${isMobile ? 'text-base' : 'text-sm'}`}
                    >
                      <RadioGroupItem 
                        value={option.value} 
                        id={`option-${option.value.toLowerCase()}`} 
                        className="mt-0.5" 
                      />
                      <span className="ml-3 w-full">
                        <span className="block font-medium text-gray-900">
                          {option.label}. {option.text}
                        </span>
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            
            <CardFooter className={`border-t border-gray-200 bg-gray-50 flex ${isMobile ? 'flex-col gap-3' : 'justify-between'} p-4 sm:p-6`}>
              {/* Mobile view - show dots for navigation */}
              {isMobile && questions && (
                <div className="flex justify-center w-full mb-2">
                  {questions.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full mx-1 ${
                        idx === currentQuestionIndex
                          ? 'bg-primary'
                          : answers[idx] !== null
                          ? 'bg-green-400'
                          : 'bg-gray-300'
                      }`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      aria-label={`Go to question ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
              
              <div className={`flex ${isMobile ? 'w-full justify-between' : ''}`}>
                <Button 
                  variant="outline" 
                  onClick={goToPrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={isMobile ? 'px-3' : ''}
                >
                  <Icons.previous className={`${isMobile ? '' : 'mr-2'} h-4 w-4`} /> 
                  {!isMobile && "Previous"}
                </Button>
                
                {currentQuestionIndex < (questions?.length || 0) - 1 ? (
                  <Button 
                    onClick={goToNextQuestion}
                    className={isMobile ? 'px-3' : ''}
                  >
                    {!isMobile && "Next"} <Icons.next className={`${isMobile ? '' : 'ml-2'} h-4 w-4`} />
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default" className={isMobile ? 'text-sm px-3' : ''}>
                        {isMobile ? "Submit" : "Submit All Answers"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className={isMobile ? "w-[90vw] max-w-md" : ""}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit all answers?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to submit your answers? You won't be able to make changes after submission.
                          {answers.filter(a => a === null).length > 0 && (
                            <p className="text-red-500 mt-2">
                              Warning: You have {answers.filter(a => a === null).length} unanswered questions.
                            </p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                        <AlertDialogCancel className={isMobile ? "w-full mt-0" : ""}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleSubmitSession}
                          disabled={submitSessionMutation.isPending}
                          className={isMobile ? "w-full mt-0" : ""}
                        >
                          {submitSessionMutation.isPending ? "Submitting..." : "Submit"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-gray-500">No questions available for this topic. Please try another topic.</p>
              
              {questionsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-auto max-w-lg">
                  <h3 className="text-sm font-medium text-red-800 mb-1">Error fetching questions</h3>
                  <p className="text-xs text-red-700">{questionsError.message}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-auto max-w-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">Topic Information</h3>
                <p className="text-xs text-yellow-700">
                  Topic ID: {topicId || "All Topics"}<br />
                  Topic Name: {topic?.name || "N/A"}<br />
                  Questions may not be available yet. Please check with your administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Submit Session (if not on last question) */}
        {questions && questions.length > 0 && currentQuestionIndex < questions.length - 1 && (
          <div className="flex justify-end mt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" className={isMobile ? 'w-full' : ''}>
                  {isMobile ? "Submit Quiz" : "Submit All Answers"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={isMobile ? "w-[90vw] max-w-md" : ""}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit all answers?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to submit your answers? You won't be able to make changes after submission.
                    {answers.filter(a => a === null).length > 0 && (
                      <p className="text-red-500 mt-2">
                        Warning: You have {answers.filter(a => a === null).length} unanswered questions.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                  <AlertDialogCancel className={isMobile ? "w-full mt-0" : ""}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleSubmitSession}
                    disabled={submitSessionMutation.isPending}
                    className={isMobile ? "w-full mt-0" : ""}
                  >
                    {submitSessionMutation.isPending ? "Submitting..." : "Submit"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </main>
      
      {/* Loading overlay for submission */}
      {submitSessionMutation.isPending && showSubmitAnimation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingAnimation
            variant="primary"
            title="Submitting your answers..."
            description="Please wait while we process your submission"
            progress={submissionProgress}
            icon="rocket"
            className="max-w-md mx-auto"
          />
        </div>
      )}
    </div>
  );
}
