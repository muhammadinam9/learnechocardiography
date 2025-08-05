import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/layout";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";

interface PendingUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  approved: boolean;
}

export default function UserApprovals() {
  const { toast } = useToast();

  // Fetch pending users
  const { data: pendingUsers, isLoading } = useQuery({
    queryKey: ["/api/users/pending-approval"],
    queryFn: async () => {
      const res = await fetch("/api/users/pending-approval");
      if (!res.ok) throw new Error("Failed to fetch pending users");
      return res.json() as Promise<PendingUser[]>;
    }
  });

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to approve user");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Approved",
        description: "The user can now access the platform.",
      });
      // Refetch the pending users list
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending-approval"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to reject user");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User Rejected",
        description: "The user has been removed from the system.",
      });
      // Refetch the pending users list
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending-approval"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">User Approvals</h1>
            <p className="text-gray-500 mt-1">
              Approve or reject user registration requests
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading pending approvals...</span>
          </div>
        ) : pendingUsers && pendingUsers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden w-full max-w-md mx-auto">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{user.fullName}</CardTitle>
                      <CardDescription>@{user.username}</CardDescription>
                    </div>
                    <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold text-gray-600">Email:</span> 
                      <span className="text-gray-900">{user.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="font-semibold text-gray-600">Registered:</span> 
                      <span className="text-gray-900">{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="font-semibold text-gray-600">Role:</span> 
                      <span className="text-gray-900">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-6 justify-end">
                    <Button 
                      className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white w-32"
                      onClick={() => approveMutation.mutate(user.id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="flex items-center justify-center w-32"
                      onClick={() => rejectMutation.mutate(user.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserX className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-12 mt-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">No Pending Approval Requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are currently no users waiting for approval.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}