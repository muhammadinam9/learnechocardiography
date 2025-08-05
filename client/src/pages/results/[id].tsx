import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Session, SessionQuestion, Question } from "@shared/schema";
import { StudentHeader } from "@/components/student/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Icons } from "@/components/icons";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ResultsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Use state to track if we're showing the animation
  const [showAnimation, setShowAnimation] = useState(true);

  // Fetch session data
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery<Session>({
    queryKey: [`/api/sessions/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch session results");
      return res.json();
    }
  });

  // Fetch session questions with answers
  const { data: sessionQuestions, isLoading: questionsLoading, error: questionsError } = useQuery<(SessionQuestion & { question: Question })[]>({
    queryKey: [`/api/sessions/${id}/questions`],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${id}/questions`);
      if (!res.ok) throw new Error("Failed to fetch session questions");
      return res.json();
    },
    enabled: !!session
  });

  // Hide animation after some time
  useEffect(() => {
    if (!sessionLoading && !questionsLoading && session && sessionQuestions) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [sessionLoading, questionsLoading, session, sessionQuestions]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle errors
  useEffect(() => {
    if (sessionError) {
      toast({
        title: "Error loading session",
        description: sessionError.message,
        variant: "destructive"
      });
    }

    if (questionsError) {
      toast({
        title: "Error loading questions",
        description: questionsError.message,
        variant: "destructive"
      });
    }
  }, [sessionError, questionsError, toast]);

  // Loading state
  if ((sessionLoading || questionsLoading || showAnimation) && !sessionError && !questionsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <StudentHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <LoadingAnimation 
            title="Preparing your results..." 
            description="We're analyzing your answers"
            variant="primary"
            progress={sessionLoading ? 30 : questionsLoading ? 70 : 95}
            icon="rocket"
          />
        </div>
      </div>
    );
  }

  // Error state
  if (sessionError || questionsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <StudentHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Results</CardTitle>
              <CardDescription>
                We couldn't load your results. Please try again or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                {sessionError?.message || questionsError?.message || "Unknown error occurred"}
              </p>
              <Link href="/">
                <Button className="w-full">Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats
  const scoreGrade = session ? 
    session.score >= 90 ? "Excellent" :
    session.score >= 80 ? "Very Good" :
    session.score >= 70 ? "Good" :
    session.score >= 60 ? "Satisfactory" :
    "Needs Improvement" : "";

  const scoreColor = session ? 
    session.score >= 90 ? "bg-green-600" :
    session.score >= 80 ? "bg-green-500" :
    session.score >= 70 ? "bg-yellow-500" :
    session.score >= 60 ? "bg-yellow-600" :
    "bg-red-500" : "";

  // Group questions by correctness
  const correctQuestions = sessionQuestions?.filter(sq => sq.isCorrect) || [];
  const incorrectQuestions = sessionQuestions?.filter(sq => !sq.isCorrect) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <StudentHeader />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Score summary */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Results</h1>
            <p className="text-gray-600">
              Completed on {session?.completedAt ? new Date(session.completedAt).toLocaleString() : "N/A"}
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Score */}
            <div className="bg-white rounded-lg border p-4 flex flex-col items-center justify-center">
              <span className="text-sm text-gray-500 mb-2">Score</span>
              <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-primary"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (session?.score || 0)) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute">
                  <div className="text-2xl font-bold">{Math.round(session?.score || 0)}%</div>
                </div>
              </div>
              <Badge className={scoreColor + " text-white"}>{scoreGrade}</Badge>
            </div>

            {/* Correct answers */}
            <div className="bg-white rounded-lg border p-4 flex flex-col">
              <span className="text-sm text-gray-500 mb-2">Correct Answers</span>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-primary">{session?.correctAnswers || 0}</span>
                <span className="text-gray-500 text-lg">/ {session?.totalQuestions || 0}</span>
              </div>
              <Progress 
                value={(session?.correctAnswers || 0) / (session?.totalQuestions || 1) * 100} 
                className="h-2"
              />
            </div>

            {/* Time spent */}
            <div className="bg-white rounded-lg border p-4 flex flex-col">
              <span className="text-sm text-gray-500 mb-2">Time Spent</span>
              <div className="flex items-center gap-2">
                <Icons.clock className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{formatTime(session?.timeSpent || 0)}</span>
              </div>
              <span className="text-sm text-gray-500 mt-2">
                Avg {formatTime(Math.round((session?.timeSpent || 0) / (session?.totalQuestions || 1)))} per question
              </span>
            </div>

            {/* Topic */}
            <div className="bg-white rounded-lg border p-4 flex flex-col">
              <span className="text-sm text-gray-500 mb-2">Topic</span>
              {session?.topicId ? (
                <div className="flex items-center gap-2">
                  <Icons.bookmark className="h-5 w-5 text-primary" />
                  <span className="text-lg font-medium">
                    {sessionQuestions?.[0]?.question?.topicId ? 
                      sessionQuestions[0].question.subtopic || "Specific Topic" : 
                      "General Practice"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Icons.mix className="h-5 w-5 text-primary" />
                  <span className="text-lg font-medium">Mixed Topics</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 border-t p-4 flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/practice${session?.topicId ? `/${session.topicId}` : ''}`}>
                Practice Again
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Questions breakdown */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Correct answers */}
          <Card>
            <CardHeader className="bg-green-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-700">Correct Answers</CardTitle>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {correctQuestions.length} / {sessionQuestions?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {correctQuestions.length > 0 ? (
                <ul className="divide-y">
                  {correctQuestions.map((sq) => {
                    // Get full text of selected option
                    let selectedOptionText = "";
                    if (sq.selectedOption === "A") selectedOptionText = sq.question.optionA;
                    else if (sq.selectedOption === "B") selectedOptionText = sq.question.optionB;
                    else if (sq.selectedOption === "C") selectedOptionText = sq.question.optionC;
                    else if (sq.selectedOption === "D") selectedOptionText = sq.question.optionD;

                    return (
                      <li key={sq.id} className="p-4 hover:bg-gray-50">
                        <p className="font-medium mb-2">{sq.question.text}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Your answer: 
                            <span className="text-green-600 font-medium ml-1">
                              {sq.selectedOption}. {selectedOptionText || "None"}
                            </span>
                          </span>
                          <span className="text-gray-500">Time: {formatTime(sq.timeSpent || 0)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No correct answers in this session.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incorrect answers */}
          <Card>
            <CardHeader className="bg-red-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-red-700">Incorrect Answers</CardTitle>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  {incorrectQuestions.length} / {sessionQuestions?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {incorrectQuestions.length > 0 ? (
                <ul className="divide-y">
                  {incorrectQuestions.map((sq) => {
                    // Get full text of selected and correct options
                    let selectedOptionText = "";
                    let correctOptionText = "";

                    if (sq.selectedOption === "A") selectedOptionText = sq.question.optionA;
                    else if (sq.selectedOption === "B") selectedOptionText = sq.question.optionB;
                    else if (sq.selectedOption === "C") selectedOptionText = sq.question.optionC;
                    else if (sq.selectedOption === "D") selectedOptionText = sq.question.optionD;

                    if (sq.question.correctOption === "A") correctOptionText = sq.question.optionA;
                    else if (sq.question.correctOption === "B") correctOptionText = sq.question.optionB;
                    else if (sq.question.correctOption === "C") correctOptionText = sq.question.optionC;
                    else if (sq.question.correctOption === "D") correctOptionText = sq.question.optionD;

                    return (
                      <li key={sq.id} className="p-4 hover:bg-gray-50">
                        <p className="font-medium mb-2">{sq.question.text}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-gray-500">Your answer: </span>
                            <span className="text-red-600 font-medium">
                              {sq.selectedOption}. {selectedOptionText || "None"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Correct answer: </span>
                            <span className="text-green-600 font-medium">
                              {sq.question.correctOption}. {correctOptionText}
                            </span>
                          </div>
                        </div>
                        {sq.question.explanation && (
                          <div className="text-sm bg-yellow-50 p-3 rounded-md border border-yellow-100 mt-2">
                            <span className="font-medium text-yellow-800">Explanation: </span>
                            <span className="text-gray-700">{sq.question.explanation}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No incorrect answers in this session.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}