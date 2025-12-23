import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Home, FileText, Shield, Calendar, User } from "lucide-react";
import { getKYCDataFromAPI, KYCData } from "@/lib/kyc-storage";
import confetti from "canvas-confetti";

export default function KYCCompletionStep() {
  const navigate = useNavigate();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await getKYCDataFromAPI();
      setKycData(data);
    };
    loadData();
  }, []);

  // Confetti animation on mount
  useEffect(() => {
    if (!showConfetti) {
      setShowConfetti(true);
      
      // Confetti burst
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showConfetti]);

  const handleDownloadCertificate = () => {
    const applicationId = kycData?.bankApproval?.applicationId || `KYC-${Date.now().toString().slice(-8)}`;
    // TODO: Implement actual PDF download
    alert(`Download certificate for Application ID: ${applicationId}`);
  };

  const handleGoHome = () => {
    navigate("/kyc-dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-3xl w-full space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-16 w-16 text-success" />
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎉 KYC Verification Complete!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your account has been successfully verified and activated
            </p>
          </div>
        </div>

        {/* Main Success Card */}
        <Card className="shadow-2xl border-success/20 bg-gradient-to-br from-white to-green-50/30">
          <CardContent className="pt-8 pb-8 space-y-6">
            {/* Application Details */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/80 border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applicant Name</p>
                  <p className="font-semibold">{kycData?.personalInfo?.fullName || "Loading..."}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/80 border">
                <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application ID</p>
                  <p className="font-mono font-semibold text-sm">
                    {kycData?.bankApproval?.applicationId || `KYC-${Date.now().toString().slice(-8)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/80 border">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-success">Verified & Active</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-white/80 border">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved On</p>
                  <p className="font-semibold text-sm">
                    {kycData?.bankApproval?.timestamp 
                      ? new Date(kycData.bankApproval.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : new Date().toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border border-success/20">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                      Your account is now fully activated and ready to use
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                      You can access all premium features without restrictions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                      Download your verification certificate for your records
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-success" />
                      Start exploring your dashboard and available services
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                size="lg"
                onClick={handleDownloadCertificate}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Download className="h-5 w-5" />
                Download Certificate
              </Button>
              <Button
                size="lg"
                onClick={handleGoHome}
                className="flex-1 gap-2 bg-gradient-hero hover:opacity-90"
              >
                <Home className="h-5 w-5" />
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-muted/50 border-none">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Your Information is Secure</p>
                <p className="text-xs">
                  All your personal information and documents are encrypted and stored securely. 
                  We comply with all data protection regulations and industry standards.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? Contact our support team at <span className="font-medium text-primary">support@kycportal.com</span></p>
        </div>
      </div>
    </div>
  );
}