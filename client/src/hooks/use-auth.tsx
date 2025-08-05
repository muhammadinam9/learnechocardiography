import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { LoginData, RegisterData, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: Omit<User, 'password'> | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, 'password'>, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<Omit<User, 'password'> | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: Omit<User, 'password'>) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        if (!res.ok) {
          const errorData = await res.json();
          // Special handling for 503 Service Unavailable (database connection issues)
          if (res.status === 503) {
            throw new Error(errorData.message || "Database connection issue. The registration service is temporarily unavailable. Please try again later.");
          }
          // Convert other HTTP errors to exceptions with the error message from the server
          throw new Error(errorData.message || `Registration failed with status: ${res.status}`);
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to connect to registration service");
      }
    },
    onSuccess: (response: Omit<User, 'password'> & { message?: string }) => {
      // Check if the user is approved (message indicates pending approval)
      if (response.message) {
        // For unapproved users, show the pending approval message but don't log them in
        toast({
          title: "Registration successful",
          description: response.message,
          duration: 5000,
        });
      } else {
        // For approved users, set them in the authentication context
        queryClient.setQueryData(["/api/user"], response);
        toast({
          title: "Registration successful",
          description: `Welcome, ${response.fullName}!`,
        });
      }
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      
      // Check if it's a database connection issue
      const errorMsg = error.message || "";
      if (errorMsg.includes("database") || errorMsg.includes("temporarily unavailable") || errorMsg.includes("503")) {
        toast({
          title: "Registration service unavailable",
          description: "The registration service is currently unavailable due to database connection issues. Please try again later.",
          variant: "destructive",
          duration: 7000,
        });
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "Failed to create account. Please try again later.",
          variant: "destructive",
          duration: 5000,
        });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
