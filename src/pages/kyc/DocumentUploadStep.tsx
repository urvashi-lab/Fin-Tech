import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Upload, FileText, CheckCircle2, X } from "lucide-react";
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

interface DocumentUploadStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface FileData {
  file: File | null;
  preview: string | null;
}

export default function DocumentUploadStep({ onNext, onBack }: DocumentUploadStepProps) {
  const existingData = getKYCData().documents;

  const [aadharFront, setAadharFront] = useState<FileData>({
    file: null,
    preview: existingData?.aadharFront || null,
  });
  const [aadharBack, setAadharBack] = useState<FileData>({
    file: null,
    preview: existingData?.aadharBack || null,
  });
  const [panCard, setPanCard] = useState<FileData>({
    file: null,
    preview: existingData?.panCard || null,
  });

  const [aadharNumber, setAadharNumber] = useState(existingData?.aadharNumber || "");
  const [panNumber, setPanNumber] = useState(existingData?.panNumber || "");
  const [issueDate, setIssueDate] = useState(existingData?.issueDate || "");

  const [errors, setErrors] = useState({
    aadharNumber: "",
    panNumber: "",
    issueDate: "",
  });

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileData>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const typeError = validateFileType(file);
    if (typeError) {
      toast.error(typeError);
      return;
    }

    const sizeError = validateFileSize(file);
    if (sizeError) {
      toast.error(sizeError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter({ file, preview: reader.result as string });
      toast.success("File uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (setter: React.Dispatch<React.SetStateAction<FileData>>) => {
    setter({ file: null, preview: null });
  };

  const handleAadharChange = (value: string) => {
    const formatted = formatAadhar(value);
    setAadharNumber(formatted);
    const error = validateAadhar(formatted);
    setErrors((prev) => ({ ...prev, aadharNumber: error || "" }));
  };

  const handlePANChange = (value: string) => {
    const formatted = formatPAN(value);
    setPanNumber(formatted);
    const error = validatePAN(formatted);
    setErrors((prev) => ({ ...prev, panNumber: error || "" }));
  };

  const isFormValid = () => {
    return (
      (aadharFront.preview || aadharFront.file) &&
      (aadharBack.preview || aadharBack.file) &&
      (panCard.preview || panCard.file) &&
      validateAadhar(aadharNumber) === null &&
      validatePAN(panNumber) === null &&
      issueDate &&
      new Date(issueDate) <= new Date()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Please complete all required fields");
      return;
    }

    updateDocuments({
      aadharFront: aadharFront.preview,
      aadharBack: aadharBack.preview,
      panCard: panCard.preview,
      aadharNumber,
      panNumber,
      issueDate,
    });

    toast.success("Documents uploaded successfully!");
    onNext();
  };

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
              <span>Uploaded</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFile(setter)}
              className="text-destructive hover:text-destructive"
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
        <FileUploadCard label="PAN Card" fileData={panCard} setter={setPanCard} id="pan-card" />
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
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={!isFormValid()}
          className="bg-gradient-hero hover:opacity-90 transition-opacity"
        >
          Continue to Review
        </Button>
      </div>
    </form>
  );
}
