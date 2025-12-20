import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { 
  getKYCDataFromAPI, 
  updateVerificationStatus, 
  verifyAadhar, 
  verifyPAN,
  type KYCData 
} from "@/lib/kyc-storage";

interface ReviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: "bg-gray-100 text-gray-800 border-gray-300",
    "under-review": "bg-yellow-100 text-yellow-800 border-yellow-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
      {status.replace("-", " ").toUpperCase()}
    </span>
  );
};

export default function ReviewStep({ onNext, onBack }: ReviewStepProps) {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "under-review" | "approved" | "rejected">("pending");
  const [verifying, setVerifying] = useState(false);
  
  const verificationStartedRef = useRef(false);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Fetch KYC data on component mount
  useEffect(() => {
    console.log("🚀 Component mounted, fetching KYC data...");
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("📡 Calling getKYCDataFromAPI...");
        const data = await getKYCDataFromAPI();
        console.log("📦 Received KYC data:", data);
        
        if (!data.personalInfo) {
          console.log("❌ No personal info found");
          setError("Personal information not found. Please complete the Personal Information step first.");
          setLoading(false);
          return;
        }
        
        if (!data.documents) {
          console.log("❌ No documents found");
          setError("Documents not found. Please complete the Document Upload step first.");
          setLoading(false);
          return;
        }
        
        console.log("✅ KYC data loaded successfully");
        console.log("📄 Documents:", data.documents);
        console.log("🔐 Current verification status:", data.verification.status);
        
        setKycData(data);
        setStatus(data.verification.status);
        
      } catch (err) {
        console.error("❌ Error fetching KYC data:", err);
        setError("Failed to load KYC data. Please try again.");
      } finally {
        setLoading(false);
        console.log("✅ Loading complete");
      }
    };

    fetchData();
  }, []);

  // Trigger verification when component loads with documents
  useEffect(() => {
    console.log("🔄 Verification check effect running...");
    console.log("  - kycData exists:", !!kycData);
    console.log("  - documents exist:", !!kycData?.documents);
    console.log("  - status:", status);
    console.log("  - verificationStartedRef:", verificationStartedRef.current);
    console.log("  - verifying:", verifying);
    
    // Run verification if pending OR stuck in under-review
    if (kycData && kycData.documents && (status === "pending" || status === "under-review") && !verificationStartedRef.current) {
      console.log("✅ All conditions met, calling handleVerifyDocuments...");
      handleVerifyDocuments();
    } else {
      console.log("⏸️ Verification conditions not met");
    }
  }, [kycData, status]);

  const handleVerifyDocuments = async () => {
    console.log("🎬 handleVerifyDocuments called");
    console.log("  - verifying:", verifying);
    console.log("  - kycData?.documents:", !!kycData?.documents);
    console.log("  - verificationStartedRef:", verificationStartedRef.current);
    
    if (verifying || !kycData?.documents || verificationStartedRef.current) {
      console.log("⏹️ Verification blocked - already running or no data");
      return;
    }
    
    verificationStartedRef.current = true;
    setVerifying(true);
    setStatus("under-review");
    
    console.log("🔄 Status set to under-review");

    try {
      console.log("🔍 Starting document verification...");
      console.log("📋 Aadhar Number:", kycData.documents.aadharNumber);
      console.log("📋 PAN Number:", kycData.documents.panNumber);

      // Call Aadhar verification API
      console.log("📞 Calling verifyAadhar...");
      const aadharResult = await verifyAadhar(kycData.documents.aadharNumber);
      console.log("✅ Aadhar verification result:", aadharResult);

      // Call PAN verification API
      console.log("📞 Calling verifyPAN...");
      const panResult = await verifyPAN(kycData.documents.panNumber);
      console.log("✅ PAN verification result:", panResult);

      // Check if both verifications succeeded
      console.log("🔍 Checking results...");
      console.log("  - Aadhar success:", aadharResult.success);
      console.log("  - PAN success:", panResult.success);
      
      if (aadharResult.success && panResult.success) {
        console.log("✅ Both verifications passed!");
        
        updateVerificationStatus("approved", "Documents verified successfully");
        
        setStatus("approved");
        setKycData(prev => prev ? {
          ...prev,
          verification: {
            status: "approved",
            remarks: "Documents verified successfully",
            reviewedAt: new Date().toISOString()
          }
        } : null);
        
        toast.success("KYC Approved! Documents verified successfully.");
        
        setTimeout(() => {
          console.log("🎯 Auto-proceeding to next step...");
          onNextRef.current();
        }, 2000);
      } else {
        console.log("❌ Verification failed!");
        
        const failureMessage = !aadharResult.success 
          ? `Aadhar verification failed: ${aadharResult.message}`
          : `PAN verification failed: ${panResult.message}`;
        
        console.log("💬 Failure message:", failureMessage);
        
        updateVerificationStatus("rejected", failureMessage);
        
        setStatus("rejected");
        setKycData(prev => prev ? {
          ...prev,
          verification: {
            status: "rejected",
            remarks: failureMessage,
            reviewedAt: new Date().toISOString()
          }
        } : null);
        
        toast.error("KYC Rejected: " + failureMessage);
      }
    } catch (err) {
      console.error("❌ Verification error:", err);
      
      const errorMessage = err instanceof Error ? err.message : "Verification failed due to technical error";
      updateVerificationStatus("rejected", errorMessage);
      
      setStatus("rejected");
      setKycData(prev => prev ? {
        ...prev,
        verification: {
          status: "rejected",
          remarks: errorMessage,
          reviewedAt: new Date().toISOString()
        }
      } : null);
      
      toast.error("Verification Failed: " + errorMessage);
    } finally {
      setVerifying(false);
      console.log("🏁 Verification process complete");
    }
  };

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
    console.log("🔄 Rendering loading state");
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading your KYC information...</p>
      </div>
    );
  }

  // Error state
  if (error || !kycData) {
    console.log("❌ Rendering error state");
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

  console.log("🎨 Rendering main UI, status:", status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Review & Verification</h2>
        <StatusBadge status={status} />
      </div>

      {status === "under-review" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
              <div>
                <p className="text-sm font-medium">
                  Verifying your documents...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Checking Aadhar and PAN details with government database. This usually takes a few moments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "approved" && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {kycData.verification.remarks || "Documents verified successfully!"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Proceeding to Video KYC automatically...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "rejected" && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {kycData.verification.remarks || "Verification failed"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please check your documents and try uploading again.
                </p>
              </div>
            </div>
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
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity"
        >
          Continue to Video KYC
        </Button>
      </div>
    </div>
  );
}