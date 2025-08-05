import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Calendar, Download, Eye, FileText, HardDrive, Plus, RefreshCw, Trash2, Upload, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BackupFile {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  isAutomatic: boolean;
  status: "success" | "error";
}

export default function BackupManagement() {
  const { toast } = useToast();
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [backupContent, setBackupContent] = useState<string>("");
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({
    list: true,
    create: false,
    restore: false,
    view: false,
    delete: false,
  });
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [nextBackupDate, setNextBackupDate] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<"idle" | "running" | "complete" | "error">("idle");

  useEffect(() => {
    fetchBackups();
    fetchBackupSchedule();
  }, []);

  const fetchBackups = async () => {
    setLoading({ ...loading, list: true });
    try {
      const response = await apiRequest("GET", "/api/backups");
      const data = await response.json();
      setBackupFiles(data.backups);
    } catch (error) {
      console.error("Failed to fetch backups:", error);
      toast({
        title: "Error Fetching Backups",
        description: "Failed to load backup files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, list: false });
    }
  };

  const fetchBackupSchedule = async () => {
    try {
      const response = await apiRequest("GET", "/api/backups/schedule");
      const data = await response.json();
      setLastBackupDate(data.lastBackup);
      setNextBackupDate(data.nextBackup);
    } catch (error) {
      console.error("Failed to fetch backup schedule:", error);
    }
  };

  const createManualBackup = async () => {
    setLoading({ ...loading, create: true });
    setBackupStatus("running");
    try {
      const response = await apiRequest("POST", "/api/backups/create");
      const data = await response.json();
      toast({
        title: "Backup Created",
        description: "Manual backup completed successfully.",
      });
      fetchBackups();
      setBackupStatus("complete");
    } catch (error) {
      console.error("Failed to create backup:", error);
      toast({
        title: "Backup Failed",
        description: "Failed to create manual backup. Please try again.",
        variant: "destructive",
      });
      setBackupStatus("error");
    } finally {
      setLoading({ ...loading, create: false });
      setTimeout(() => setBackupStatus("idle"), 3000);
    }
  };

  const viewBackupContent = async (backup: BackupFile) => {
    setSelectedBackup(backup);
    setLoading({ ...loading, view: true });
    setOpenDialog("view");
    try {
      const response = await apiRequest("GET", `/api/backups/${backup.id}/content`);
      const data = await response.json();
      setBackupContent(JSON.stringify(data.content, null, 2));
    } catch (error) {
      console.error("Failed to view backup:", error);
      toast({
        title: "Error Viewing Backup",
        description: "Failed to load backup content. Please try again.",
        variant: "destructive",
      });
      setBackupContent("Error loading backup content");
    } finally {
      setLoading({ ...loading, view: false });
    }
  };

  const deleteBackup = async (backup: BackupFile) => {
    if (confirmText !== backup.filename) {
      toast({
        title: "Confirmation Failed",
        description: "Please type the backup filename correctly to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    setLoading({ ...loading, delete: true });
    try {
      await apiRequest("DELETE", `/api/backups/${backup.id}`);
      toast({
        title: "Backup Deleted",
        description: "Backup file has been deleted successfully.",
      });
      setOpenDialog(null);
      fetchBackups();
    } catch (error) {
      console.error("Failed to delete backup:", error);
      toast({
        title: "Error Deleting Backup",
        description: "Failed to delete backup file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, delete: false });
      setConfirmText("");
    }
  };

  const restoreBackup = async (backup: BackupFile) => {
    if (confirmText !== backup.filename) {
      toast({
        title: "Confirmation Failed",
        description: "Please type the backup filename correctly to confirm restoration.",
        variant: "destructive",
      });
      return;
    }

    setLoading({ ...loading, restore: true });
    try {
      await apiRequest("POST", `/api/backups/${backup.id}/restore`);
      toast({
        title: "Backup Restored",
        description: "Data has been restored successfully from the backup.",
      });
      setOpenDialog(null);
    } catch (error) {
      console.error("Failed to restore backup:", error);
      toast({
        title: "Error Restoring Backup",
        description: "Failed to restore from backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, restore: false });
      setConfirmText("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    try {
      // If the date is already formatted (from the server), just return it
      if (typeof dateString === 'string' && dateString.includes('AM') || dateString.includes('PM')) {
        return dateString;
      }
      // Otherwise format it with date-fns, using Central Time
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'America/Chicago' // Central Time Zone (CST/CDT)
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup Management</h1>
            <p className="text-muted-foreground mt-1">
              Create, restore, and manage database backups
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchBackups}
              variant="outline"
              className="gap-1"
              disabled={loading.list}
            >
              <RefreshCw className={`h-4 w-4 ${loading.list ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={createManualBackup}
              className="gap-1"
              disabled={loading.create || backupStatus !== "idle"}
            >
              {backupStatus === "idle" && <HardDrive className="h-4 w-4" />}
              {backupStatus === "running" && <RefreshCw className="h-4 w-4 animate-spin" />}
              {backupStatus === "complete" && <Download className="h-4 w-4" />}
              {backupStatus === "error" && <AlertCircle className="h-4 w-4" />}
              {backupStatus === "idle" && "Create Backup"}
              {backupStatus === "running" && "Processing..."}
              {backupStatus === "complete" && "Completed"}
              {backupStatus === "error" && "Failed"}
            </Button>
          </div>
        </div>

        {/* Backup Schedule Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Backup Schedule</CardTitle>
            <CardDescription>Information about automatic backup schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Automatic Backup</p>
                  <p className="text-sm text-muted-foreground">
                    {lastBackupDate ? formatDate(lastBackupDate) : "No previous backup"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Next Scheduled Backup</p>
                  <p className="text-sm text-muted-foreground">
                    {nextBackupDate ? formatDate(nextBackupDate) : "8:00 AM daily"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Files List */}
        <Card>
          <CardHeader>
            <CardTitle>Backup Files</CardTitle>
            <CardDescription>Manage your database backup files</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.list ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : backupFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Backup Files</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any backup files yet. Create your first backup to protect your data.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {backupFiles.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 mb-3 md:mb-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-medium">{backup.filename}</span>
                        <Badge variant={backup.isAutomatic ? "outline" : "default"} className="ml-2">
                          {backup.isAutomatic ? "Automatic" : "Manual"}
                        </Badge>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(backup.createdAt)}</span>
                        <span className="mx-2">•</span>
                        <span>{formatFileSize(backup.size)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewBackupContent(backup)}
                        className="w-full md:w-auto"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full md:w-auto"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setOpenDialog("restore");
                        }}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full md:w-auto"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setOpenDialog("delete");
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Backup Dialog */}
        <Dialog open={openDialog === "view"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedBackup?.filename} - Backup Content
              </DialogTitle>
              <DialogDescription>
                Viewing the content of this backup file
              </DialogDescription>
            </DialogHeader>
            {loading.view ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <pre className="bg-muted rounded-md p-4 text-xs overflow-auto">
                  {backupContent}
                </pre>
              </ScrollArea>
            )}
            <DialogFooter>
              <Button onClick={() => setOpenDialog(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore Backup Dialog */}
        <Dialog open={openDialog === "restore"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                Restore from Backup
              </DialogTitle>
              <DialogDescription>
                This will replace all current data with the data from this backup. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Restoring from a backup will overwrite all existing data. Make sure to create a new backup first if needed.
              </AlertDescription>
            </Alert>
            <div className="space-y-3 mt-2">
              <p className="text-sm">
                To confirm, please type the backup filename: <span className="font-semibold">{selectedBackup?.filename}</span>
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type backup filename here"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedBackup && restoreBackup(selectedBackup)}
                disabled={loading.restore || confirmText !== selectedBackup?.filename}
              >
                {loading.restore ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Restore Backup
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Backup Dialog */}
        <Dialog open={openDialog === "delete"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Backup
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this backup? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <p className="text-sm">
                To confirm, please type the backup filename: <span className="font-semibold">{selectedBackup?.filename}</span>
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type backup filename here"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedBackup && deleteBackup(selectedBackup)}
                disabled={loading.delete || confirmText !== selectedBackup?.filename}
              >
                {loading.delete ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Backup
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}