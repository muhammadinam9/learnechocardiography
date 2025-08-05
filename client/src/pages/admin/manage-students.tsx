import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { ToggleActiveButton } from "@/components/ui/toggle-active-button";

// Form schema for adding new student
const addStudentSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Form schema for editing student
const editStudentSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "student"])
});

type AddStudentFormValues = z.infer<typeof addStudentSchema>;
type EditStudentFormValues = z.infer<typeof editStudentSchema>;

export default function ManageStudents() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("fullName");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resettingStudent, setResettingStudent] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  
  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<User[]>({
    queryKey: ["/api/users", "?role=student"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=student");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    }
  });

  // Add student form
  const addStudentForm = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  // Edit student form
  const editStudentForm = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      role: "student"
    }
  });

  // Register student mutation
  const registerStudentMutation = useMutation({
    mutationFn: async (data: AddStudentFormValues) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "student"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Student added",
        description: "The student has been successfully added.",
      });
      setIsAddDialogOpen(false);
      addStudentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding student",
        description: error.message || "Failed to add student.",
        variant: "destructive"
      });
    }
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (data: { id: number, userData: EditStudentFormValues }) => {
      const res = await apiRequest("PUT", `/api/users/${data.id}`, data.userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Student updated",
        description: "The student details have been successfully updated.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating student",
        description: error.message || "Failed to update student details.",
        variant: "destructive"
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest("DELETE", `/api/users/${studentId}`);
      return studentId;
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "The student has been successfully removed.",
      });
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting student",
        description: error.message || "Failed to delete student.",
        variant: "destructive"
      });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number, password: string }) => {
      const res = await apiRequest("POST", `/api/admin/reset-password`, {
        userId,
        newPassword: password
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "The student's password has been successfully reset.",
      });
      setIsResetPasswordDialogOpen(false);
      setResettingStudent(null);
      setNewPassword("");
      setConfirmNewPassword("");
      setResetPasswordError("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error resetting password",
        description: error.message || "Failed to reset password.",
        variant: "destructive"
      });
    }
  });

  // Handle adding a new student
  const onAddStudent = (data: AddStudentFormValues) => {
    registerStudentMutation.mutate(data);
  };

  // Handle editing a student
  const onEditStudent = (data: EditStudentFormValues) => {
    if (editingStudent) {
      updateStudentMutation.mutate({
        id: editingStudent.id,
        userData: data
      });
    }
  };

  // Handle deleting a student
  const handleDeleteStudent = (student: User) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  // Handle editing a student (open dialog with prefilled data)
  const handleEditStudent = (student: User) => {
    setEditingStudent(student);
    // Cast role to the expected union type since we know it's one of these values
    const role = student.role === "admin" ? "admin" : "student" as const;
    editStudentForm.reset({
      username: student.username,
      fullName: student.fullName,
      email: student.email,
      role
    });
    setIsEditDialogOpen(true);
  };

  // Handle confirm delete
  const confirmDelete = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
    }
  };
  
  // Handle password reset
  const handleResetPassword = (student: User) => {
    setResettingStudent(student);
    setIsResetPasswordDialogOpen(true);
  };

  // Handle password reset submission
  const submitPasswordReset = () => {
    setResetPasswordError("");
    
    if (!newPassword || newPassword.length < 6) {
      setResetPasswordError("Password must be at least 6 characters");
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setResetPasswordError("Passwords don't match");
      return;
    }
    
    if (resettingStudent) {
      resetPasswordMutation.mutate({
        userId: resettingStudent.id,
        password: newPassword
      });
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked && students) {
      setSelectedStudents(students.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Handle individual student selection
  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  // Sort and filter students
  const filteredStudents = students
    ?.filter(student => 
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'fullName') {
        return a.fullName.localeCompare(b.fullName);
      } else if (sortBy === 'email') {
        return a.email.localeCompare(b.email);
      } else if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  return (
    <AdminLayout>
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
            <div>
              <CardTitle>Manage Students</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Add, edit or remove student accounts</p>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Icons.add className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <Icons.search className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fullName">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="createdAt">Date Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Students Table */}
            {isLoadingStudents ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredStudents && filteredStudents.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={students && filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all students"
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                            aria-label={`Select ${student.fullName}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              <Icons.user className="h-4 w-4" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                              <div className="text-xs text-gray-400">@{student.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(student.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${student.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-sm ${student.active ? 'text-green-600' : 'text-red-600'}`}>
                              {student.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="mr-2"
                          >
                            <Link href={`/admin/student-details/${student.id}`}>
                              <Icons.chart className="h-4 w-4 mr-1" />
                              Details
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="mr-2"
                          >
                            <Icons.edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(student)}
                            className="mr-2"
                            title="Reset Password"
                          >
                            <Icons.key className="h-4 w-4" />
                          </Button>
                          <div className="mr-2">
                            <ToggleActiveButton 
                              student={student} 
                              onSuccess={() => {
                                // Force refresh the students list
                                queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                              }} 
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Icons.delete className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-10 border rounded-lg">
                <Icons.users className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? "Try adjusting your search" 
                    : "Start by adding students to your platform"}
                </p>
              </div>
            )}
            
            {/* Pagination */}
            {filteredStudents && filteredStudents.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">1</span> to{" "}
                  <span className="font-medium">{filteredStudents.length}</span> of{" "}
                  <span className="font-medium">{filteredStudents.length}</span> students
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    <Icons.previous className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="bg-primary text-white">1</Button>
                  <Button variant="outline" size="sm" disabled>
                    <Icons.next className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Student Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Add a new student account to the platform. They'll receive login credentials.
              </DialogDescription>
            </DialogHeader>
            <Form {...addStudentForm}>
              <form onSubmit={addStudentForm.handleSubmit(onAddStudent)} className="space-y-4">
                <FormField
                  control={addStudentForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addStudentForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addStudentForm.control}
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
                  control={addStudentForm.control}
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
                  control={addStudentForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={registerStudentMutation.isPending}
                  >
                    {registerStudentMutation.isPending ? "Adding..." : "Add Student"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update student account information.
              </DialogDescription>
            </DialogHeader>
            <Form {...editStudentForm}>
              <form onSubmit={editStudentForm.handleSubmit(onEditStudent)} className="space-y-4">
                <FormField
                  control={editStudentForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editStudentForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editStudentForm.control}
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
                  control={editStudentForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateStudentMutation.isPending}
                  >
                    {updateStudentMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {resettingStudent?.fullName}. 
                The student will use this password for their next login.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
              
              {resetPasswordError && (
                <div className="text-red-500 text-sm">{resetPasswordError}</div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsResetPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitPasswordReset}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Student Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the student account
                and all associated practice session data. 
                <strong className="block mt-2">
                  Consider deactivating the student account instead of deleting it to preserve records.
                </strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteStudentMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
