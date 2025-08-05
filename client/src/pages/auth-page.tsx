import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoginData, RegisterData, forgotPasswordSchema, resetPasswordSchema, loginSchema, registerSchema, ForgotPasswordData, ResetPasswordData } from "@shared/schema";
import { Redirect, useLocation, Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import logoImage from "../assets/logo.png";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Redirect if user is already logged in
  if (user) {
    if (user.role === "admin") {
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/" />;
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 lg:p-8 bg-gray-50">
      <div className="w-full max-w-md mt-8">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-primary p-6 text-white">
            <div className="flex justify-center mb-2">
              <img src={logoImage} alt="The Aquarius Institute" className="h-14" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-700">MCQ Practice Platform</h2>
            </div>
            
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              
              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-sm text-gray-500 mt-4 mb-2 text-center">
        <p>Developed by Muhammad Inam</p>
        <p>© {new Date().getFullYear()} The Aquarius Institute. All rights reserved.</p>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  function onSubmit(data: LoginData) {
    loginMutation.mutate(data);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox id="remember" />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing In..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  
  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      role: "student"
    }
  });
  
  function onSubmit(data: RegisterData) {
    registerMutation.mutate(data, {
      onSuccess: (response: any) => {
        // Check if there's a message indicating pending approval
        if (response.message && response.message.includes('pending approval')) {
          setRegistrationMessage(response.message);
          setRegistrationComplete(true);
        }
      }
    });
  }
  
  if (registrationComplete) {
    return (
      <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
        <h3 className="font-semibold text-blue-800">Registration Successful</h3>
        <p className="text-blue-700">{registrationMessage}</p>
        <p className="text-sm text-blue-600">
          You will be able to log in once an administrator approves your account.
        </p>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Choose a username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </Form>
  );
}

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });
  
  async function onSubmit(data: ForgotPasswordData) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/forgot-password", data);
      const result = await response.json();
      
      if (response.ok) {
        setTokenSent(true);
        setResetToken(result.token);
        toast({
          title: "Reset instructions sent",
          description: "If an account with that email exists, you'll receive reset instructions.",
          variant: "default",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: result.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 lg:p-8 bg-gray-50">
      <div className="w-full max-w-md mt-8">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-primary p-6 text-white">
            <div className="flex justify-center mb-2">
              <img src={logoImage} alt="The Aquarius Institute" className="h-14" />
            </div>
            <p className="text-center text-white/80 mt-1">Forgot Password</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {!tokenSent ? (
              <>
                <p className="text-center text-gray-500">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Reset Password"}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <Link href="/auth" className="text-primary hover:underline">
                        Back to login
                      </Link>
                    </div>
                  </form>
                </Form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 text-green-700 p-4 rounded-md">
                  <p className="text-center">
                    Reset instructions have been sent if an account with that email exists.
                  </p>
                  <p className="text-center text-sm mt-2">
                    Please check your email inbox for a message with password reset instructions.
                  </p>
                </div>
                
                {resetToken && process.env.NODE_ENV === 'development' && (
                  <div className="p-4 border rounded-md bg-yellow-50">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>Development Mode:</strong> In production, this token would be sent via email.
                    </p>
                    <p className="text-sm text-yellow-800 mb-2">
                      To enable email sending, add these secrets in your Replit environment:
                    </p>
                    <ul className="text-xs text-yellow-800 list-disc pl-5 mb-2">
                      <li>EMAIL_HOST (e.g., smtp.gmail.com)</li>
                      <li>EMAIL_PORT (e.g., 587)</li>
                      <li>EMAIL_SECURE (true/false)</li>
                      <li>EMAIL_USER (your email address)</li>
                      <li>EMAIL_PASS (your password or app password)</li>
                    </ul>
                    <p className="text-sm text-yellow-800 break-all bg-white p-2 rounded">
                      Token: {resetToken}
                    </p>
                    <Button 
                      className="w-full mt-2" 
                      onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                    >
                      Continue to Reset Password
                    </Button>
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <Link href="/auth" className="text-primary hover:underline">
                    Back to login
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="text-sm text-gray-500 mt-4 mb-2 text-center">
        <p>Developed by Muhammad Inam</p>
        <p>© {new Date().getFullYear()} The Aquarius Institute. All rights reserved.</p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Extract token from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token || "",
      password: "",
      confirmPassword: ""
    }
  });
  
  async function onSubmit(data: ResetPasswordData) {
    setIsSubmitting(true);
    try {
      // Ensure the token from URL is used if available
      const formData = {
        ...data,
        token: token || data.token
      };
      
      console.log("Submitting reset password with token length:", formData.token?.length || 0);
      
      const response = await apiRequest("POST", "/api/reset-password", formData);
      const result = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
          variant: "default",
        });
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        console.error("Reset password error:", result);
        toast({
          title: "Error",
          description: result.message || "Failed to reset password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reset password exception:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between p-4 lg:p-8 bg-gray-50">
        <div className="w-full max-w-md mt-8">
          <Card className="shadow-lg">
            <CardHeader className="bg-primary p-6 text-white">
              <div className="flex justify-center mb-2">
                <img src={logoImage} alt="The Aquarius Institute" className="h-14" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-4">
                <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Reset Link</h2>
                <p className="text-gray-500 mb-4">
                  The password reset link is missing a token. Please request a new password reset.
                </p>
                <Button onClick={() => navigate("/forgot-password")}>
                  Request Password Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-sm text-gray-500 mt-4 mb-2 text-center">
          <p>Developed by Muhammad Inam</p>
          <p>© {new Date().getFullYear()} The Aquarius Institute. All rights reserved.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 lg:p-8 bg-gray-50">
      <div className="w-full max-w-md mt-8">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-primary p-6 text-white">
            <div className="flex justify-center mb-2">
              <img src={logoImage} alt="The Aquarius Institute" className="h-14" />
            </div>
            <p className="text-center text-white/80 mt-1">Reset Password</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {!success ? (
              <>
                <p className="text-center text-gray-500">
                  Enter your new password below.
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Updating Password..." : "Reset Password"}
                    </Button>
                  </form>
                </Form>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-green-50 text-green-700 p-4 rounded-md">
                  <p>
                    Your password has been reset successfully!
                  </p>
                  <p className="text-sm mt-2">
                    Redirecting to login page...
                  </p>
                </div>
                
                <Button onClick={() => navigate("/auth")} className="mt-4">
                  Return to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="text-sm text-gray-500 mt-4 mb-2 text-center">
        <p>Developed by Muhammad Inam</p>
        <p>© {new Date().getFullYear()} The Aquarius Institute. All rights reserved.</p>
      </div>
    </div>
  );
}
