import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Topic } from "@shared/schema";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ManageTopics() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [newTopic, setNewTopic] = useState({ name: "", description: "" });
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [openNewTopicDialog, setOpenNewTopicDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Fetch topics
  const { data: topics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"]
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (topic: Omit<Topic, "id">) => {
      const res = await apiRequest("POST", "/api/topics", topic);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Topic created",
        description: "New topic has been successfully created.",
      });
      setOpenNewTopicDialog(false);
      setNewTopic({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating topic",
        description: error.message || "Failed to create topic.",
        variant: "destructive"
      });
    }
  });

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: async (topic: Topic) => {
      const res = await apiRequest("PUT", `/api/topics/${topic.id}`, topic);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Topic updated",
        description: "The topic has been successfully updated.",
      });
      setOpenEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating topic",
        description: error.message || "Failed to update topic.",
        variant: "destructive"
      });
    }
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: number) => {
      await apiRequest("DELETE", `/api/topics/${topicId}`);
      return topicId;
    },
    onSuccess: () => {
      toast({
        title: "Topic deleted",
        description: "The topic has been successfully removed.",
      });
      setOpenDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting topic",
        description: error.message || "Failed to delete topic. Make sure there are no questions associated with this topic.",
        variant: "destructive"
      });
    }
  });

  // Filter topics based on search term
  const filteredTopics = topics?.filter(topic => 
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (topic.description && topic.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle create topic
  const handleCreateTopic = () => {
    if (!newTopic.name.trim()) {
      toast({
        title: "Missing information",
        description: "Topic name is required.",
        variant: "destructive"
      });
      return;
    }
    
    createTopicMutation.mutate(newTopic);
  };

  // Handle edit button click
  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setOpenEditDialog(true);
  };

  // Handle delete button click
  const handleDelete = (topic: Topic) => {
    setTopicToDelete(topic);
    setOpenDeleteDialog(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (editingTopic) {
      updateTopicMutation.mutate(editingTopic);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (topicToDelete) {
      deleteTopicMutation.mutate(topicToDelete.id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
            <div>
              <CardTitle>Manage Topics</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Create, edit, or delete topic categories</p>
            </div>
            <Button onClick={() => setOpenNewTopicDialog(true)}>
              <Icons.add className="mr-2 h-4 w-4" /> Add Topic
            </Button>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Search */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <Icons.search className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            {/* Topics Table */}
            {isLoadingTopics ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredTopics && filteredTopics.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic Name</TableHead>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTopics.map((topic) => (
                      <TableRow key={topic.id}>
                        <TableCell className="font-medium">
                          {topic.name}
                        </TableCell>
                        <TableCell>
                          {topic.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {topic.questionCount || 0}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {topic.questionCount === 1 ? 'question' : 'questions'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(topic)}
                            className="mr-2"
                          >
                            <Icons.edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(topic)}
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
                <Icons.topic className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No topics found</h3>
                <p className="text-gray-500">
                  {searchTerm ? "Try adjusting your search" : "Start by adding topics to your database"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Topic Dialog */}
        <Dialog open={openNewTopicDialog} onOpenChange={setOpenNewTopicDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Topic</DialogTitle>
              <DialogDescription>
                Create a new topic category for organizing questions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="topic-name">Topic Name</Label>
                <Input
                  id="topic-name"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic({...newTopic, name: e.target.value})}
                  placeholder="e.g., Physics, History, Biology"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-description">Description (Optional)</Label>
                <Textarea
                  id="topic-description"
                  rows={3}
                  value={newTopic.description || ""}
                  onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                  placeholder="Provide a brief description of this topic"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNewTopicDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTopic} disabled={createTopicMutation.isPending}>
                {createTopicMutation.isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Topic"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Topic Dialog */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Topic</DialogTitle>
              <DialogDescription>
                Make changes to the topic details below.
              </DialogDescription>
            </DialogHeader>
            {editingTopic && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-topic-name">Topic Name</Label>
                  <Input
                    id="edit-topic-name"
                    value={editingTopic.name}
                    onChange={(e) => setEditingTopic({...editingTopic, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-topic-description">Description</Label>
                  <Textarea
                    id="edit-topic-description"
                    rows={3}
                    value={editingTopic.description || ""}
                    onChange={(e) => setEditingTopic({...editingTopic, description: e.target.value})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateTopicMutation.isPending}>
                {updateTopicMutation.isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Topic Confirmation */}
        <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the topic
                "{topicToDelete?.name}" and may affect associated questions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteTopicMutation.isPending ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Topic"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}