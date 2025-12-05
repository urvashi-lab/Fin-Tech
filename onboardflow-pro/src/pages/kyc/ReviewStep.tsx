import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { getKYCData, getKYCDataFromAPI, updateVerificationStatus } from "@/lib/kyc-storage";
import { toast } from "sonner";
import type { KYCData } from "@/lib/kyc-storage";

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ReviewStep({ onNext, onBack }: ReviewStepProps) {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "under-review" | "approved" | "rejected">("pending");
  
  const simulationStartedRef = useRef(false);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Fetch KYC data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getKYCDataFromAPI();
        
        // Validate that we have the required data
        if (!data.personalInfo) {
          setError("Personal information not found. Please complete the Personal Information step first.");
          return;
        }
        
        if (!data.documents) {
          setError("Documents not found. Please complete the Document Upload step first.");
          return;
        }
        
        setKycData(data);
        setStatus(data.verification.status);
        
      } catch (err) {
        console.error("Error fetching KYC data:", err);
        setError("Failed to load KYC data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Verification simulation logic
  useEffect(() => {
    if (status === "under-review" && !simulationStartedRef.current && kycData) {
      console.log("🎯 Starting verification simulation...");
      simulationStartedRef.current = true;

      const delay = 5000 + Math.random() * 3000;
      console.log("🎯 Simulation will complete in:", Math.round(delay / 1000), "seconds");

      const timer = setTimeout(() => {
        console.log("🎯 Timer completed!");
        const approved = Math.random() > 0.3;
        const newStatus = approved ? "approved" : "rejected";
        const remarks = approved
          ? "All documents verified successfully. Your KYC is approved."
          : "Document verification failed. Please ensure all documents are clear and valid.";

        updateVerificationStatus(newStatus, remarks);
        setStatus(newStatus);

        if (approved) {
          console.log("✅ KYC APPROVED - calling onNext in 100ms");
          toast.success("KYC Approved!");
          setTimeout(() => {
            console.log("✅ NOW calling onNextRef.current()");
            onNextRef.current();
          }, 100);
        } else {
          console.log("❌ KYC REJECTED");
          toast.error("KYC Rejected");
        }
      }, delay);

      return () => {
        console.log("🧹 Cleanup: clearing verification timer");
        clearTimeout(timer);
      };
    }
  }, [status, kycData]);

  const handleContinue = () => {
    if (status === "approved") {
      console.log("🔵 Manual continue clicked");
      onNext();
    } else {
      toast.error("Please wait for approval before proceeding");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading your KYC information...</p>
      </div>
    );
  }

  // Error state
  if (error || !kycData) {
    return (
      <div className="space-y-6">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm text-destructive font-medium">
                  {error || "Unable to load KYC data"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please ensure you've completed all previous steps before proceeding to review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Go Back
          </Button>
          <Button
            variant="default"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const personalInfo = kycData.personalInfo!;
  const documents = kycData.documents!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Review & Verification</h2>
        <StatusBadge status={status} />
      </div>

      {status === "under-review" && (
        <Card className="bg-warning/10 border-warning/20">
          <CardContent className="pt-6">
            <p className="text-sm">
              Your documents are being reviewed. This usually takes a few moments...
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="text-sm text-muted-foreground">Processing verification...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "approved" && (
        <Card className="bg-success/10 border-success/20">
          <CardContent className="pt-6">
            <p className="text-sm text-success font-medium">
              {kycData.verification.remarks}
            </p>
          </CardContent>
        </Card>
      )}

      {status === "rejected" && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive font-medium">
              {kycData.verification.remarks}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{personalInfo.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(personalInfo.dob)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{personalInfo.gender || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{personalInfo.mobile}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{personalInfo.email}</p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Address</p>
            <p className="font-medium">{personalInfo.address}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Aadhar Number</p>
              <p className="font-medium font-mono">{documents.aadharNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PAN Number</p>
              <p className="font-medium font-mono">{documents.panNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{formatDate(documents.issueDate)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-3">Uploaded Documents</p>
            <div className="grid grid-cols-3 gap-4">
              {documents.aadharFront && (
                <div className="space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                    {documents.aadharFront.includes("pdf") ? (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={documents.aadharFront}
                        alt="Aadhar Front"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Aadhar Front</p>
                </div>
              )}
              {documents.aadharBack && (
                <div className="space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                    {documents.aadharBack.includes("pdf") ? (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={documents.aadharBack}
                        alt="Aadhar Back"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Aadhar Back</p>
                </div>
              )}
              {documents.panFront && (
                <div className="space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                    {documents.panFront.includes("pdf") ? (
                      <div className="flex items-center justify-center h-full">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={documents.panFront}
                        alt="PAN Card"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">PAN Card</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          size="lg"
          disabled={status !== "approved"}
          onClick={handleContinue}
          className="bg-gradient-hero hover:opacity-90 transition-opacity"
        >
          Continue to Video KYC
        </Button>
      </div>
    </div>
  );
}