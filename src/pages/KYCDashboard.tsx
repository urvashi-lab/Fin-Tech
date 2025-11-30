import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { KYCStepper } from "@/components/KYCStepper";
import { StatusBadge } from "@/components/StatusBadge";
import { logout } from "@/lib/auth";
import { getKYCData, getCompletionPercentage } from "@/lib/kyc-storage";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import PersonalInfoStep from "./kyc/PersonalInfoStep";
import DocumentUploadStep from "./kyc/DocumentUploadStep";
import ReviewStep from "./kyc/ReviewStep";
import VideoKYCStep from "./kyc/VideoKYCStep";

export default function KYCDashboard() {
  const navigate = useNavigate();
  const [kycData, setKYCData] = useState(getKYCData());
  const [currentStep, setCurrentStep] = useState(kycData.currentStep);

  useEffect(() => {
    const data = getKYCData();
    setKYCData(data);
    setCurrentStep(data.currentStep);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleStepChange = (step: number) => {
    // Only allow navigation to completed steps or current step
    if (step <= currentStep || kycData.completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    } else {
      toast.error("Please complete the previous step first");
    }
  };

  const refreshData = () => {
    const data = getKYCData();
    setKYCData(data);
    setCurrentStep(data.currentStep);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">KYC Portal</span>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">KYC Verification</CardTitle>
                <CardDescription>Complete your verification in 4 simple steps</CardDescription>
              </div>
              <StatusBadge status={kycData.verification.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
            <KYCStepper currentStep={currentStep} completedSteps={kycData.completedSteps} />
          </CardContent>
        </Card>

        <div className="bg-card rounded-lg shadow-lg p-6">
          {currentStep === 1 && <PersonalInfoStep onNext={refreshData} />}
          {currentStep === 2 && <DocumentUploadStep onNext={refreshData} onBack={() => setCurrentStep(1)} />}
          {currentStep === 3 && <ReviewStep onNext={refreshData} onBack={() => setCurrentStep(2)} />}
          {currentStep === 4 && <VideoKYCStep onBack={() => setCurrentStep(3)} />}
        </div>
      </div>
    </div>
  );
}
