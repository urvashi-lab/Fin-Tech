import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Video, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getKYCData, updateVideoKYC } from "@/lib/kyc-storage";
import VideoKYCRoom from "@/pages/kyc/VideoKYCRoom";

interface VideoKYCStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function VideoKYCStep({ onNext, onBack }: VideoKYCStepProps) {
  const kycData = getKYCData();
  const videoKYC = kycData.videoKYC;

  const [inVideoRoom, setInVideoRoom] = useState(false);
  const isCompleted = videoKYC.status === "completed";

  // ✅ Get userId and token from localStorage
  const getUserId = (): string => {
    try {
      const userDataString = localStorage.getItem('kyc_user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        return userData.id || '';
      }
    } catch (error) {
      console.error('Error parsing kyc_user:', error);
    }
    return '';
  };
  
  const getAuthToken = (): string => {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('auth_token') || '';
    console.log('Token exists:', !!token);
    return token;
  };

  // ✅ Handle starting Video KYC session
  const handleStartVideoKYC = () => {
    const userId = getUserId();
    const authToken = getAuthToken();

    // Validate before opening room
    if (!userId) {
      toast.error('User ID not found. Please login again.');
      return;
    }

    if (!authToken) {
      toast.error('Authentication token not found. Please login again.');
      return;
    }

    updateVideoKYC({
      status: "in-progress",
    });
    setInVideoRoom(true);
  };

  // ✅ Handle completing Video KYC and moving to next step
  const handleCompleteVideoKYC = () => {
    updateVideoKYC({
      status: "completed",
    });
    setInVideoRoom(false);
    toast.success("Video KYC Completed!", {
      description: "Moving to Bank Approval step..."
    });
    setTimeout(() => {
      onNext();
    }, 1000);
  };

  // ✅ Handle leaving video room without completing
  const handleLeaveRoom = () => {
    setInVideoRoom(false);
    updateVideoKYC({
      status: "pending",
    });
    toast.info("Video KYC session ended");
  };

  // ✅ Show Video Room if in session
  if (inVideoRoom) {
    const userId = getUserId();
    const authToken = getAuthToken();

    // Double-check before rendering
    if (!userId || !authToken) {
      toast.error('Missing credentials. Returning to setup.');
      setInVideoRoom(false);
      return null;
    }

    return (
      <VideoKYCRoom 
        onComplete={handleCompleteVideoKYC}
        onLeave={handleLeaveRoom}
        userId={userId}           // ✅ Pass the MongoDB user ID
        authToken={authToken}     // ✅ Pass the JWT token
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Video KYC Verification</h2>
        {isCompleted && <StatusBadge status={videoKYC.status} />}
      </div>

      {isCompleted ? (
        <Card className="bg-gradient-card border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Video KYC Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your video KYC verification has been successfully completed. 
                You can now proceed to the next step.
              </p>
            </div>

            <Button 
              onClick={onNext}
              className="w-full bg-gradient-hero hover:opacity-90"
            >
              Continue to Bank Approval
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Start Video Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Before you begin:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Ensure you have a stable internet connection</li>
                <li>Keep your original documents ready</li>
                <li>Be in a well-lit area</li>
                <li>Allow camera access when prompted</li>
              </ul>
            </div>

            <Button
              size="lg"
              onClick={handleStartVideoKYC}
              className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
            >
              <Video className="mr-2 h-5 w-5" />
              Start Video KYC
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-start pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}