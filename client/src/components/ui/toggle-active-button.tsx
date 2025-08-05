import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Icons } from "@/components/icons";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ToggleActiveButtonProps {
  student: User;
  onSuccess?: () => void;
}

export function ToggleActiveButton({ student, onSuccess }: ToggleActiveButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Toggle student active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      setIsLoading(true);
      try {
        const res = await apiRequest("POST", `/api/users/${id}/toggle-active`, { active });
        return await res.json();
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: data.user && data.user.active ? "Student activated" : "Student deactivated",
        description: data.message,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating student status",
        description: error.message || "Failed to update student status.",
        variant: "destructive"
      });
    }
  });

  // Handle toggling student active status
  const handleToggleActive = () => {
    toggleActiveMutation.mutate({
      id: student.id,
      active: !student.active
    });
  };

  return (
    <Button
      variant={student.active ? "outline" : "default"}
      size="sm"
      onClick={handleToggleActive}
      disabled={isLoading}
      className={student.active ? "border-green-500 text-green-600 hover:bg-green-50" : "bg-red-600 hover:bg-red-700"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : student.active ? (
        <>
          <Icons.active className="h-4 w-4 mr-1" />
          Active
        </>
      ) : (
        <>
          <Icons.inactive className="h-4 w-4 mr-1" />
          Inactive
        </>
      )}
    </Button>
  );
}