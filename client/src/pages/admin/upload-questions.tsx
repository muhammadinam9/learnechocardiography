import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Topic } from "@shared/schema";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuestionFormData {
  text: string;
  topicId: string;
  subtopic: string;
  difficulty: string;
  imagePath: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
}

export default function UploadQuestions() {
  const { toast } = useToast();
  const [tab, setTab] = useState<string>("single");
  const [bulkText, setBulkText] = useState<string>("");
  const [formData, setFormData] = useState<QuestionFormData>({
    text: "",
    topicId: "",
    subtopic: "",
    difficulty: "medium",
    imagePath: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "",
    explanation: ""
  });
  
  // State for file uploads
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State for create topic dialog
  const [openTopicDialog, setOpenTopicDialog] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: "", description: "" });

  // Fetch topics for dropdown
  const { data: topics, isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics"]
  });
  
  // Mutation for creating a new topic
  const createTopicMutation = useMutation({
    mutationFn: async (topicData: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/topics", topicData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Topic created",
        description: `The topic "${data.name}" has been successfully created.`,
      });
      setOpenTopicDialog(false);
      setNewTopic({ name: "", description: "" });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      
      // Set the new topic as the selected topic
      setFormData(prev => ({ ...prev, topicId: data.id.toString() }));
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating topic",
        description: error.message || "Failed to create topic. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for adding a single question
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      const res = await apiRequest("POST", "/api/questions", questionData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Question added",
        description: "The question has been successfully added to the database.",
      });
      // Reset form
      setFormData({
        text: "",
        topicId: "",
        subtopic: "",
        difficulty: "medium",
        imagePath: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "",
        explanation: ""
      });
      setImageFile(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding question",
        description: error.message || "Failed to add question. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for bulk uploading questions via text
  const bulkUploadMutation = useMutation({
    mutationFn: async (questionsData: any) => {
      const res = await apiRequest("POST", "/api/questions/bulk", { questions: questionsData });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk upload successful",
        description: `Successfully added ${data.count} questions to the database.`,
      });
      // Reset form
      setBulkText("");
      setQuestionFile(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading questions",
        description: error.message || "Failed to upload questions. Please check the format and try again.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for bulk uploading questions via file
  const bulkFileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-bulk-questions', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File upload successful",
        description: `Successfully added ${data.count} questions to the database.`,
      });
      // Reset form
      setQuestionFile(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading file",
        description: error.message || "Failed to upload and process the file. Please check the format and try again.",
        variant: "destructive"
      });
    }
  });

  // Handle single question form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle correct option selection
  const handleCorrectOptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, correctOption: value }));
  };

  // Handle single question form submission
  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    
    // More comprehensive validation
    const missingFields = [];
    if (!formData.text) missingFields.push("Question text");
    if (!formData.topicId) missingFields.push("Topic");
    if (!formData.optionA) missingFields.push("Option A");
    if (!formData.optionB) missingFields.push("Option B");
    if (!formData.optionC) missingFields.push("Option C");
    if (!formData.optionD) missingFields.push("Option D");
    if (!formData.correctOption) missingFields.push("Correct option selection");
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in the following fields: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    // Additional validation for correctOption
    if (!["A", "B", "C", "D"].includes(formData.correctOption)) {
      toast({
        title: "Invalid correct option",
        description: "Correct option must be one of: A, B, C, D",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare data for API
      const questionData = {
        ...formData,
        topicId: parseInt(formData.topicId)
      };

      addQuestionMutation.mutate(questionData);
    } catch (error) {
      console.error("Error submitting question:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while submitting the question. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to parse bulk text into structured question objects
  const parseBulkQuestions = (text: string) => {
    let questions = [];
    
    // First, try to split by empty lines (traditional method)
    const questionBlocksByEmptyLine = text.split(/\n\s*\n/).filter(block => block.trim());
    
    // If we get multiple blocks using the empty line separator, process them the traditional way
    if (questionBlocksByEmptyLine.length > 1) {
      console.log("Using empty line separator for parsing");
      questions = parseQuestionBlocks(questionBlocksByEmptyLine);
    } else {
      // If there are no empty lines, try to identify questions by the "QUESTION:" pattern
      console.log("Using QUESTION: pattern for parsing");
      const lines = text.split('\n');
      const blocks: string[] = [];
      let currentBlock: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('QUESTION:') && currentBlock.length > 0) {
          // We found a new question, so save the current block and start a new one
          blocks.push(currentBlock.join('\n'));
          currentBlock = [lines[i]];
        } else {
          currentBlock.push(lines[i]);
        }
      }
      
      // Don't forget the last block
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join('\n'));
      }
      
      questions = parseQuestionBlocks(blocks);
    }
    
    return questions;
  };
  
  // Helper function to parse an array of question blocks
  const parseQuestionBlocks = (blocks: string[]) => {
    const questions = [];
    
    for (const block of blocks) {
      try {
        const lines = block.split('\n').filter(line => line.trim());
        const question: any = {};
        
        for (const line of lines) {
          if (line.startsWith('QUESTION:')) {
            question.text = line.replace('QUESTION:', '').trim();
          } else if (line.startsWith('TOPIC:')) {
            question.topic = line.replace('TOPIC:', '').trim();
          } else if (line.startsWith('SUBTOPIC:')) {
            question.subtopic = line.replace('SUBTOPIC:', '').trim();
          } else if (line.startsWith('DIFFICULTY:')) {
            question.difficulty = line.replace('DIFFICULTY:', '').trim();
          } else if (line.startsWith('OPTION A:')) {
            question.optionA = line.replace('OPTION A:', '').trim();
          } else if (line.startsWith('OPTION B:')) {
            question.optionB = line.replace('OPTION B:', '').trim();
          } else if (line.startsWith('OPTION C:')) {
            question.optionC = line.replace('OPTION C:', '').trim();
          } else if (line.startsWith('OPTION D:')) {
            question.optionD = line.replace('OPTION D:', '').trim();
          } else if (line.startsWith('CORRECT:')) {
            question.correctOption = line.replace('CORRECT:', '').trim();
          } else if (line.startsWith('EXPLANATION:')) {
            question.explanation = line.replace('EXPLANATION:', '').trim();
          }
        }
        
        // Set default difficulty if not provided
        if (!question.difficulty) {
          question.difficulty = "medium";
        }
        
        // Validate minimum required fields
        if (question.text && question.topic && 
            question.optionA && question.optionB && 
            question.optionC && question.optionD && 
            question.correctOption) {
          questions.push(question);
        } else {
          console.log("Skipping incomplete question:", question);
        }
      } catch (error) {
        console.error("Error parsing question block:", error);
      }
    }
    
    return questions;
  };

  // Handle bulk upload submission
  const handleBulkUpload = () => {
    try {
      if (!bulkText.trim()) {
        toast({
          title: "No content provided",
          description: "Please enter questions in the specified format.",
          variant: "destructive"
        });
        return;
      }

      const parsedQuestions = parseBulkQuestions(bulkText);
      
      if (parsedQuestions.length === 0) {
        toast({
          title: "No valid questions found",
          description: "Could not parse any valid questions from the provided text. Please check the format.",
          variant: "destructive"
        });
        return;
      }

      // Additional validation on parsed questions
      let hasValidationErrors = false;
      const invalidQuestions = parsedQuestions.filter(q => {
        // Check correct option format
        if (!["A", "B", "C", "D"].includes(q.correctOption)) {
          hasValidationErrors = true;
          return true;
        }
        return false;
      });

      if (hasValidationErrors) {
        toast({
          title: "Validation errors found",
          description: `${invalidQuestions.length} question(s) have incorrect 'CORRECT' values. Only A, B, C, or D are allowed.`,
          variant: "destructive"
        });
        return;
      }

      bulkUploadMutation.mutate(parsedQuestions);
    } catch (error) {
      console.error("Error processing bulk upload:", error);
      toast({
        title: "Error processing questions",
        description: "An unexpected error occurred. Please check your input format and try again.",
        variant: "destructive"
      });
    }
  };

  // Handle form reset
  const handleReset = () => {
    if (tab === 'single') {
      setFormData({
        text: "",
        topicId: "",
        subtopic: "",
        difficulty: "medium",
        imagePath: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "",
        explanation: ""
      });
      setImageFile(null);
    } else {
      setBulkText("");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 h-full">
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader className="border-b border-gray-200 flex-shrink-0">
            <CardTitle>Upload MCQ Questions</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Add questions by filling the form or uploading in bulk</p>
          </CardHeader>
          
          <CardContent className="p-6 overflow-auto flex-grow">
            {/* Question Format Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Question Format Guide</h3>
              <p className="text-sm text-blue-700 mb-2">Follow this format for proper question upload:</p>
              <div className="bg-white p-3 rounded border border-blue-200 text-xs font-mono text-gray-700">
                QUESTION: What is the derivative of f(x) = x² with respect to x?<br/>
                TOPIC: Mathematics<br/>
                SUBTOPIC: Calculus<br/>
                DIFFICULTY: medium<br/>
                OPTION A: 2x<br/>
                OPTION B: x²<br/>
                OPTION C: 2<br/>
                OPTION D: x<br/>
                CORRECT: A<br/>
                EXPLANATION: The derivative of x² is 2x using the power rule d/dx(x^n) = nx^(n-1).
              </div>
            </div>
            
            {/* Tab Navigation */}
            <Tabs value={tab} onValueChange={setTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Question</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              </TabsList>
              
              {/* Single Question Form */}
              <TabsContent value="single">
                <form onSubmit={handleSubmitQuestion} className="space-y-6">
                  <div>
                    <Label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text
                    </Label>
                    <Textarea 
                      id="text" 
                      name="text" 
                      rows={3} 
                      value={formData.text}
                      onChange={handleChange}
                      placeholder="Enter the question text"
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="topicId" className="block text-sm font-medium text-gray-700 mb-1">
                        Topic
                      </Label>
                      <Select 
                        value={formData.topicId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, topicId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTopics ? (
                            <div className="flex items-center justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            <>
                              {topics?.map(topic => (
                                <SelectItem key={topic.id} value={topic.id.toString()}>
                                  {topic.name}
                                </SelectItem>
                              ))}
                              <div className="border-t border-gray-200 my-1"></div>
                              <button
                                type="button"
                                className="w-full text-left py-1.5 px-2 text-sm rounded hover:bg-gray-100 text-blue-600 font-medium flex items-center"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenTopicDialog(true);
                                }}
                              >
                                <Icons.add className="mr-2 h-3.5 w-3.5" />
                                Create New Topic
                              </button>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="subtopic" className="block text-sm font-medium text-gray-700 mb-1">
                        Subtopic (Optional)
                      </Label>
                      <Input 
                        type="text" 
                        id="subtopic" 
                        name="subtopic" 
                        value={formData.subtopic}
                        onChange={handleChange}
                        placeholder="E.g., Calculus, Organic Chemistry"
                      />
                    </div>
                  </div>
                  
                  {/* Difficulty Level */}
                  <div>
                    <Label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </Label>
                    <Select 
                      value={formData.difficulty || "medium"} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Question Image (Optional)
                    </Label>
                    <div className="mt-1 flex flex-col space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                          <div className="flex flex-col items-center justify-center pt-5">
                            <Upload className="h-6 w-6 text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setImageFile(file);
                                // Create a FormData object to send the file
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                // Update state to show we're uploading
                                setUploadingImage(true);
                                
                                // Upload the image
                                fetch('/api/upload-image', {
                                  method: 'POST',
                                  body: formData,
                                  credentials: 'same-origin' // Important for authentication
                                })
                                  .then(res => {
                                    if (!res.ok) {
                                      throw new Error(`Error ${res.status}: ${res.statusText}`);
                                    }
                                    return res.json();
                                  })
                                  .then(data => {
                                    if (!data.imagePath) {
                                      throw new Error('No image path returned from server');
                                    }
                                    // Set the image path in the form data
                                    setFormData(prev => ({
                                      ...prev,
                                      imagePath: data.imagePath
                                    }));
                                    setUploadingImage(false);
                                    
                                    toast({
                                      title: "Image uploaded",
                                      description: "The image has been successfully uploaded.",
                                    });
                                  })
                                  .catch(err => {
                                    setUploadingImage(false);
                                    setImageFile(null); // Reset file selection on error
                                    toast({
                                      title: "Error uploading image",
                                      description: err.message || "Failed to upload image. Please try again.",
                                      variant: "destructive"
                                    });
                                    console.error("Image upload error:", err);
                                  });
                              }
                            }}
                          />
                        </label>
                      </div>
                      
                      {uploadingImage && (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-gray-500">Uploading image...</span>
                        </div>
                      )}
                      
                      {formData.imagePath && (
                        <div className="relative border rounded-md p-2">
                          <div className="text-xs text-gray-500 mb-1">Uploaded Image:</div>
                          <div className="relative h-32 bg-gray-100 rounded">
                            <img 
                              src={formData.imagePath} 
                              alt="Question" 
                              className="h-full max-h-32 object-contain mx-auto"
                            />
                          </div>
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-white rounded-full p-1"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, imagePath: "" }));
                              setImageFile(null);
                            }}
                          >
                            <Icons.close className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</Label>
                    
                    <RadioGroup 
                      value={formData.correctOption} 
                      onValueChange={handleCorrectOptionChange}
                      className="flex flex-wrap gap-x-6 mb-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="A" id="option-a" />
                        <Label htmlFor="option-a" className="text-sm font-medium text-gray-700">
                          Option A is correct
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="B" id="option-b" />
                        <Label htmlFor="option-b" className="text-sm font-medium text-gray-700">
                          Option B is correct
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="C" id="option-c" />
                        <Label htmlFor="option-c" className="text-sm font-medium text-gray-700">
                          Option C is correct
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="D" id="option-d" />
                        <Label htmlFor="option-d" className="text-sm font-medium text-gray-700">
                          Option D is correct
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="optionA" className="block text-sm font-medium text-gray-700 mb-1">
                          Option A
                        </Label>
                        <Input 
                          type="text" 
                          id="optionA"
                          name="optionA" 
                          value={formData.optionA}
                          onChange={handleChange}
                          placeholder="Enter option A text" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="optionB" className="block text-sm font-medium text-gray-700 mb-1">
                          Option B
                        </Label>
                        <Input 
                          type="text" 
                          id="optionB"
                          name="optionB" 
                          value={formData.optionB}
                          onChange={handleChange}
                          placeholder="Enter option B text" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="optionC" className="block text-sm font-medium text-gray-700 mb-1">
                          Option C
                        </Label>
                        <Input 
                          type="text" 
                          id="optionC"
                          name="optionC" 
                          value={formData.optionC}
                          onChange={handleChange}
                          placeholder="Enter option C text" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="optionD" className="block text-sm font-medium text-gray-700 mb-1">
                          Option D
                        </Label>
                        <Input 
                          type="text" 
                          id="optionD"
                          name="optionD" 
                          value={formData.optionD}
                          onChange={handleChange}
                          placeholder="Enter option D text" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-1">
                      Explanation (Optional)
                    </Label>
                    <Textarea 
                      id="explanation" 
                      name="explanation" 
                      rows={2} 
                      value={formData.explanation}
                      onChange={handleChange}
                      placeholder="Provide an explanation for the correct answer"
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleReset}
                      className="mr-4"
                    >
                      Clear
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addQuestionMutation.isPending}
                    >
                      {addQuestionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Question...
                        </>
                      ) : (
                        <>Add Question</>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              {/* Bulk Upload Form */}
              <TabsContent value="bulk">
                <div className="space-y-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-4">
                      Upload questions in bulk using our template format. Questions should be formatted as shown in the guide above.
                      Each question should be separated by a blank line, or each question should start with "QUESTION:" on a new line.
                    </p>
                    
                    {/* Upload Methods Tabs */}
                    <Tabs defaultValue="file" className="mb-6">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file">Upload File</TabsTrigger>
                        <TabsTrigger value="paste">Paste Text</TabsTrigger>
                      </TabsList>
                      
                      {/* File Upload Option */}
                      <TabsContent value="file">
                        <div className="flex flex-col gap-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2">
                            <h3 className="text-sm font-medium text-yellow-800 mb-1">Improved File Format</h3>
                            <p className="text-xs text-yellow-700">
                              Files are now automatically parsed even without blank lines between questions.
                              Each question should start with "QUESTION:" on a new line.
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                              <div className="flex flex-col items-center justify-center pt-7">
                                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  TXT, CSV files up to 5MB
                                </p>
                              </div>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept=".txt,.csv"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setQuestionFile(file);
                                    
                                    // Option 1: Read and process locally
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setBulkText(event.target?.result as string);
                                    };
                                    reader.readAsText(file);
                                    
                                    // Option 2: Server-side processing (uncomment to enable)
                                    // bulkFileUploadMutation.mutate(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          
                          {questionFile && (
                            <div className="bg-gray-50 p-3 rounded-md flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="font-medium text-sm text-gray-700">{questionFile.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({Math.round(questionFile.size / 1024)} KB)</span>
                              <button 
                                onClick={() => {
                                  setQuestionFile(null);
                                  setBulkText("");
                                }} 
                                className="ml-auto text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          
                          <div className="flex justify-end mt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setQuestionFile(null);
                                setBulkText("");
                              }}
                              className="mr-4"
                            >
                              Clear
                            </Button>
                            <Button 
                              type="button" 
                              onClick={handleBulkUpload}
                              disabled={bulkUploadMutation.isPending || (!questionFile && !bulkText.trim())}
                            >
                              {bulkUploadMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing File...
                                </>
                              ) : (
                                <>Process File</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      
                      {/* Text Paste Option */}
                      <TabsContent value="paste">
                        <div>
                          <div className="mb-6">
                            <Label htmlFor="bulk-text" className="block text-sm font-medium text-gray-700 mb-1">
                              Paste your questions
                            </Label>
                            <Textarea 
                              id="bulk-text" 
                              rows={12} 
                              value={bulkText}
                              onChange={(e) => setBulkText(e.target.value)}
                              placeholder="Paste questions in the format shown in the guide above..."
                              className="font-mono text-sm"
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setBulkText("")}
                              className="mr-4"
                            >
                              Clear
                            </Button>
                            <Button 
                              type="button" 
                              onClick={handleBulkUpload}
                              disabled={bulkUploadMutation.isPending || !bulkText.trim()}
                            >
                              {bulkUploadMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading Questions...
                                </>
                              ) : (
                                <>Upload Questions</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Topic Dialog */}
      <Dialog open={openTopicDialog} onOpenChange={setOpenTopicDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription>
              Add a new topic to organize your questions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topic-name" className="text-right">
                Name
              </Label>
              <Input
                id="topic-name"
                value={newTopic.name}
                onChange={(e) => setNewTopic(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Mathematics, Biology"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topic-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="topic-description"
                value={newTopic.description}
                onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Brief description of the topic"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpenTopicDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newTopic.name.trim()) {
                  toast({
                    title: "Name required",
                    description: "Please provide a name for the topic.",
                    variant: "destructive"
                  });
                  return;
                }
                createTopicMutation.mutate(newTopic);
              }}
              disabled={createTopicMutation.isPending}
            >
              {createTopicMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Topic"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
