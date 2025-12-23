import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Clock, Building2, Shield, FileCheck, Loader2 } from "lucide-react";
import { getKYCDataFromAPI, updateBankApprovalStatus, KYCData } from "@/lib/kyc-storage";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BankApprovalStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function BankApprovalStep({ onNext, onBack }: BankApprovalStepProps) {
  const navigate = useNavigate();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [progress, setProgress] = useState(0);
  const simulationStartedRef = useRef(false);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Load KYC data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getKYCDataFromAPI();
        setKycData(data);
        setStatus(data.bankApproval?.status || "pending");
      } catch (error) {
        console.error("Error loading KYC data:", error);
        toast.error("Failed to load KYC data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (status === "pending") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + Math.random() * 5;
        });
      }, 500);

      return () => clearInterval(interval);
    } else if (status === "approved") {
      setProgress(100);
    }
  }, [status]);

  // Bank approval simulation (HARDCODED TO APPROVE)
  useEffect(() => {
    if (status === "pending" && !simulationStartedRef.current && kycData) {
      console.log("🏦 Starting bank approval simulation (HARDCODED)...");
      simulationStartedRef.current = true;

      const delay = 8000; // Fixed 8 seconds
      console.log("🏦 Bank approval will complete in:", Math.round(delay / 1000), "seconds");

      const timer = setTimeout(() => {
        console.log("🏦 Bank approval timer completed!");
        
        // HARDCODED: Always approve
        const newStatus = "approved";
        const remarks = "Your application has been approved by the bank. Welcome aboard!";

        updateBankApprovalStatus(newStatus, remarks);
        setStatus(newStatus);

        console.log("✅ BANK APPROVED - Application complete!");
        toast.success("Bank Approval Successful!", {
          description: "Your KYC process is now complete.",
        });
        
        
      }, delay);

      return () => {
        console.log("🧹 Cleanup: clearing bank approval timer");
        clearTimeout(timer);
      };
    }
  }, [status, kycData]);

 const handleContinue = () => {
  if (status === "approved") {
    console.log("🔵 Completing KYC - redirecting to success page");
    navigate("/kyc-success");
  } else {
    toast.error("Please wait for bank approval");
  }
};

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Bank Approval</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading KYC data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if previous steps are completed
  if (!kycData?.personalInfo) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Bank Approval</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Please complete previous steps first.
            </p>
          </CardContent>
        </Card>
        <Button onClick={onBack}>Back</Button>
      </div>
    );
  }

  const personalInfo = kycData.personalInfo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Bank Approval</h2>
            <p className="text-sm text-muted-foreground">Final verification step</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Status Cards */}
      {status === "pending" && (
        <Card className="bg-warning/10 border-warning/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-warning animate-pulse" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Awaiting Bank Approval</h3>
                  <p className="text-sm text-muted-foreground">
                    Your application is being reviewed by our banking partner. This process typically takes a few moments.
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Verification Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-warning transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Processing Steps */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-muted-foreground">Document verification completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-muted-foreground">Video KYC completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                    <span className="font-medium">Bank approval in progress...</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "approved" && (
        <Card className="bg-success/10 border-success/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1 text-success">Approved Successfully!</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {kycData.bankApproval?.remarks || "Your application has been approved by the bank."}
                </p>
                <div className="flex items-center gap-2 text-sm text-success/80">
                  <Shield className="h-4 w-4" />
                  <span>Your account is now fully verified and active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "rejected" && (
        <Card className="bg-destructive/10 border-destructive/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1 text-destructive">Additional Review Required</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {kycData.bankApproval?.remarks || "Your application requires additional verification."}
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Applicant Name</p>
              <p className="font-medium">{personalInfo.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{personalInfo.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{personalInfo.mobile}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Application ID</p>
              <p className="font-medium font-mono">
                {kycData.bankApproval?.applicationId || `KYC-${Date.now().toString().slice(-8)}`}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Verification Checklist</p>
            <div className="space-y-2">
              {[
                "Personal Information Verified",
                "Identity Documents Verified", 
                "Video KYC Completed",
                status === "approved" ? "Bank Approval Received" : "Bank Approval Pending"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`h-4 w-4 ${index === 3 && status !== "approved" ? "text-muted-foreground" : "text-success"}`} />
                  <span className={index === 3 && status !== "approved" ? "text-muted-foreground" : ""}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Security & Privacy</p>
              <p className="text-xs">
                Your information is encrypted and securely transmitted to our banking partner. 
                We follow industry-standard security protocols to protect your data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={status === "pending"}>
          Back
        </Button>
        <Button
          size="lg"
          disabled={status !== "approved"}
          onClick={handleContinue}
          className="bg-gradient-hero hover:opacity-90 transition-opacity"
        >
          {status === "approved" ? "Complete KYC" : "Awaiting Approval..."}
        </Button>
      </div>
    </div>
  );
}