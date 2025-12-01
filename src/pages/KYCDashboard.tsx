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
import { useAuth } from "@/hooks/useAuth";

import PersonalInfoStep from "./kyc/PersonalInfoStep";
import DocumentUploadStep from "./kyc/DocumentUploadStep";
import ReviewStep from "./kyc/ReviewStep";
import VideoKYCStep from "./kyc/VideoKYCStep";
import BankApprovalStep from "./kyc/BankApprovalStep";

export default function KYCDashboard() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Get both user AND authLoading from useAuth
  const { user, isLoading: authLoading } = useAuth();
  
  const [kycData, setKYCData] = useState(() => {
    try {
      return getKYCData();
    } catch (err) {
      console.error("Error loading KYC data:", err);
      return null;
    }
  });
  
  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      return getKYCData().currentStep || 1;
    } catch (err) {
      return 1;
    }
  });

  // ✅ Wait for auth to load before checking user
  useEffect(() => {
    // Don't do anything while auth is still loading
    if (authLoading) {
      console.log("⏳ Auth still loading...");
      return;
    }

    try {
      console.log("👤 User data:", user);
      
      // Now check if user exists (auth has finished loading)
      if (!user) {
        console.log("❌ No user found, redirecting to login");
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      // Load KYC data
      const data = getKYCData();
      console.log("📋 KYC Data loaded:", data);
      
      setKYCData(data);
      setCurrentStep(data.currentStep || 1);
    } catch (err) {
      console.error("❌ Error in dashboard initialization:", err);
      setError("Failed to load dashboard data");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    console.log("📌 currentStep changed:", currentStep);
  }, [currentStep]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const refreshData = () => {
    try {
      const data = getKYCData();
      setKYCData(data);
      setCurrentStep(data.currentStep || 1);
    } catch (err) {
      console.error("Error refreshing data:", err);
      toast.error("Failed to refresh data");
    }
  };

  // ✅ Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-primary/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Show error state
  if (error || !kycData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-primary/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-destructive mb-4">{error || "Failed to load dashboard"}</p>
            <Button onClick={() => navigate("/login")}>Return to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <CardDescription>Complete your verification in 5 simple steps</CardDescription>
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

            <KYCStepper
              currentStep={currentStep}
              completedSteps={kycData.completedSteps}
            />
          </CardContent>
        </Card>

        <div className="bg-card rounded-lg shadow-lg p-6">
          {currentStep === 1 && (
            <PersonalInfoStep 
              onNext={() => {
                refreshData();
                setCurrentStep(2);
              }} 
            />
          )}

          {currentStep === 2 && (
            <DocumentUploadStep
              onNext={() => {
                refreshData();
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              onNext={() => {
                console.log("🟢 ReviewStep onNext called in parent");
                refreshData();
                setCurrentStep(4);
              }}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <VideoKYCStep 
              onNext={() => {
                console.log("🟢 VideoKYC completed, moving to Bank Approval");
                refreshData();
                setCurrentStep(5);
              }}
              onBack={() => setCurrentStep(3)} 
            />
          )}

          {currentStep === 5 && (
            <BankApprovalStep
              onNext={() => {
                refreshData();
                toast.success("KYC Process Complete!", {
                  description: "Your account is now fully verified."
                });
                // Redirect to success page or dashboard
                navigate("/dashboard");
              }}
              onBack={() => setCurrentStep(4)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
