// import { useEffect, useRef } from "react"
// import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
// import { useLivenessDetector } from "./useLivenessDetector"
// import type { PassiveLivenessResponse } from "./livenessUtils"

// interface PassiveLivenessCheckProps {
//   vkycId: string
//   onComplete: (result: PassiveLivenessResponse) => void
//   onError: (reason: string) => void
// }

// export default function PassiveLivenessCheck({
//   vkycId,
//   onComplete,
//   onError
// }: PassiveLivenessCheckProps) {

//   const videoRef      = useRef<HTMLVideoElement>(null)
//   const streamRef     = useRef<MediaStream | null>(null)
//   const hasStartedRef = useRef<boolean>(false)  // prevent double auto-start

//   const {
//     status,
//     progress,
//     error,
//     result,
//     initialize,
//     startRecording,
//     cleanup
//   } = useLivenessDetector(vkycId)

//   // ── Step 1: Load MediaPipe on mount ──────────────────────────────────────
//   useEffect(() => {
//     initialize()
//     return () => {
//       cleanup()
//       streamRef.current?.getTracks().forEach(t => t.stop())
//     }
//   }, [])

//   // ── Step 2: Start camera once model is ready ─────────────────────────────
//   useEffect(() => {
//     if (status !== "ready") return

//     const startCamera = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: {
//             width:      { ideal: 1280 },
//             height:     { ideal: 720 },
//             facingMode: "user"
//           },
//           audio: false
//         })
//         streamRef.current = stream

//         if (videoRef.current) {
//           videoRef.current.srcObject = stream

//           // ── Auto-start recording only when video is truly delivering frames
//           videoRef.current.oncanplay = () => {
//             if (
//               videoRef.current &&
//               !hasStartedRef.current &&
//               videoRef.current.readyState >= 3  // HAVE_FUTURE_DATA or better
//             ) {
//               hasStartedRef.current = true
//               console.log(
//                 "Video ready — readyState:",
//                 videoRef.current.readyState,
//                 "dimensions:",
//                 videoRef.current.videoWidth,
//                 "x",
//                 videoRef.current.videoHeight
//               )
//               startRecording(videoRef.current)
//             }
//           }

//           await videoRef.current.play()
//         }
//       } catch (e) {
//         onError("Camera access denied. Please allow camera permissions.")
//       }
//     }

//     startCamera()
//   }, [status])

//   // ── Step 3: Fire onComplete when result arrives ──────────────────────────
//   useEffect(() => {
//     if (status === "done" && result) {
//       onComplete(result)
//     }
//   }, [status, result])

//   // ── Step 4: Fire onError if hook reports error ───────────────────────────
//   useEffect(() => {
//     if (status === "error" && error) {
//       onError(error)
//     }
//   }, [status, error])

//   return (
//     <div style={styles.container}>

//       <div style={styles.videoWrapper}>
//         <video
//           ref={videoRef}
//           muted
//           playsInline
//           style={styles.video}
//         />

//         {/* Progress overlay during recording */}
//         {status === "recording" && (
//           <div style={styles.progressOverlay}>
//             <p style={styles.instructionText}>
//               Look naturally at the camera
//             </p>
//             <div style={styles.progressBarTrack}>
//               <div
//                 style={{
//                   ...styles.progressBarFill,
//                   width: `${progress}%`
//                 }}
//               />
//             </div>
//             <p style={styles.progressText}>
//               {Math.round(progress)}% — {Math.round((progress / 100) * 15)}s / 15s
//             </p>
//           </div>
//         )}

//         {/* Overlay when loading or camera starting */}
//         {(status === "loading" || status === "ready") && (
//           <div style={styles.loadingOverlay}>
//             <Loader2
//               className="animate-spin"
//               style={{ width: 40, height: 40, color: "#fff" }}
//             />
//             <p style={styles.loadingText}>
//               {status === "loading"
//                 ? "Setting up liveness check..."
//                 : "Starting camera..."}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Status area below video */}
//       <div style={styles.statusArea}>

//         {status === "processing" && (
//           <div style={styles.statusRow}>
//             <Loader2 className="animate-spin h-5 w-5 mr-2" />
//             <span>Analyzing your session...</span>
//           </div>
//         )}

//         {status === "done" && result && (
//           <div style={styles.resultBox}>
//             <CheckCircle className="h-5 w-5 mr-2" />
//             <span>
//               Liveness check complete — Score: {result.passive_score.toFixed(2)}
//             </span>
//           </div>
//         )}

//         {status === "error" && (
//           <div style={styles.errorBox}>
//             <AlertCircle className="h-5 w-5 mr-2" />
//             <span>{error}</span>
//           </div>
//         )}

//       </div>
//     </div>
//   )
// }

// const styles: { [key: string]: React.CSSProperties } = {
//   container: {
//     display:         "flex",
//     flexDirection:   "column",
//     alignItems:      "center",
//     gap:             "16px",
//     padding:         "24px",
//     backgroundColor: "#111827",
//     minHeight:       "100vh",
//     justifyContent:  "center"
//   },
//   videoWrapper: {
//     position:        "relative",
//     width:           "90vw",
//     maxWidth:        "1280px",
//     aspectRatio:     "16 / 9",
//     borderRadius:    "12px",
//     overflow:        "hidden",
//     backgroundColor: "#000",
//     boxShadow:       "0 20px 60px rgba(0,0,0,0.5)"
//   },
//   video: {
//     width:      "100%",
//     height:     "100%",
//     objectFit:  "cover",
//     display:    "block",
//     borderRadius: "12px"
//   },
//   loadingOverlay: {
//     position:        "absolute",
//     inset:           0,
//     display:         "flex",
//     flexDirection:   "column",
//     alignItems:      "center",
//     justifyContent:  "center",
//     backgroundColor: "rgba(0,0,0,0.7)",
//     gap:             "16px"
//   },
//   loadingText: {
//     color:      "#fff",
//     fontSize:   "16px",
//     fontWeight: 500,
//     margin:     0
//   },
//   progressOverlay: {
//     position:        "absolute",
//     bottom:          "0",
//     left:            "0",
//     right:           "0",
//     backgroundColor: "rgba(0,0,0,0.6)",
//     padding:         "12px 16px",
//     backdropFilter:  "blur(4px)"
//   },
//   instructionText: {
//     color:      "#fff",
//     fontSize:   "14px",
//     fontWeight: 500,
//     margin:     "0 0 8px 0",
//     textAlign:  "center"
//   },
//   progressBarTrack: {
//     width:           "100%",
//     height:          "6px",
//     backgroundColor: "rgba(255,255,255,0.2)",
//     borderRadius:    "3px",
//     overflow:        "hidden"
//   },
//   progressBarFill: {
//     height:          "100%",
//     backgroundColor: "#3b82f6",
//     borderRadius:    "3px",
//     transition:      "width 0.1s linear"
//   },
//   progressText: {
//     color:     "rgba(255,255,255,0.7)",
//     fontSize:  "12px",
//     margin:    "6px 0 0 0",
//     textAlign: "center"
//   },
//   statusArea: {
//     display:       "flex",
//     flexDirection: "column",
//     alignItems:    "center",
//     gap:           "12px",
//     width:         "100%",
//     maxWidth:      "1280px"
//   },
//   statusRow: {
//     display:    "flex",
//     alignItems: "center",
//     color:      "#fff",
//     fontSize:   "14px"
//   },
//   resultBox: {
//     display:         "flex",
//     alignItems:      "center",
//     backgroundColor: "rgba(34,197,94,0.15)",
//     border:          "1px solid rgba(34,197,94,0.4)",
//     color:           "#4ade80",
//     padding:         "12px 16px",
//     borderRadius:    "8px",
//     fontSize:        "14px",
//     width:           "100%"
//   },
//   errorBox: {
//     display:         "flex",
//     alignItems:      "center",
//     backgroundColor: "rgba(239,68,68,0.15)",
//     border:          "1px solid rgba(239,68,68,0.4)",
//     color:           "#f87171",
//     padding:         "12px 16px",
//     borderRadius:    "8px",
//     fontSize:        "14px",
//     width:           "100%"
//   }
// }



import { useEffect, useRef, useState } from "react"
import { useLivenessDetector } from "./useLivenessDetector"
import type { PassiveLivenessResponse } from "./livenessUtils"

interface PassiveLivenessCheckProps {
  vkycId: string
  onComplete: (result: PassiveLivenessResponse) => void
  onError: (reason: string) => void
}

// Messages flashed to user during the silent recording window
const ONBOARDING_MESSAGES = [
  { at: 0,    text: "Welcome to your Video KYC session 👋" },
  { at: 3500, text: "We'll verify your identity in a few simple steps" },
  { at: 7000, text: "Keep your face visible and look naturally at the camera" },
  { at: 12000, text: "Great, you're doing well! Almost there..." },
]

export default function PassiveLivenessCheck({
  vkycId,
  onComplete,
  onError
}: PassiveLivenessCheckProps) {

  const videoRef        = useRef<HTMLVideoElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const hasStartedRef   = useRef<boolean>(false)
  const messageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [currentMessage, setCurrentMessage] = useState<string>(
    ONBOARDING_MESSAGES[0].text
  )
  const [faceDetected, setFaceDetected] = useState<boolean>(false)

  const {
    status,
    result,
    error,
    initialize,
    startRecording,
    cleanup
  } = useLivenessDetector(vkycId)

  // ── Step 1: Load MediaPipe on mount ──────────────────────────────────────
  useEffect(() => {
    initialize()
    return () => {
      cleanup()
      streamRef.current?.getTracks().forEach(t => t.stop())
      messageTimersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  // ── Step 2: Start camera once model is ready ─────────────────────────────
  useEffect(() => {
    if (status !== "ready") return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width:      { ideal: 1280 },
            height:     { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream

          videoRef.current.oncanplay = () => {
            if (
              videoRef.current &&
              !hasStartedRef.current &&
              videoRef.current.readyState >= 3
            ) {
              hasStartedRef.current = true
              scheduleMessages()
              startRecording(videoRef.current)
            }
          }

          await videoRef.current.play()
        }
      } catch (e) {
        onError("Camera access denied. Please allow camera permissions.")
      }
    }

    startCamera()
  }, [status])

  // ── Step 3: Schedule onboarding messages ─────────────────────────────────
  const scheduleMessages = () => {
    messageTimersRef.current.forEach(t => clearTimeout(t))
    messageTimersRef.current = []

    ONBOARDING_MESSAGES.forEach(({ at, text }) => {
      const timer = setTimeout(() => {
        setCurrentMessage(text)
      }, at)
      messageTimersRef.current.push(timer)
    })
  }

  // ── Step 4: Fire onComplete when result arrives ──────────────────────────
  useEffect(() => {
    if (status === "done" && result) {
      onComplete(result)
    }
  }, [status, result])

  // ── Step 5: Fire onError if hook reports error ───────────────────────────
  useEffect(() => {
    if (status === "error" && error) {
      onError(error)
    }
  }, [status, error])

  // ── Derived UI state ──────────────────────────────────────────────────────
  const isInitializing = status === "loading" || status === "idle"
  const isCameraReady  = status === "ready"
  const isRecording    = status === "recording"
  const isProcessing   = status === "processing"

  return (
    <div style={styles.container}>

      {/* Video feed — always rendered so camera initializes immediately */}
      <div style={styles.videoWrapper}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={styles.video}
        />

        {/* Face outline guide — shown during recording */}
        {isRecording && (
          <div style={styles.faceOutline} />
        )}

        {/* Initializing overlay */}
        {(isInitializing || isCameraReady) && (
          <div style={styles.overlay}>
            <div style={styles.spinnerRing} />
            <p style={styles.overlayText}>
              {isInitializing
                ? "Preparing your session..."
                : "Starting camera..."}
            </p>
          </div>
        )}

        {/* Processing overlay — seamless, no alarming text */}
        {isProcessing && (
          <div style={styles.overlay}>
            <p style={styles.overlayText}>
              Just a moment...
            </p>
          </div>
        )}

        {/* Message flash — shown during recording */}
        {isRecording && (
          <div style={styles.messageBar}>
            <p style={styles.messageText}>
              {currentMessage}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    justifyContent:  "center",
    minHeight:       "100vh",
    backgroundColor: "#111827",
    padding:         "24px"
  },
  videoWrapper: {
    position:        "relative",
    width:           "90vw",
    maxWidth:        "1280px",
    aspectRatio:     "16 / 9",
    borderRadius:    "12px",
    overflow:        "hidden",
    backgroundColor: "#000",
    boxShadow:       "0 20px 60px rgba(0,0,0,0.5)"
  },
  video: {
    width:        "100%",
    height:       "100%",
    objectFit:    "cover",
    display:      "block",
    borderRadius: "12px"
  },

  // // Subtle oval face guide — visual anchor, not a test indicator
  // faceOutline: {
  //   position:     "absolute",
  //   top:          "50%",
  //   left:         "50%",
  //   transform:    "translate(-50%, -58%)",
  //   width:        "22%",
  //   aspectRatio:  "3 / 4",
  //   border:       "2px solid rgba(255,255,255,0.35)",
  //   borderRadius: "50%",
  //   pointerEvents: "none"
  // },

  // Dark overlay for init/processing states
  overlay: {
    position:        "absolute",
    inset:           0,
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    justifyContent:  "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    gap:             "16px"
  },
  overlayText: {
    color:      "#fff",
    fontSize:   "16px",
    fontWeight: 500,
    margin:     0
  },

  // Spinner ring — pure CSS, no library dependency
  spinnerRing: {
    width:        "40px",
    height:       "40px",
    border:       "3px solid rgba(255,255,255,0.2)",
    borderTop:    "3px solid #fff",
    borderRadius: "50%",
    animation:    "spin 0.8s linear infinite"
  },

  // Message bar at bottom of video
  messageBar: {
    position:        "absolute",
    bottom:          0,
    left:            0,
    right:           0,
    padding:         "20px 24px",
    background:      "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center"
  },
  messageText: {
    color:      "#fff",
    fontSize:   "18px",
    fontWeight: 500,
    margin:     0,
    textAlign:  "center",
    textShadow: "0 1px 4px rgba(0,0,0,0.6)"
  }
}