import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Question, Topic } from "@shared/schema";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function ManageQuestions() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Fetch questions
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>({
    queryKey: ["/api/questions", selectedTopic && selectedTopic !== "all" ? `?topicId=${selectedTopic}` : ""],
    queryFn: async () => {
      const url = `/api/questions${selectedTopic && selectedTopic !== "all" ? `?topicId=${selectedTopic}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    }
  });

  // Fetch topics for filter dropdown
  const { data: topics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"]
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async (question: Question) => {
      const res = await apiRequest("PUT", `/api/questions/${question.id}`, question);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question updated",
        description: "The question has been successfully updated.",
      });
      setOpenEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating question",
        description: error.message || "Failed to update question.",
        variant: "destructive"
      });
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      await apiRequest("DELETE", `/api/questions/${questionId}`);
      return questionId;
    },
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The question has been successfully removed.",
      });
      setOpenDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting question",
        description: error.message || "Failed to delete question.",
        variant: "destructive"
      });
    }
  });

  // Filter questions based on search term
  const filteredQuestions = questions?.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (question.subtopic && question.subtopic.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Handle edit button click
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setOpenEditDialog(true);
  };

  // Handle delete button click
  const handleDelete = (question: Question) => {
    setQuestionToDelete(question);
    setOpenDeleteDialog(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (editingQuestion) {
      updateQuestionMutation.mutate(editingQuestion);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate(questionToDelete.id);
    }
  };

  // Get topic name by id
  const getTopicName = (topicId: number | null) => {
    if (!topicId) return "No Topic";
    return topics?.find(t => t.id === topicId)?.name || "Unknown Topic";
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
            <div>
              <CardTitle>Manage Questions</CardTitle>
              <p className="text-sm text-gray-500 mt-1">View, edit or delete questions from the database</p>
            </div>
            <Button onClick={() => window.location.href = '/admin/upload-questions'}>
              <Icons.add className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <Icons.search className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={selectedTopic}
                  onValueChange={setSelectedTopic}
                >
                  <SelectTrigger className="w-[200px]">
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
              </div>
            </div>
            
            {/* Questions Table */}
            {isLoadingQuestions ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : filteredQuestions && filteredQuestions.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Question</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Correct Answer</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.map((question) => {
                      let correctOptionText = "";
                      switch (question.correctOption) {
                        case "A": correctOptionText = question.optionA; break;
                        case "B": correctOptionText = question.optionB; break;
                        case "C": correctOptionText = question.optionC; break;
                        case "D": correctOptionText = question.optionD; break;
                      }
                      
                      return (
                        <TableRow key={question.id}>
                          <TableCell className="font-medium">
                            <div className="truncate max-w-md" title={question.text}>
                              {question.text}
                            </div>
                            {question.subtopic && (
                              <span className="text-xs text-gray-500 block mt-1">
                                Subtopic: {question.subtopic}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{getTopicName(question.topicId)}</TableCell>
                          <TableCell>
                            <span className="font-medium">{question.correctOption}:</span> {correctOptionText.substring(0, 20)}{correctOptionText.length > 20 ? '...' : ''}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(question)}
                              className="mr-2"
                            >
                              <Icons.edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(question)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Icons.delete className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-10 border rounded-lg">
                <Icons.questions className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No questions found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedTopic 
                    ? "Try adjusting your search or filter" 
                    : "Start by adding questions to your database"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Question Dialog */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>
                Make changes to the question below and save when you're done.
              </DialogDescription>
            </DialogHeader>
            {editingQuestion && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-question-text">Question Text</Label>
                  <Textarea
                    id="edit-question-text"
                    rows={3}
                    value={editingQuestion.text}
                    onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-topic">Topic</Label>
                    <Select
                      value={editingQuestion.topicId?.toString() || ""}
                      onValueChange={(value) => setEditingQuestion({...editingQuestion, topicId: value ? parseInt(value) : null})}
                    >
                      <SelectTrigger id="edit-topic">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics?.map(topic => (
                          <SelectItem key={topic.id} value={topic.id.toString()}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-subtopic">Subtopic</Label>
                    <Input
                      id="edit-subtopic"
                      value={editingQuestion.subtopic || ""}
                      onChange={(e) => setEditingQuestion({...editingQuestion, subtopic: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroup
                        value={editingQuestion.correctOption}
                        onValueChange={(value) => setEditingQuestion({...editingQuestion, correctOption: value})}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value="A" id="edit-option-a" />
                      </RadioGroup>
                      <Label htmlFor="edit-option-a" className="min-w-[80px]">Option A</Label>
                      <Input
                        value={editingQuestion.optionA}
                        onChange={(e) => setEditingQuestion({...editingQuestion, optionA: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroup
                        value={editingQuestion.correctOption}
                        onValueChange={(value) => setEditingQuestion({...editingQuestion, correctOption: value})}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value="B" id="edit-option-b" />
                      </RadioGroup>
                      <Label htmlFor="edit-option-b" className="min-w-[80px]">Option B</Label>
                      <Input
                        value={editingQuestion.optionB}
                        onChange={(e) => setEditingQuestion({...editingQuestion, optionB: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroup
                        value={editingQuestion.correctOption}
                        onValueChange={(value) => setEditingQuestion({...editingQuestion, correctOption: value})}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value="C" id="edit-option-c" />
                      </RadioGroup>
                      <Label htmlFor="edit-option-c" className="min-w-[80px]">Option C</Label>
                      <Input
                        value={editingQuestion.optionC}
                        onChange={(e) => setEditingQuestion({...editingQuestion, optionC: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroup
                        value={editingQuestion.correctOption}
                        onValueChange={(value) => setEditingQuestion({...editingQuestion, correctOption: value})}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value="D" id="edit-option-d" />
                      </RadioGroup>
                      <Label htmlFor="edit-option-d" className="min-w-[80px]">Option D</Label>
                      <Input
                        value={editingQuestion.optionD}
                        onChange={(e) => setEditingQuestion({...editingQuestion, optionD: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-explanation">Explanation</Label>
                  <Textarea
                    id="edit-explanation"
                    rows={2}
                    value={editingQuestion.explanation || ""}
                    onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setOpenEditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateQuestionMutation.isPending}
              >
                {updateQuestionMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Question Dialog */}
        <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the question
                from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteQuestionMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteQuestionMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}