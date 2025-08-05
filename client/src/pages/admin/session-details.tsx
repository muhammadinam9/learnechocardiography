import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Loader2, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, CheckCircle2, Image } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Session, Question, SessionQuestion } from "@shared/schema";

interface SessionWithDetails extends Session {
  user?: {
    id: number;
    username: string;
    fullName: string;
  };
  topic?: {
    id: number;
    name: string;
  };
}

interface QuestionWithSession extends SessionQuestion {
  question: Question;
}

export default function SessionDetails() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id);
  
  // Fetch session data
  const { data: session, isLoading: isLoadingSession } = useQuery<SessionWithDetails>({
    queryKey: [`/api/sessions/${sessionId}`],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session details");
      
      // Get the session
      const sessionData = await res.json();
      
      // Enhance with user and topic data
      const [userRes, topicRes] = await Promise.all([
        fetch(`/api/users/${sessionData.userId}`),
        sessionData.topicId ? fetch(`/api/topics/${sessionData.topicId}`) : Promise.resolve(null)
      ]);
      
      if (userRes.ok) {
        const userData = await userRes.json();
        sessionData.user = {
          id: userData.id,
          username: userData.username,
          fullName: userData.fullName
        };
      }
      
      if (topicRes && topicRes.ok) {
        const topicData = await topicRes.json();
        sessionData.topic = {
          id: topicData.id,
          name: topicData.name
        };
      }
      
      return sessionData;
    },
    enabled: !!sessionId
  });
  
  // Fetch session questions with answers
  const { data: sessionQuestions, isLoading: isLoadingQuestions } = useQuery<QuestionWithSession[]>({
    queryKey: [`/api/sessions/${sessionId}/questions`],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}/questions`);
      if (!res.ok) throw new Error("Failed to fetch session questions");
      return res.json();
    },
    enabled: !!sessionId
  });
  
  // Loading state
  if (isLoadingSession || isLoadingQuestions) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg">Loading session details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Error state - Session not found
  if (!session) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Session Not Found</CardTitle>
              <CardDescription>
                The session with the specified ID could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                The session you're looking for might have been deleted or doesn't exist.
              </p>
              <Link href="/admin">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Group questions by correctness
  const correctQuestions = sessionQuestions?.filter(sq => sq.isCorrect) || [];
  const incorrectQuestions = sessionQuestions?.filter(sq => !sq.isCorrect) || [];
  
  // Calculate stats
  const scoreGrade = session.score >= 90 ? "Excellent" :
                    session.score >= 80 ? "Very Good" :
                    session.score >= 70 ? "Good" :
                    session.score >= 60 ? "Satisfactory" :
                    "Needs Improvement";
  
  const scoreColor = session.score >= 90 ? "bg-green-600" :
                     session.score >= 80 ? "bg-green-500" :
                     session.score >= 70 ? "bg-yellow-500" :
                     session.score >= 60 ? "bg-yellow-600" :
                     "bg-red-500";
  
  // Calculate average time per question in seconds
  const avgTimePerQuestion = session.totalQuestions > 0 
    ? Math.round(session.timeSpent / session.totalQuestions) 
    : 0;
  
  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header with Back button */}
        <div className="flex items-center gap-2 mb-6">
          <Link href={session.user ? `/admin/student-details/${session.user.id}` : "/admin"}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Session Details</h1>
            <p className="text-gray-500 text-sm">
              Session completed on {formatDate(session.completedAt)}
            </p>
          </div>
        </div>
        
        {/* Session Summary Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <CardTitle className="text-xl">Session Summary</CardTitle>
                <CardDescription>
                  {session.user ? (
                    <Link href={`/admin/student-details/${session.user.id}`} className="hover:underline">
                      {session.user.fullName}
                    </Link>
                  ) : (
                    "Unknown User"
                  )}
                </CardDescription>
              </div>
              <Badge className={`${scoreColor} text-white px-3 py-1`}>{scoreGrade}</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Score */}
              <div className="bg-gray-50 rounded-lg border p-4 flex flex-col items-center justify-center">
                <span className="text-sm text-gray-500 mb-2">Score</span>
                <div className="relative w-20 h-20 flex items-center justify-center mb-2">
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
                      strokeDashoffset={251.2 - (251.2 * session.score) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute">
                    <div className="text-2xl font-bold">{Math.round(session.score)}%</div>
                  </div>
                </div>
              </div>
              
              {/* Correct answers */}
              <div className="bg-gray-50 rounded-lg border p-4 flex flex-col">
                <span className="text-sm text-gray-500 mb-2">Correct Answers</span>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-primary">{session.correctAnswers}</span>
                  <span className="text-gray-500 text-lg">/ {session.totalQuestions}</span>
                </div>
                <Progress 
                  value={(session.correctAnswers / session.totalQuestions) * 100} 
                  className="h-2"
                />
              </div>
              
              {/* Time spent */}
              <div className="bg-gray-50 rounded-lg border p-4 flex flex-col">
                <span className="text-sm text-gray-500 mb-2">Time Spent</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{formatTime(session.timeSpent)}</span>
                </div>
                <span className="text-sm text-gray-500 mt-2">
                  Avg {formatTime(avgTimePerQuestion)} per question
                </span>
              </div>
              
              {/* Topic */}
              <div className="bg-gray-50 rounded-lg border p-4 flex flex-col">
                <span className="text-sm text-gray-500 mb-2">Topic</span>
                {session.topic ? (
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                      <path d="M10 2c1 .5 2 2 2 5" />
                    </svg>
                    <span className="text-lg font-medium">{session.topic.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 7 6.82 21.18a2.83 2.83 0 0 1-3.99-.01v0a2.83 2.83 0 0 1 0-4L17 3" />
                      <path d="m16 2 6 6" />
                      <path d="M12.5 6.5 17 11" />
                    </svg>
                    <span className="text-lg font-medium">Mixed Topics</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Questions Section */}
        <h2 className="text-xl font-bold mb-4">Questions & Answers</h2>
        
        <div className="space-y-8">
          {sessionQuestions?.map((sq, index) => (
            <Card key={sq.id} className={`border-l-4 ${sq.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  <Badge variant={sq.isCorrect ? "default" : "destructive"}>
                    {sq.isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Question text */}
                  <div className="text-lg font-medium">{sq.question.text}</div>
                  
                  {/* Question image if available */}
                  {sq.question.imagePath && (
                    <div className="my-4 border rounded-md p-2 inline-block">
                      <img 
                        src={sq.question.imagePath} 
                        alt="Question" 
                        className="max-h-48 object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Options */}
                  <div className="grid gap-2">
                    {['A', 'B', 'C', 'D', 'E'].map((option, i) => {
                      if (!sq.question[`option${option}` as keyof Question]) return null;
                      
                      const isSelected = sq.selectedOption === option;
                      const isCorrect = sq.question.correctOption === option;
                      
                      let bgColor = "bg-white";
                      let borderColor = "border-gray-200";
                      let textColor = "text-gray-800";
                      let icon = null;
                      
                      if (isSelected && isCorrect) {
                        bgColor = "bg-green-50";
                        borderColor = "border-green-300";
                        textColor = "text-green-800";
                        icon = <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />;
                      } else if (isSelected && !isCorrect) {
                        bgColor = "bg-red-50";
                        borderColor = "border-red-300";
                        textColor = "text-red-800";
                        icon = <XCircle className="h-5 w-5 text-red-600 shrink-0" />;
                      } else if (isCorrect) {
                        bgColor = "bg-green-50";
                        borderColor = "border-green-200";
                        textColor = "text-green-800";
                        icon = <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />;
                      }
                      
                      return (
                        <div 
                          key={option} 
                          className={`${bgColor} ${borderColor} ${textColor} border rounded-md p-3 flex items-start gap-3`}
                        >
                          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 bg-white">
                            <span className="text-sm">{option}</span>
                          </div>
                          <div className="flex-1">
                            {sq.question[`option${option}` as keyof Question] as string}
                          </div>
                          {icon}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Explanation */}
                  {sq.question.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-blue-800">Explanation:</p>
                          <p className="text-blue-700 mt-1">{sq.question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Time spent */}
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-500 mt-2">
                    <Clock className="h-4 w-4" />
                    <span>Time spent: {formatTime(sq.timeSpent || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}