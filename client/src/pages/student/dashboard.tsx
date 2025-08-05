import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { StudentHeader } from "@/components/student/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { Topic, Session } from "@shared/schema";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { TimedQuizConfig } from "@/components/student/timed-quiz-config";
import { PracticeConfig } from "@/components/student/practice-config";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [isTimedQuizOpen, setIsTimedQuizOpen] = useState(false);
  const [isPracticeConfigOpen, setIsPracticeConfigOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  
  // Debug TimedQuizConfig dialog state
  useEffect(() => {
    console.log("Timed Quiz Dialog state:", isTimedQuizOpen);
  }, [isTimedQuizOpen]);
  
  const { data: topics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });
  
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ["/api/sessions/user"],
  });
  
  // Calculate some stats based on sessions
  const stats = {
    attempted: sessions?.reduce((total, session) => total + session.totalQuestions, 0) || 0,
    accuracy: sessions?.length 
      ? (sessions.reduce((total, session) => total + session.correctAnswers, 0) / 
         sessions.reduce((total, session) => total + session.totalQuestions, 0) * 100).toFixed(0)
      : "0",
    sessionsCount: sessions?.length || 0
  };
  
  // Get the 5 most recent sessions
  const recentSessions = sessions?.slice(0, 5) || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />
      
      <main className="py-6 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back, {user?.fullName?.split(' ')[0] || 'Student'}!</h1>
            <p className="text-sm text-gray-500 mt-1">Continue your practice or start a new session</p>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedTopicId(undefined);
              setIsTimedQuizOpen(true);
            }} 
            className="mt-4 md:mt-0 w-full md:w-auto"
          >
            <Icons.clock className="mr-2 h-4 w-4" />
            Start Timed Quiz
          </Button>
        </div>
        
        {/* Timed Quiz Configuration Dialog */}
        <TimedQuizConfig
          open={isTimedQuizOpen}
          onOpenChange={setIsTimedQuizOpen}
          topicId={selectedTopicId}
        />
        
        {/* Practice Configuration Dialog */}
        <PracticeConfig
          open={isPracticeConfigOpen}
          onOpenChange={setIsPracticeConfigOpen}
          topicId={selectedTopicId}
        />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-primary">
                  <Icons.questions className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Questions Attempted</h2>
                  <p className="text-2xl font-semibold text-gray-900">{stats.attempted}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-1 rounded-full" 
                    style={{ width: `${Math.min(stats.attempted / 100 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Icons.target className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Accuracy Rate</h2>
                  <p className="text-2xl font-semibold text-gray-900">{stats.accuracy}%</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-600 h-1 rounded-full" 
                    style={{ width: `${stats.accuracy}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Icons.check className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Practice Sessions</h2>
                  <p className="text-2xl font-semibold text-gray-900">{stats.sessionsCount}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-1 rounded-full" 
                    style={{ width: `${Math.min(stats.sessionsCount / 20 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Topic Selection */}
        <Card className="mb-8">
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle>Practice by Topic</CardTitle>
            <CardDescription>
              Select a topic to practice or choose "All Topics" for mixed questions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {isLoadingTopics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics?.map((topic) => (
                  <div key={topic.id} className="bg-white border border-gray-300 rounded-lg hover:border-primary hover:shadow-md transition">
                    <div 
                      className="block p-4 cursor-pointer"
                      onClick={() => {
                        setSelectedTopicId(topic.id.toString());
                        setIsPracticeConfigOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-900">{topic.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {topic.description || `Practice ${topic.name} questions`}
                          </p>
                          <div className="text-xs text-primary-600 mt-1 flex items-center">
                            <Icons.questions className="h-3 w-3 mr-1" />
                            <span>{topics?.find(t => t.id === topic.id)?.questionCount || "Loading..."} questions</span>
                          </div>
                        </div>
                        <div className="text-primary">
                          <Icons.next className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 pb-3 border-t pt-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setSelectedTopicId(topic.id.toString());
                          setIsTimedQuizOpen(true);
                        }}
                      >
                        <Icons.clock className="h-3 w-3 mr-1" />
                        Timed Quiz
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="bg-white border border-gray-300 rounded-lg hover:border-primary hover:shadow-md transition">
                  <div 
                    className="block p-4 cursor-pointer"
                    onClick={() => {
                      setSelectedTopicId(undefined);
                      setIsPracticeConfigOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">All Topics</h3>
                        <p className="text-sm text-gray-500 mt-1">Mixed practice</p>
                      </div>
                      <div className="text-primary">
                        <Icons.next className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-3 border-t pt-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedTopicId(undefined);
                        setIsTimedQuizOpen(true);
                      }}
                    >
                      <Icons.clock className="h-3 w-3 mr-1" />
                      Timed Quiz
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Performance */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle>Recent Performance</CardTitle>
            <CardDescription>
              Your results from the last 5 practice sessions
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoadingSessions ? (
              <div className="p-6">
                <Skeleton className="h-32 w-full" />
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Time Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSessions.map((session) => {
                      const topicName = topics?.find(t => t.id === session.topicId)?.name || "All Topics";
                      const accuracy = (session.correctAnswers / session.totalQuestions * 100).toFixed(0);
                      const minutes = Math.floor(session.timeSpent / 60);
                      const seconds = session.timeSpent % 60;
                      const formattedTime = `${minutes}m ${seconds}s`;
                      
                      // Determine color based on score
                      let scoreColor = "text-green-600 font-medium";
                      if (session.score < 70) scoreColor = "text-yellow-600 font-medium";
                      if (session.score < 60) scoreColor = "text-red-600 font-medium";
                      
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(session.completedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{topicName}</TableCell>
                          <TableCell className="whitespace-nowrap">{session.totalQuestions}</TableCell>
                          <TableCell className={`whitespace-nowrap ${scoreColor}`}>
                            {session.score.toFixed(0)}% ({session.correctAnswers}/{session.totalQuestions})
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${
                                  parseInt(accuracy) >= 80 ? "bg-green-600" : 
                                  parseInt(accuracy) >= 60 ? "bg-yellow-600" : "bg-red-600"
                                } h-2 rounded-full`} 
                                style={{ width: `${accuracy}%` }}
                              ></div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{formattedTime}</span>
                              <Link href={`/results/${session.id}`}>
                                <Button size="sm" variant="outline" className="h-7 px-2">
                                  <Icons.details className="h-3.5 w-3.5 mr-1" />
                                  Details
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No practice sessions yet. Start practicing to see your performance!
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
