import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage, { ForgotPasswordPage, ResetPasswordPage } from "./pages/auth-page";
import StudentDashboard from "./pages/student/dashboard";
import PracticeSession from "./pages/student/practice-session";
import ResultsPage from "./pages/results/[id]";
import SessionResults from "./pages/student/session-results";
import AdminDashboard from "./pages/admin/dashboard";
import UploadQuestions from "./pages/admin/upload-questions";
import ManageQuestions from "./pages/admin/manage-questions";
import ManageTopics from "./pages/admin/manage-topics";
import ManageStudents from "./pages/admin/manage-students";
import UserApprovals from "./pages/admin/user-approvals";
import Analytics from "./pages/admin/analytics";
import BackupManagement from "./pages/admin/backup-management";
import StudentDetails from "./pages/admin/student-details";
import SessionDetails from "./pages/admin/session-details";

function Router() {
  return (
    <Switch>
      {/* Authentication */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Student Routes */}
      <ProtectedRoute path="/" component={StudentDashboard} requiredRole="student" />
      <ProtectedRoute path="/practice/:topicId?" component={PracticeSession} requiredRole="student" />
      <ProtectedRoute path="/results/:id" component={ResultsPage} requiredRole="student" />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} requiredRole="admin" />
      <ProtectedRoute path="/admin/upload-questions" component={UploadQuestions} requiredRole="admin" />
      <ProtectedRoute path="/admin/manage-questions" component={ManageQuestions} requiredRole="admin" />
      <ProtectedRoute path="/admin/manage-topics" component={ManageTopics} requiredRole="admin" />
      <ProtectedRoute path="/admin/manage-students" component={ManageStudents} requiredRole="admin" />
      <ProtectedRoute path="/admin/user-approvals" component={UserApprovals} requiredRole="admin" />
      <ProtectedRoute path="/admin/analytics" component={Analytics} requiredRole="admin" />
      <ProtectedRoute path="/admin/backup-management" component={BackupManagement} requiredRole="admin" />
      <ProtectedRoute path="/admin/student-details/:id" component={StudentDetails} requiredRole="admin" />
      <ProtectedRoute path="/admin/session-details/:id" component={SessionDetails} requiredRole="admin" />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
