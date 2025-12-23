import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Video, VideoOff, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendFrameForVerification, VerificationType } from "@/lib/kyc-storage";

interface VideoKYCRoomProps {
  onComplete: () => void;
  onLeave: () => void;
  userId: string;
  authToken: string;
}

type Phase = "FACE" | "AADHAAR_FRONT" | "AADHAAR_BACK" | "PAN" | "COMPLETED";

export default function VideoKYCRoom({ onComplete, onLeave, userId, authToken }: VideoKYCRoomProps): JSX.Element {
  // Camera states
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  
  // Verification states
  const [currentPhase, setCurrentPhase] = useState<Phase>("FACE");
  const [countdown, setCountdown] = useState<number>(10);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [backendMessage, setBackendMessage] = useState<string>("");
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Camera management
  const startCamera = async (): Promise<void> => {
    try {
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraError(null);
      setIsVideoOn(true);
      setIsCameraReady(true);
      toast.success('Camera connected successfully');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please grant permission.');
      toast.error('Camera access denied');
      setIsCameraReady(false);
    }
  };

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  const toggleVideo = (): void => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  // Frame capture
  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Get verification type from phase
  const getVerificationType = (phase: Phase): VerificationType | null => {
    switch (phase) {
      case "FACE": return "face";
      case "AADHAAR_FRONT": return "aadhaar-front";
      case "AADHAAR_BACK": return "aadhaar-back";
      case "PAN": return "pan";
      default: return null;
    }
  };

  // Get instruction for current phase
  const getInstruction = (phase: Phase): string => {
    switch (phase) {
      case "FACE": return "Position your face in the center";
      case "AADHAAR_FRONT": return "Hold your Aadhaar Card (front side) up to camera";
      case "AADHAAR_BACK": return "Hold your Aadhaar Card (back side) up to camera";
      case "PAN": return "Hold your PAN Card up to camera";
      case "COMPLETED": return "All verifications complete! ✅";
    }
  };

  // Handle verification response
  const handleVerification = async (): Promise<void> => {
    setIsCapturing(true);
    
    const frameData = captureFrame();
    if (!frameData) {
      toast.error('Failed to capture frame');
      setIsCapturing(false);
      return;
    }

    const verificationType = getVerificationType(currentPhase);
    if (!verificationType) {
      setIsCapturing(false);
      return;
    }

    try {
      console.log(`📸 Capturing ${currentPhase}, attempt ${attemptCount + 1}/5`);
      const result = await sendFrameForVerification(frameData, verificationType, userId);
      
      if (result.success) {
        // Success - move to next phase
        toast.success(result.message);
        setBackendMessage(result.message);
        setAttemptCount(0);
        
        // Move to next phase
        if (currentPhase === "FACE") {
          setCurrentPhase("AADHAAR_FRONT");
          setCountdown(10);
        } else if (currentPhase === "AADHAAR_FRONT") {
          setCurrentPhase("AADHAAR_BACK");
          setCountdown(10);
        } else if (currentPhase === "AADHAAR_BACK") {
          setCurrentPhase("PAN");
          setCountdown(10);
        } else if (currentPhase === "PAN") {
          setCurrentPhase("COMPLETED");
          toast.success('All verifications completed!');
        }
      } else {
        // Failed - retry or show error
        setBackendMessage(result.message);
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        if (newAttemptCount >= 5) {
          toast.error(`Max attempts reached for ${currentPhase}`);
          setBackendMessage(`⚠️ Max attempts reached. ${result.message}`);
        } else {
          toast.warning(`${result.message} (Attempt ${newAttemptCount}/5)`);
          setCountdown(10); // Restart countdown for retry
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
      setBackendMessage('⚠️ Connection error');
    } finally {
      setIsCapturing(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (!isCameraReady || currentPhase === "COMPLETED" || cameraError || attemptCount >= 5) {
      return;
    }

    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      // Countdown reached 0 - capture frame
      handleVerification();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown, isCameraReady, currentPhase, cameraError, attemptCount]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      stopCamera();
    };
  }, []);

  const handleLeaveRoom = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    stopCamera();
    onLeave();
  };

  const handleCompleteKYC = (): void => {
    if (currentPhase !== "COMPLETED") {
      toast.error('Please complete all verification steps');
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    stopCamera();
    onComplete();
  };

  // Display countdown (only show last 3 seconds to user)
  const displayCountdown = countdown <= 3 && countdown > 0 ? countdown : null;
  const showCapturing = isCapturing || countdown === 0;

  return (
    <div style={styles.roomContainer}>
      <div style={styles.videoWrapper}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={styles.video}
        />
        
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div style={styles.overlayArea}>
          {!isCameraReady && !cameraError && (
            <div style={styles.connectingBox}>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span style={{ marginLeft: '8px' }}>Starting camera...</span>
            </div>
          )}

          {cameraError && (
            <div style={styles.errorBox}>
              {cameraError}
            </div>
          )}
          
          {!cameraError && isCameraReady && currentPhase !== "COMPLETED" && (
            <div style={styles.instructionBox}>
              <p style={styles.instructionText}>
                📸 {getInstruction(currentPhase)}
              </p>
              {displayCountdown && (
                <p style={styles.countdownText}>
                  Capturing in {displayCountdown}...
                </p>
              )}
              {showCapturing && (
                <p style={styles.capturingText}>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </p>
              )}
              {backendMessage && !showCapturing && (
                <p style={styles.backendMessageText}>
                  {backendMessage}
                </p>
              )}
              <p style={styles.attemptText}>
                Phase: {currentPhase} | Attempt: {attemptCount}/5
              </p>
            </div>
          )}

          {currentPhase === "COMPLETED" && (
            <div style={styles.successBox}>
              <CheckCircle className="inline h-5 w-5 mr-2" />
              All verifications completed successfully!
            </div>
          )}
        </div>

        <div style={styles.controls}>
          <Button
            variant="outline"
            size="lg"
            onClick={toggleVideo}
            className="bg-white/90 hover:bg-white"
            disabled={!isCameraReady || !!cameraError}
          >
            {isVideoOn ? (
              <>
                <Video className="mr-2 h-5 w-5" />
                Video On
              </>
            ) : (
              <>
                <VideoOff className="mr-2 h-5 w-5" />
                Video Off
              </>
            )}
          </Button>

          <Button
            variant="default"
            size="lg"
            onClick={handleCompleteKYC}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={currentPhase !== "COMPLETED"}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Complete KYC
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleLeaveRoom}
          >
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  roomContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#111827',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  videoWrapper: {
    position: 'relative',
    width: '90vw',
    maxWidth: '1280px',
    height: 'auto',
    aspectRatio: '16 / 9',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlayArea: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    pointerEvents: 'none',
  },
  connectingBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(8px)',
  },
  instructionBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    backdropFilter: 'blur(8px)',
  },
  successBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: '14px',
    fontWeight: '500',
    margin: 0,
    marginBottom: '4px',
  },
  countdownText: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '8px 0',
    color: '#fbbf24',
  },
  capturingText: {
    fontSize: '14px',
    fontWeight: '500',
    margin: '4px 0',
    display: 'flex',
    alignItems: 'center',
  },
  backendMessageText: {
    fontSize: '12px',
    margin: '4px 0',
    opacity: 0.9,
  },
  attemptText: {
    fontSize: '11px',
    opacity: 0.7,
    margin: '4px 0 0 0',
    fontFamily: 'monospace',
  },
  controls: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
};