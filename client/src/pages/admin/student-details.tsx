import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { AdminLayout } from "@/components/admin/layout";
import { Loader2, ArrowLeft, Clock, Book, CheckCircle, XCircle, BarChart3, Calendar } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

interface Session {
  id: number;
  userId: number;
  topicId: number | null;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  score: number;
  completedAt: string;
}

interface Topic {
  id: number;
  name: string;
  description: string;
}

interface DetailedSession extends Session {
  topicName?: string;
}

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch student data
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch student");
      return res.json() as Promise<User>;
    },
    enabled: !!userId
  });
  
  // Fetch student sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: [`/api/users/${userId}/sessions`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/sessions`);
      if (!res.ok) throw new Error("Failed to fetch student sessions");
      return res.json() as Promise<Session[]>;
    },
    enabled: !!userId
  });
  
  // Fetch all topics to get topic names
  const { data: topics } = useQuery({
    queryKey: ["/api/topics"],
    queryFn: async () => {
      const res = await fetch("/api/topics");
      if (!res.ok) throw new Error("Failed to fetch topics");
      return res.json() as Promise<Topic[]>;
    }
  });
  
  // Loading state
  if (isLoadingStudent || isLoadingSessions) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg">Loading student data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Error state - Student not found
  if (!student) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Student Not Found</CardTitle>
              <CardDescription>
                The student with the specified ID could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                The student you're looking for might have been deleted or doesn't exist.
              </p>
              <Link href="/admin/manage-students">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Student Management
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  // Enhance sessions with topic names
  const enhancedSessions: DetailedSession[] = sessions ? sessions.map(session => {
    let topicName = "All Topics";
    if (session.topicId && topics) {
      const topic = topics.find(t => t.id === session.topicId);
      if (topic) {
        topicName = topic.name;
      }
    }
    return {
      ...session,
      topicName
    };
  }) : [];
  
  // Sort sessions by date, newest first
  const sortedSessions = [...enhancedSessions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  // Calculate statistics
  const totalSessions = sortedSessions.length;
  const totalQuestions = sortedSessions.reduce((sum, session) => sum + session.totalQuestions, 0);
  const correctAnswers = sortedSessions.reduce((sum, session) => sum + session.correctAnswers, 0);
  const averageScore = totalSessions > 0 
    ? sortedSessions.reduce((sum, session) => sum + session.score, 0) / totalSessions 
    : 0;
  const totalTimeSpent = sortedSessions.reduce((sum, session) => sum + session.timeSpent, 0);
  
  // Calculate performance by topic
  const topicPerformance = topics ? topics.map(topic => {
    const topicSessions = sortedSessions.filter(s => s.topicId === topic.id);
    const sessionCount = topicSessions.length;
    const avgScore = sessionCount > 0 
      ? topicSessions.reduce((sum, s) => sum + s.score, 0) / sessionCount 
      : 0;
    return {
      topicId: topic.id,
      topicName: topic.name,
      sessionCount,
      averageScore: avgScore,
    };
  }) : [];
  
  // Format for progress chart
  const sessionProgressData = sortedSessions
    .slice() // Create a copy
    .reverse() // Reverse to show oldest first
    .map((session, index) => ({
      session: `S${index + 1}`,
      date: new Date(session.completedAt).toLocaleDateString(),
      score: session.score,
      correctAnswers: session.correctAnswers,
      totalQuestions: session.totalQuestions,
    }));
  
  // Format for topic performance chart
  const topicPerformanceData = topicPerformance
    .filter(topic => topic.sessionCount > 0) // Only show topics with sessions
    .sort((a, b) => b.averageScore - a.averageScore); // Sort by highest score
  
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/admin/manage-students">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Student Detail</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Detailed performance analytics for {student.fullName}
            </p>
          </div>
        </div>
        
        {/* Student info card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{student.fullName}</CardTitle>
                <CardDescription className="text-sm">@{student.username}</CardDescription>
              </div>
              <Badge variant={student.approved ? "default" : "outline"}>
                {student.approved ? "Approved" : "Pending Approval"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{student.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Role</p>
                <p className="capitalize">{student.role}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Registered</p>
                <p>{new Date(student.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Sessions</p>
                <p>{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="topics">Topic Performance</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Summary Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last session: {sortedSessions.length > 0 ? new Date(sortedSessions[0].completedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                  <Progress className="h-2 mt-2" value={averageScore} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Correct Answers</CardTitle>
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{correctAnswers}</div>
                    <div className="text-sm text-gray-500">/ {totalQuestions}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">Accuracy:</span>
                    <span className="text-xs font-medium">
                      {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(totalTimeSpent)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg {totalSessions > 0 ? formatTime(Math.round(totalTimeSpent / totalSessions)) : '0s'} per session
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {totalSessions > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Recent Performance Chart */}
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Performance</CardTitle>
                    <CardDescription>
                      Last {Math.min(5, sortedSessions.length)} sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sessionProgressData.slice(-5)} // Last 5 sessions
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="session" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}`, 'Score']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#2563eb"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                          name="Score (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Topics Performance Chart */}
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Topic Performance</CardTitle>
                    <CardDescription>
                      Average scores by topic
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {topicPerformanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topicPerformanceData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="topicName" type="category" width={100} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                          <Legend />
                          <Bar
                            dataKey="averageScore"
                            fill="#2563eb"
                            name="Average Score (%)"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No topic data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Book className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">No Sessions Yet</h3>
                    <p className="text-sm text-gray-500 max-w-md mt-2">
                      This student hasn't completed any practice sessions or quizzes yet.
                      Performance data will appear here once they start taking tests.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>
                  All practice and quiz sessions completed by this student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalSessions > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Correct</TableHead>
                        <TableHead>Time Spent</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {formatDate(session.completedAt)}
                          </TableCell>
                          <TableCell>
                            {session.topicName || "All Topics"}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              session.score >= 90 ? "bg-green-600" :
                              session.score >= 80 ? "bg-green-500" :
                              session.score >= 70 ? "bg-yellow-500" :
                              session.score >= 60 ? "bg-yellow-600" :
                              "bg-red-500"
                            }>
                              {session.score.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.correctAnswers} / {session.totalQuestions}
                          </TableCell>
                          <TableCell>
                            {formatTime(session.timeSpent)}
                          </TableCell>
                          <TableCell>
                            <Link href={`/admin/session-details/${session.id}`}>
                              <Button size="sm" variant="outline">Details</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Book className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">No Sessions Yet</h3>
                    <p className="text-sm text-gray-500 max-w-md mt-2 text-center">
                      This student hasn't completed any practice sessions or quizzes yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Topics Tab */}
          <TabsContent value="topics">
            <Card>
              <CardHeader>
                <CardTitle>Topic Performance</CardTitle>
                <CardDescription>
                  Performance breakdown by topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topicPerformanceData.length > 0 ? (
                  <div className="grid gap-6">
                    {/* Topic Performance Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topicPerformanceData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="topicName" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                          <Legend />
                          <Bar
                            dataKey="averageScore"
                            fill="#2563eb"
                            name="Average Score (%)"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Topic Details Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic</TableHead>
                          <TableHead>Sessions</TableHead>
                          <TableHead>Average Score</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topicPerformanceData.map((topic) => (
                          <TableRow key={topic.topicId}>
                            <TableCell className="font-medium">
                              {topic.topicName}
                            </TableCell>
                            <TableCell>{topic.sessionCount}</TableCell>
                            <TableCell>
                              {topic.averageScore.toFixed(1)}%
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  className="h-2 w-24" 
                                  value={topic.averageScore} 
                                />
                                <span className="text-xs font-medium">
                                  {topic.averageScore >= 90 ? "Excellent" :
                                   topic.averageScore >= 80 ? "Very Good" :
                                   topic.averageScore >= 70 ? "Good" :
                                   topic.averageScore >= 60 ? "Satisfactory" :
                                   "Needs Improvement"}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Book className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">No Topic Data Available</h3>
                    <p className="text-sm text-gray-500 max-w-md mt-2 text-center">
                      This student hasn't completed any topic-specific sessions yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Progress Tab */}
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription>
                  Performance trend across all completed sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionProgressData.length > 0 ? (
                  <div className="space-y-6">
                    {/* Progress Chart */}
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={sessionProgressData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="session" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value}${name === "score" ? "%" : ""}`,
                              name === "score" ? "Score" : name === "correctAnswers" ? "Correct Answers" : "Total Questions"
                            ]} 
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#2563eb"
                            strokeWidth={2}
                            name="Score (%)"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="correctAnswers"
                            stroke="#10b981"
                            name="Correct Answers"
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="totalQuestions"
                            stroke="#6b7280"
                            name="Total Questions"
                            strokeDasharray="5 5"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Progress Details */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Progress Summary</h3>
                      <div className="text-sm text-gray-500 space-y-2">
                        <p>
                          <span className="font-medium text-gray-900">First session:</span>{" "}
                          {sessionProgressData.length > 0 
                            ? formatDate(sortedSessions[sortedSessions.length - 1].completedAt) 
                            : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">Latest session:</span>{" "}
                          {sessionProgressData.length > 0 
                            ? formatDate(sortedSessions[0].completedAt) 
                            : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">Initial score:</span>{" "}
                          {sessionProgressData.length > 0 
                            ? `${sessionProgressData[0].score.toFixed(1)}%` 
                            : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">Latest score:</span>{" "}
                          {sessionProgressData.length > 0 
                            ? `${sessionProgressData[sessionProgressData.length - 1].score.toFixed(1)}%` 
                            : "N/A"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-900">
                            {sessionProgressData.length > 1 && 
                              sessionProgressData[sessionProgressData.length - 1].score > sessionProgressData[0].score 
                              ? "Improvement:" 
                              : "Change:"}
                          </span>{" "}
                          {sessionProgressData.length > 1 
                            ? `${(sessionProgressData[sessionProgressData.length - 1].score - sessionProgressData[0].score).toFixed(1)}%` 
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Book className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium">No Progress Data Available</h3>
                    <p className="text-sm text-gray-500 max-w-md mt-2 text-center">
                      This student hasn't completed any sessions yet, so there's no progress to display.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}