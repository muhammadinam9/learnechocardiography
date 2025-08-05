import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Session, SessionQuestion, Topic } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentHeader } from "@/components/student/header";

export default function SessionResults() {
  const { sessionId } = useParams();
  const [, navigate] = useLocation();
  
  // Fetch session details
  const { data: session, isLoading: isLoadingSession } = useQuery<Session>({
    queryKey: ["/api/sessions", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    }
  });
  
  // Fetch session questions with details
  const { data: sessionQuestions, isLoading: isLoadingQuestions } = useQuery<(SessionQuestion & { question: any })[]>({
    queryKey: ["/api/sessions", sessionId, "questions"],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}/questions`);
      if (!res.ok) throw new Error("Failed to fetch session questions");
      return res.json();
    }
  });
  
  // Fetch topic if available
  const { data: topic } = useQuery<Topic>({
    queryKey: ["/api/topics", session?.topicId],
    queryFn: async () => {
      if (!session?.topicId) return null;
      const res = await fetch(`/api/topics/${session.topicId}`);
      if (!res.ok) throw new Error("Failed to fetch topic");
      return res.json();
    },
    enabled: !!session?.topicId
  });
  
  // Format time for display
  const formatTime = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Navigate back to dashboard
  const goToDashboard = () => {
    navigate("/");
  };
  
  // Start new practice session
  const practiceAgain = () => {
    if (session?.topicId) {
      navigate(`/practice/${session.topicId}`);
    } else {
      navigate("/practice");
    }
  };
  
  // Try a different topic
  const practiceDifferent = () => {
    navigate("/");
  };
  
  // Calculate average time per question
  const avgTimePerQuestion = session ? Math.floor(session.timeSpent / session.totalQuestions) : 0;
  
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
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Session Complete</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="py-6 px-4 sm:px-6 lg:px-8 mx-auto max-w-4xl">
        {/* Results Summary Card */}
        <Card className="mb-8">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Practice Session Results</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {topic?.name || "All Topics"} - {session ? new Date(session.completedAt).toLocaleDateString() : ""}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            {isLoadingSession ? (
              <div className="space-y-6">
                <div className="flex justify-center mb-8">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </div>
            ) : session ? (
              <>
                {/* Score CircleDisplay */}
                <div className="flex justify-center mb-8">
                  <div className="relative h-48 w-48 flex items-center justify-center">
                    <svg className="absolute" viewBox="0 0 100 100" width="100%" height="100%">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="10"></circle>
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="42" 
                        fill="none" 
                        stroke={session.score >= 80 ? "#10B981" : session.score >= 60 ? "#F59E0B" : "#EF4444"} 
                        strokeWidth="10" 
                        strokeDasharray="264" 
                        strokeDashoffset={264 - (264 * session.score / 100)} 
                        transform="rotate(-90 50 50)"
                      ></circle>
                    </svg>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {session.score.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        <span className="font-semibold">{session.correctAnswers}/{session.totalQuestions}</span> correct
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Time Spent</div>
                    <div className="text-xl font-semibold text-gray-900">{formatTime(session.timeSpent)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Average Time/Question</div>
                    <div className="text-xl font-semibold text-gray-900">{avgTimePerQuestion}s</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Correct Answers</div>
                    <div className="text-xl font-semibold text-green-600">{session.correctAnswers}/{session.totalQuestions}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Incorrect Answers</div>
                    <div className="text-xl font-semibold text-red-600">
                      {session.totalQuestions - session.correctAnswers}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Session not found or has been deleted.
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Questions Review */}
        <Card className="mb-6">
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Questions Review</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Review your answers in this session</p>
          </CardHeader>
          
          {/* Separated Correct and Incorrect Answers */}
          {isLoadingQuestions ? (
            <div className="p-6 space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : sessionQuestions?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Correct Answers */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-50 p-3 border-b border-green-100 flex justify-between items-center">
                  <h3 className="font-semibold text-green-800">Correct Answers</h3>
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {sessionQuestions.filter(q => q.isCorrect).length} / {sessionQuestions.length}
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {sessionQuestions.filter(item => item.isCorrect).length > 0 ? (
                    sessionQuestions.filter(item => item.isCorrect).map(item => {
                      const question = item.question;
                      let selectedText = "";
                      
                      switch (item.selectedOption) {
                        case "A": selectedText = question.optionA; break;
                        case "B": selectedText = question.optionB; break;
                        case "C": selectedText = question.optionC; break;
                        case "D": selectedText = question.optionD; break;
                        default: selectedText = "Not answered";
                      }
                      
                      return (
                        <div key={item.id} className="p-4 hover:bg-gray-50">
                          <p className="font-medium text-gray-900 mb-2">{question.text}</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Your answer: 
                              <span className="text-green-600 font-medium ml-1">
                                {item.selectedOption}. {selectedText}
                              </span>
                            </span>
                            <span className="text-gray-500">Time: {item.timeSpent}s</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No correct answers in this session.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Incorrect Answers */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-red-50 p-3 border-b border-red-100 flex justify-between items-center">
                  <h3 className="font-semibold text-red-800">Incorrect Answers</h3>
                  <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {sessionQuestions.filter(q => !q.isCorrect).length} / {sessionQuestions.length}
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {sessionQuestions.filter(item => !item.isCorrect).length > 0 ? (
                    sessionQuestions.filter(item => !item.isCorrect).map(item => {
                      const question = item.question;
                      let selectedText = "";
                      let correctText = "";
                      
                      switch (item.selectedOption) {
                        case "A": selectedText = question.optionA; break;
                        case "B": selectedText = question.optionB; break;
                        case "C": selectedText = question.optionC; break;
                        case "D": selectedText = question.optionD; break;
                        default: selectedText = "Not answered";
                      }
                      
                      switch (question.correctOption) {
                        case "A": correctText = question.optionA; break;
                        case "B": correctText = question.optionB; break;
                        case "C": correctText = question.optionC; break;
                        case "D": correctText = question.optionD; break;
                      }
                      
                      return (
                        <div key={item.id} className="p-4 hover:bg-gray-50">
                          <p className="font-medium text-gray-900 mb-2">{question.text}</p>
                          <div className="grid grid-cols-1 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-gray-500">Your answer: </span>
                              <span className="text-red-600 font-medium">
                                {item.selectedOption}. {selectedText}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Correct answer: </span>
                              <span className="text-green-600 font-medium">
                                {question.correctOption}. {correctText}
                              </span>
                            </div>
                          </div>
                          {question.explanation && (
                            <div className="text-sm bg-yellow-50 p-3 rounded-md border border-yellow-100 mt-2">
                              <span className="font-medium text-yellow-800">Explanation: </span>
                              <span className="text-gray-700">{question.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No incorrect answers in this session.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No questions found for this session.
            </div>
          )}
        </Card>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button variant="outline" onClick={goToDashboard}>
            Return to Dashboard
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={practiceAgain}>
              Practice Again
            </Button>
            
            <Button variant="secondary" onClick={practiceDifferent}>
              Try Different Topic
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
