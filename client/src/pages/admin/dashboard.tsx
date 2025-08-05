import { AdminLayout } from "@/components/admin/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  // Fetch statistics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/statistics"],
    queryFn: async () => {
      const res = await fetch("/api/statistics");
      if (!res.ok) throw new Error("Failed to fetch statistics");
      return res.json();
    }
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format time spent
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  return (
    <AdminLayout>
      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-full bg-primary bg-opacity-10 text-primary">
                  <Icons.users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Total Students</h2>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats?.studentCount || 0}</p>
                  )}
                </div>
              </div>
              {!isLoading && (
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 flex items-center">
                    <Icons.arrowUp className="h-4 w-4 mr-1" /> New students joining
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-full bg-blue-500 bg-opacity-10 text-blue-500">
                  <Icons.questions className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Total Questions</h2>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats?.questionCount || 0}</p>
                  )}
                </div>
              </div>
              {!isLoading && (
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 flex items-center">
                    <Icons.arrowUp className="h-4 w-4 mr-1" /> Growing question bank
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-full bg-purple-500 bg-opacity-10 text-purple-500">
                  <Icons.check className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Practice Sessions</h2>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">{stats?.sessionCount || 0}</p>
                  )}
                </div>
              </div>
              {!isLoading && (
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 flex items-center">
                    <Icons.arrowUp className="h-4 w-4 mr-1" /> Active learning
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-full bg-green-500 bg-opacity-10 text-green-600">
                  <Icons.target className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Avg. Score</h2>
                  {isLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.averageScore ? `${stats.averageScore.toFixed(0)}%` : "N/A"}
                    </p>
                  )}
                </div>
              </div>
              {!isLoading && (
                <div className="mt-4 flex items-center text-sm">
                  <span className={`${stats?.averageScore >= 75 ? 'text-green-600' : 'text-yellow-600'} flex items-center`}>
                    <Icons.target className="h-4 w-4 mr-1" /> Overall performance
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle>Recent Student Activity</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Latest practice sessions and performance</p>
          </CardHeader>
          
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentActivity.length ? (
                    stats.recentActivity.map((activity: any) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <Icons.user className="h-4 w-4" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{activity.user?.fullName}</div>
                              <div className="text-sm text-gray-500">{activity.user?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(activity.completedAt)}</TableCell>
                        <TableCell className="whitespace-nowrap">{activity.topic?.name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            activity.score >= 80 ? 'bg-green-100 text-green-800' : 
                            activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {activity.score.toFixed(0)}%
                            {activity.correctAnswers !== undefined && (
                              <span className="ml-1">({activity.correctAnswers}/{activity.questionCount})</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{activity.questionCount}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatTime(activity.timeSpent)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No recent activity found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
        
        {/* Topic Performance */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-200">
            <CardTitle>Topic Performance Overview</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Average scores by subject area</p>
          </CardHeader>
          
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.topicPerformance.map((topic: any) => (
                  <div key={topic.id}>
                    <div className="flex justify-between mb-1 items-center">
                      <div className="text-sm font-medium text-gray-900">{topic.name}</div>
                      <div className="text-sm font-medium text-gray-900">{topic.averageScore.toFixed(0)}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`${
                          topic.averageScore >= 80 ? 'bg-green-600' : 
                          topic.averageScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                        } h-3 rounded-full`}
                        style={{ width: `${topic.averageScore}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {(!stats?.topicPerformance || stats.topicPerformance.length === 0) && (
                  <div className="text-center text-gray-500 py-4">
                    No topic performance data available yet
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
