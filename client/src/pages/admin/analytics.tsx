import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Topic } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Analytics() {
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("month");
  const [chartType, setChartType] = useState<string>("performance");

  // Fetch topics for filter dropdown
  const { data: topics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"]
  });

  // Fetch statistics data
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/statistics"],
    queryFn: async () => {
      const res = await fetch("/api/statistics");
      if (!res.ok) throw new Error("Failed to fetch statistics");
      return res.json();
    }
  });

  // Student Performance Data (mock data structure that would come from the API)
  const performanceData = [
    { name: "Week 1", avgScore: 68, completionRate: 85 },
    { name: "Week 2", avgScore: 72, completionRate: 78 },
    { name: "Week 3", avgScore: 75, completionRate: 82 },
    { name: "Week 4", avgScore: 82, completionRate: 88 },
    { name: "Week 5", avgScore: 78, completionRate: 92 },
    { name: "Week 6", avgScore: 85, completionRate: 90 },
  ];

  // Topic Distribution Data
  const topicDistributionData = stats?.topicPerformance?.map((topic: any) => ({
    name: topic.name,
    value: topic.sessionCount,
    avgScore: topic.averageScore.toFixed(0)
  })) || [];

  // Time Spent Distribution
  const timeSpentData = [
    { name: "0-5 min", count: 24 },
    { name: "5-10 min", count: 45 },
    { name: "10-15 min", count: 62 },
    { name: "15-20 min", count: 38 },
    { name: "20+ min", count: 15 },
  ];

  // Difficulty Analysis (based on success rates)
  const difficultyData = stats?.topicPerformance?.map((topic: any) => ({
    name: topic.name,
    successRate: topic.averageScore,
    questionsCount: topic.questionCount
  })) || [];

  // COLORS for charts
  const COLORS = [
    "#4F46E5", // primary
    "#0EA5E9", // secondary
    "#8B5CF6", // accent
    "#10B981", // success
    "#F59E0B", // warning
    "#EF4444"  // danger
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
          
          <div className="flex flex-wrap gap-4">
            <Select
              value={selectedTopic}
              onValueChange={setSelectedTopic}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics?.map(topic => (
                  <SelectItem key={topic.id} value={topic.id.toString()}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Type Selection */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <RadioGroup
              value={chartType}
              onValueChange={setChartType}
              className="flex flex-wrap gap-8"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="performance" id="performance" />
                <Label htmlFor="performance">Performance Trends</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="topics" id="topics" />
                <Label htmlFor="topics">Topic Distribution</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="time" id="time" />
                <Label htmlFor="time">Time Spent Analysis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="difficulty" id="difficulty" />
                <Label htmlFor="difficulty">Difficulty Analysis</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Performance Trends Chart */}
        {chartType === "performance" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Student Performance Trends</CardTitle>
              <p className="text-sm text-gray-500">Average scores and completion rates over time</p>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        name="Average Score (%)"
                        stroke="#4F46E5"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="completionRate"
                        name="Completion Rate (%)"
                        stroke="#10B981"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Topic Distribution Chart */}
        {chartType === "topics" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Topic Distribution Analysis</CardTitle>
              <p className="text-sm text-gray-500">Number of sessions and performance by topic</p>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topicDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, avgScore }) => `${name} (${avgScore}%)`}
                      >
                        {topicDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => {
                        return [`${value} sessions (Avg: ${props.payload.avgScore}%)`, name];
                      }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {topicDistributionData.length === 0 && !isLoadingStats && (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">No topic data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Time Spent Analysis */}
        {chartType === "time" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Time Spent Analysis</CardTitle>
              <p className="text-sm text-gray-500">Distribution of time spent on practice sessions</p>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeSpentData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        name="Number of Sessions"
                        fill="#0EA5E9"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Difficulty Analysis */}
        {chartType === "difficulty" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Question Difficulty Analysis</CardTitle>
              <p className="text-sm text-gray-500">Success rates by topic (lower rates indicate higher difficulty)</p>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={difficultyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="successRate"
                        name="Success Rate (%)"
                        fill="#8B5CF6"
                      />
                      <Bar
                        dataKey="questionsCount"
                        name="Number of Questions"
                        fill="#F59E0B"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {difficultyData.length === 0 && !isLoadingStats && (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">No difficulty data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Topic Performance Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Topic Performance Summary</CardTitle>
              <p className="text-sm text-gray-500">Average scores by subject area</p>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.topicPerformance?.map((topic: any) => (
                    <div key={topic.id}>
                      <div className="flex justify-between mb-1 items-center">
                        <div className="text-sm font-medium text-gray-900">{topic.name}</div>
                        <div className="text-sm font-medium text-gray-900">{topic.averageScore?.toFixed(0)}%</div>
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
                      <div className="text-xs text-gray-500 mt-1">
                        {topic.sessionCount} sessions, {topic.questionCount} questions
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Student Progress Insights</CardTitle>
              <p className="text-sm text-gray-500">Key performance metrics and trends</p>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 mb-1">Total Students</div>
                      <div className="text-2xl font-bold text-blue-900">{stats?.studentCount || 0}</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-700 mb-1">Sessions Completed</div>
                      <div className="text-2xl font-bold text-purple-900">{stats?.sessionCount || 0}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-700 mb-1">Average Score</div>
                      <div className="text-2xl font-bold text-green-900">
                        {stats?.averageScore ? `${stats.averageScore.toFixed(0)}%` : "N/A"}
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="text-sm text-amber-700 mb-1">Questions</div>
                      <div className="text-2xl font-bold text-amber-900">{stats?.questionCount || 0}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Performance Improvement</h3>
                    <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-primary h-3 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Last month: 70%</span>
                      <span>This month: 78%</span>
                      <span>+8% improvement</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
