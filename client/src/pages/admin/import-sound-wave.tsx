import { useState } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useLoadingProgress } from "@/hooks/use-loading-progress";

export default function ImportSoundWave() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    message: string;
    count: number;
    topic: { id: number; name: string; description: string };
  } | null>(null);
  
  const importProgress = useLoadingProgress(isImporting, {
    initialProgress: 5,
    maxProgress: 90,
    duration: 80
  });
  
  const handleImport = async () => {
    try {
      setIsImporting(true);
      
      const response = await apiRequest("POST", "/api/questions/import-sound-wave");
      const data = await response.json();
      
      setImportResults(data);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.count} Sound Wave Fundamentals questions`
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Sound Wave Fundamentals</h1>
          <p className="text-gray-500 mt-2">
            Import a set of multiple-choice questions on Sound Wave Fundamentals from the attached files.
          </p>
        </div>
        
        {isImporting ? (
          <Card>
            <CardContent className="pt-6">
              <LoadingAnimation 
                title="Importing questions..." 
                description="This may take a few moments"
                isLoading={true}
                progress={importProgress}
                icon="rocket"
              />
            </CardContent>
          </Card>
        ) : importResults ? (
          <Card>
            <CardHeader>
              <CardTitle>Import Complete</CardTitle>
              <CardDescription>
                The Sound Wave Fundamentals questions have been successfully imported.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="font-medium text-green-800 flex items-center">
                    <Icons.correct className="h-5 w-5 mr-2" />
                    {importResults.message}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-500">Topic Name</div>
                    <div className="font-medium">{importResults.topic.name}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-500">Questions Added</div>
                    <div className="font-medium">{importResults.count}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-500">Topic ID</div>
                    <div className="font-medium">{importResults.topic.id}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-medium mb-2">Topic Description</h3>
                  <p className="text-gray-600">{importResults.topic.description}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setImportResults(null)}>
                Import Again
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Import Questions</CardTitle>
              <CardDescription>
                Add the Sound Wave Fundamentals questions to the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800 mb-2">About this import</h3>
                  <p className="text-blue-700 text-sm">
                    This will import a set of multiple-choice questions on Sound Wave Fundamentals.
                    The questions cover topics such as wavelength, frequency, amplitude, and other
                    physics principles related to sound waves.
                  </p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <h3 className="font-medium text-amber-800 mb-2">Important information</h3>
                  <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                    <li>A new topic will be created if it doesn't exist already</li>
                    <li>All questions will be assigned to the Sound Wave Fundamentals topic</li>
                    <li>This operation cannot be undone</li>
                    <li>Importing again may create duplicate questions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleImport} className="w-full sm:w-auto">
                <Icons.upload className="mr-2 h-4 w-4" />
                Import Sound Wave Questions
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}