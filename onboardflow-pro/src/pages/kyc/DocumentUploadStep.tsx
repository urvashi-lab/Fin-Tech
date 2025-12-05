import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Upload, FileText, CheckCircle2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getKYCData, updateDocuments } from "@/lib/kyc-storage";
import {
  validateAadhar,
  validatePAN,
  validateFileType,
  validateFileSize,
  formatAadhar,
  formatPAN,
} from "@/lib/validation";
import axios from "axios";


interface DocumentUploadStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface FileData {
  file: File | null;
  preview: string | null;
}

export default function DocumentUploadStep({ onNext, onBack }: DocumentUploadStepProps) {
  // Load existing data from localStorage
  const existingData = getKYCData().documents;

  // File state for uploaded documents
  const [aadharFront, setAadharFront] = useState<FileData>({
    file: null,
    preview: existingData?.aadharFront || null,
  });
  const [aadharBack, setAadharBack] = useState<FileData>({
    file: null,
    preview: existingData?.aadharBack || null,
  });
  const [panFront, setPanFront] = useState<FileData>({
    file: null,
    preview: existingData?.panFront || null,
  });

  // Form field state
  const [aadharNumber, setAadharNumber] = useState(existingData?.aadharNumber || "");
  const [panNumber, setPanNumber] = useState(existingData?.panNumber || "");
  const [issueDate, setIssueDate] = useState(existingData?.issueDate || "");

  // Loading state
  const [isUploading, setIsUploading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    aadharNumber: "",
    panNumber: "",
    issueDate: "",
  });

  /**
   * Handle file upload with validation
   */
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileData>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (jpg, png, pdf)
    const typeError = validateFileType(file);
    if (typeError) {
      toast.error(typeError);
      return;
    }

    // Validate file size (max 5MB)
    const sizeError = validateFileSize(file);
    if (sizeError) {
      toast.error(sizeError);
      return;
    }

    // Read file and create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setter({ file, preview: reader.result as string });
      toast.success("File selected successfully!");
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remove uploaded file
   */
  const removeFile = (setter: React.Dispatch<React.SetStateAction<FileData>>) => {
    setter({ file: null, preview: null });
  };

  /**
   * Handle Aadhar number input with formatting and validation
   */
  const handleAadharChange = (value: string) => {
    const formatted = formatAadhar(value);
    setAadharNumber(formatted);
    const error = validateAadhar(formatted);
    setErrors((prev) => ({ ...prev, aadharNumber: error || "" }));
  };

  /**
   * Handle PAN number input with formatting and validation
   */
  const handlePANChange = (value: string) => {
    const formatted = formatPAN(value);
    setPanNumber(formatted);
    const error = validatePAN(formatted);
    setErrors((prev) => ({ ...prev, panNumber: error || "" }));
  };

  /**
   * Check if all required fields are valid
   */
  const isFormValid = () => {
    return (
      (aadharFront.file || aadharFront.preview) &&
      (aadharBack.file || aadharBack.preview) &&
      (panFront.file || panFront.preview) &&
      validateAadhar(aadharNumber) === null &&
      validatePAN(panNumber) === null &&
      issueDate &&
      new Date(issueDate) <= new Date()
    );
  };

  /**
   * Handle form submission and file upload
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!isFormValid()) {
      toast.error("Please complete all required fields");
      return;
    }

    // Check if we need to upload new files
    const needsUpload = aadharFront.file || aadharBack.file || panFront.file;

    // If no new files, just update text fields locally
    if (!needsUpload) {
      updateDocuments({
        aadharFront: aadharFront.preview!,
        aadharBack: aadharBack.preview!,
        panFront: panFront.preview!,
        aadharNumber,
        panNumber,
        issueDate,
      });
      toast.success("Documents updated successfully!");
      onNext();
      return;
    }

    // Start upload process
    setIsUploading(true);

    try {
      // ========================================
      // CRITICAL FIX: Get authentication token
      // ========================================
      // Your backend requires authentication via JWT token
      // Check where your app stores the token and update the key name if needed
      const token = localStorage.getItem('auth_token');

      // Verify token exists
      if (!token) {
        toast.error("Authentication required. Please login again.");
        setIsUploading(false);
        // Optional: Redirect to login page
        // window.location.href = '/login';
        return;
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Append files only if new files are selected
      if (aadharFront.file) {
        formData.append("aadharFront", aadharFront.file);
      }
      if (aadharBack.file) {
        formData.append("aadharBack", aadharBack.file);
      }
      if (panFront.file) {
        formData.append("panFront", panFront.file);
      }

      // Append text fields
      formData.append("aadharNumber", aadharNumber);
      formData.append("panNumber", panNumber);
      formData.append("issueDate", issueDate);

      // ========================================
      // Make authenticated request to backend
      // ========================================
      const response = await axios.post(
        "http://localhost:5000/api/document/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            // THIS IS THE FIX: Authorization header with Bearer token
            "Authorization": `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload Progress: ${percentCompleted}%`);
            }
          },
        }
      );

      // Save Cloudinary URLs returned from backend to localStorage
      const { document } = response.data;
      updateDocuments({
        aadharFront: document.aadharFront,
        aadharBack: document.aadharBack,
        panFront: document.panFront,
        aadharNumber: document.aadharNumber,
        panNumber: document.panNumber,
        issueDate: document.issueDate,
      });

      toast.success("Documents uploaded successfully!");
      onNext();

    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Handle specific error cases
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Unauthorized - token is invalid or expired
        toast.error("Session expired. Please login again.");
        // Optional: Redirect to login
        // window.location.href = '/login';
      } else if (error.response?.status === 404) {
        // Not Found - endpoint doesn't exist
        toast.error("Upload service not found. Please contact support.");
        console.error("Backend route not found. Check if server is running and route is correct.");
      } else if (error.code === 'ERR_NETWORK') {
        // Network error - can't reach backend
        toast.error("Cannot connect to server. Please check your connection.");
        console.error("Backend server not reachable at http://localhost:5000");
      } else {
        // Generic error
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error ||
                            "Failed to upload documents. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Reusable file upload card component
   */
  const FileUploadCard = ({
    label,
    fileData,
    setter,
    id,
  }: {
    label: string;
    fileData: FileData;
    setter: React.Dispatch<React.SetStateAction<FileData>>;
    id: string;
  }) => (
    <Card className="p-4">
      <Label htmlFor={id} className="text-sm font-medium mb-2 block">
        {label} <span className="text-destructive">*</span>
      </Label>
      {fileData.preview ? (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
            {fileData.preview.includes("pdf") ? (
              <div className="flex items-center justify-center h-full">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
            ) : (
              <img src={fileData.preview} alt={label} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span>{fileData.file ? "Ready to upload" : "Uploaded"}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFile(setter)}
              className="text-destructive hover:text-destructive"
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload</span>
          <span className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF (max 5MB)</span>
        </label>
      )}
      <Input
        id={id}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => handleFileUpload(e, setter)}
        disabled={isUploading}
      />
    </Card>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <FileUploadCard
          label="Aadhar Card - Front"
          fileData={aadharFront}
          setter={setAadharFront}
          id="aadhar-front"
        />
        <FileUploadCard
          label="Aadhar Card - Back"
          fileData={aadharBack}
          setter={setAadharBack}
          id="aadhar-back"
        />
        <FileUploadCard 
          label="PAN Card" 
          fileData={panFront} 
          setter={setPanFront} 
          id="pan-front" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="aadharNumber">
            Aadhar Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="aadharNumber"
            value={aadharNumber}
            onChange={(e) => handleAadharChange(e.target.value)}
            placeholder="XXXX XXXX XXXX"
            className={errors.aadharNumber ? "border-destructive" : ""}
            disabled={isUploading}
          />
          {errors.aadharNumber && (
            <p className="text-sm text-destructive">{errors.aadharNumber}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="panNumber">
            PAN Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="panNumber"
            value={panNumber}
            onChange={(e) => handlePANChange(e.target.value)}
            placeholder="ABCDE1234F"
            className={errors.panNumber ? "border-destructive" : ""}
            disabled={isUploading}
          />
          {errors.panNumber && <p className="text-sm text-destructive">{errors.panNumber}</p>}
        </div>

        <div className="space-y-2">
          <Label>
            Document Issue Date <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !issueDate && "text-muted-foreground"
                )}
                disabled={isUploading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {issueDate ? format(new Date(issueDate), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={issueDate ? new Date(issueDate) : undefined}
                onSelect={(date) => setIssueDate(date ? format(date, "yyyy-MM-dd") : "")}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isUploading}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={!isFormValid() || isUploading}
          className="bg-gradient-hero hover:opacity-90 transition-opacity"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Continue to Review"
          )}
        </Button>
      </div>
    </form>
  );
}