import { useEffect, useRef, useState, useCallback } from "react"
import { pickRandomTasks } from "./Activelivenesstasks"
import type { ActiveTask } from "./Activelivenesstasks"

import { useActiveLivenessDetector } from "./useActiveLivenessDetector"

import type { ActiveLivenessResponse, TaskUIState } from "./Activelivenessutils"
import type { ActiveTaskScoreResponse } from "./useActiveLivenessDetector"


interface ActiveLivenessCheckProps {
  vkycId:     string
  stream:     MediaStream
  onComplete: (result: ActiveLivenessResponse) => void
  onError:    (reason: string) => void
}
 
const TASKS_PER_SESSION   = 2
const INSTRUCTION_HOLD_MS = 2500
const COUNTDOWN_FROM      = 3
const TASK_RESULT_HOLD_MS = 1800
 
export default function ActiveLivenessCheck({
  vkycId,
  stream,
  onComplete,
  onError
}: ActiveLivenessCheckProps) {
 
  // ── Session state ──────────────────────────────────────────────────────
  const [tasks]         = useState<ActiveTask[]>(() => pickRandomTasks(TASKS_PER_SESSION))
  const [taskIndex,      setTaskIndex]      = useState(0)
  const [uiState,        setUiState]        = useState<TaskUIState>("FACE_CHECK")
  const [countdown,      setCountdown]      = useState(COUNTDOWN_FROM)
  const [taskResults,    setTaskResults]    = useState<ActiveTaskScoreResponse[]>([])
  const [lastTaskPassed, setLastTaskPassed] = useState<boolean | null>(null)
  const [faceStable,     setFaceStable]     = useState(false)
 
  // ── Refs ───────────────────────────────────────────────────────────────
  const videoRef             = useRef<HTMLVideoElement>(null)
  const countdownTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateTimerRef        = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasFinishedRef       = useRef(false)
 
  const currentTask = tasks[taskIndex]
 
  // ── Hook ───────────────────────────────────────────────────────────────
  const {
    status:   detectorStatus,
    error:    detectorError,
    result:   detectorResult,
    initialize,
    startRecording,
    resetForNextTask,
    cleanup
  } = useActiveLivenessDetector(vkycId)
 
  // ── Attach stream + initialize MediaPipe on mount ──────────────────────
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
    initialize()
 
    return () => {
      cleanup()
      clearAllTimers()
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])
 
  const clearAllTimers = () => {
    if (countdownTimerRef.current)    clearInterval(countdownTimerRef.current)
    if (stateTimerRef.current)        clearTimeout(stateTimerRef.current)
    if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current)
  }
 
  // ── When model finishes loading → begin face check ─────────────────────
  useEffect(() => {
    if (detectorStatus === "ready" && uiState === "FACE_CHECK") {
      beginFaceCheck()
    }
  }, [detectorStatus])
 
  // ── When task result comes back → handle it ────────────────────────────
  useEffect(() => {
    if (detectorStatus === "done" && detectorResult) {
      handleTaskResult(detectorResult)
    }
  }, [detectorStatus, detectorResult])
 
  // ── Move to UPLOADING when hook is processing ──────────────────────────
  useEffect(() => {
    if (detectorStatus === "processing") {
      setUiState("UPLOADING")
    }
  }, [detectorStatus])
 
  // ── Surface hook errors ────────────────────────────────────────────────
  useEffect(() => {
    if (detectorStatus === "error" && detectorError) {
      onError(detectorError)
    }
  }, [detectorStatus, detectorError])
 
  // ── FACE_CHECK ─────────────────────────────────────────────────────────
  const beginFaceCheck = () => {
    setFaceStable(false)
    setUiState("FACE_CHECK")
 
    faceCheckIntervalRef.current = setInterval(() => {
      const video = videoRef.current
      if (video && video.readyState >= 3 && video.videoWidth > 0 && !video.paused) {
        clearInterval(faceCheckIntervalRef.current!)
        setFaceStable(true)
        stateTimerRef.current = setTimeout(() => {
          setUiState("INSTRUCTION")
        }, 600)
      }
    }, 200)
  }
 
  // ── INSTRUCTION → COUNTDOWN ────────────────────────────────────────────
  useEffect(() => {
    if (uiState !== "INSTRUCTION") return
    stateTimerRef.current = setTimeout(() => {
      setCountdown(COUNTDOWN_FROM)
      setUiState("COUNTDOWN")
    }, INSTRUCTION_HOLD_MS)
    return () => { if (stateTimerRef.current) clearTimeout(stateTimerRef.current) }
  }, [uiState])
 
  // ── COUNTDOWN → RECORDING ─────────────────────────────────────────────
  useEffect(() => {
    if (uiState !== "COUNTDOWN") return
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!)
          triggerRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current) }
  }, [uiState])
 
  // ── Start MediaPipe rAF loop ───────────────────────────────────────────
  const triggerRecording = () => {
    if (!videoRef.current) {
      onError("Video element not ready")
      return
    }
    setUiState("RECORDING")
    // Hook runs rAF, extracts landmarks per frame, sends to FastAPI when done
    startRecording(videoRef.current, currentTask.id, currentTask.durationMs)
  }
 
  // ── Handle result from backend ─────────────────────────────────────────
  const handleTaskResult = (taskResult: ActiveTaskScoreResponse) => {
    const updatedResults = [...taskResults, taskResult]
    setTaskResults(updatedResults)
    setLastTaskPassed(taskResult.passed)
    setUiState("TASK_RESULT")
 
    stateTimerRef.current = setTimeout(() => {
      if (taskIndex + 1 < tasks.length) {
          resetForNextTask()
          setTimeout(() => {
              setTaskIndex(prev => prev + 1)
              beginFaceCheck()
          }, 300)  // small gap to let reset settle
      }else {
        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true
 
          // Weighted average across all tasks
          const avgScore    = updatedResults.reduce((sum, r) => sum + r.score, 0) / updatedResults.length
          const overallPass = avgScore >= 0.60
 
          onComplete({
            overallPassed: overallPass,
            averageScore: avgScore,
            taskResults: updatedResults.map(r => ({
              taskId: r.task_id,
              score:  r.score,
              passed: r.passed
            }))
          })
        }
      }
    }, TASK_RESULT_HOLD_MS)
  }
 
  // ── Derived UI ─────────────────────────────────────────────────────────
  const isModelLoading = detectorStatus === "idle" || detectorStatus === "loading"
 
  type OverlayContent = { title: string; sub?: string; accent?: string }
 
  const overlayContent = (): OverlayContent | null => {
    if (isModelLoading) {
      return { title: "Preparing session...", sub: "Loading liveness model" }
    }
    switch (uiState) {
      case "FACE_CHECK":
        return {
          title: faceStable ? "Face detected ✓" : "Position your face in the frame",
          sub:   "Look straight at the camera"
        }
      case "INSTRUCTION":
        return { title: currentTask.instruction, sub: currentTask.hint, accent: "instruction" }
      case "COUNTDOWN":
        return { title: `${countdown}`, sub: "Get ready...", accent: "countdown" }
      case "RECORDING":
        return { title: currentTask.instruction, sub: "Recording...", accent: "recording" }
      case "UPLOADING":
        return { title: "Analysing...", sub: "Just a moment" }
      case "TASK_RESULT":
        return lastTaskPassed
          ? { title: "✓ Done",             sub: taskIndex + 1 < tasks.length ? "Preparing next task..." : "All done!",        accent: "pass" }
          : { title: "✗ Could not verify", sub: taskIndex + 1 < tasks.length ? "Moving to next task..."  : "Session complete", accent: "fail" }
      default:
        return null
    }
  }
 
  const overlayBg = (accent?: string): string => {
    switch (accent) {
      case "pass":        return "rgba(22,101,52,0.92)"
      case "fail":        return "rgba(127,29,29,0.92)"
      case "recording":   return "rgba(30,58,138,0.92)"
      case "countdown":   return "rgba(120,53,15,0.92)"
      case "instruction": return "rgba(15,23,42,0.92)"
      default:            return "rgba(15,23,42,0.88)"
    }
  }
 
  const overlay = overlayContent()
 
  const ovalBorderColor =
    uiState === "RECORDING"                      ? "rgba(59,130,246,0.8)"  :
    uiState === "TASK_RESULT" && lastTaskPassed  ? "rgba(34,197,94,0.8)"   :
    uiState === "TASK_RESULT" && !lastTaskPassed ? "rgba(239,68,68,0.5)"   :
    "rgba(255,255,255,0.3)"
 
  return (
    <div style={styles.container}>
 
      {/* Progress */}
      <div style={styles.progressBar}>
        <span style={styles.progressText}>
          Active Check — Task {taskIndex + 1} of {tasks.length}
        </span>
        <div style={styles.progressDots}>
          {tasks.map((_, i) => (
            <div key={i} style={{
              ...styles.dot,
              backgroundColor:
                i < taskIndex     ? "#22c55e"
                : i === taskIndex ? "#3b82f6"
                : "rgba(255,255,255,0.2)"
            }} />
          ))}
        </div>
      </div>
 
      {/* Video */}
      <div style={styles.videoWrapper}>
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          style={{...styles.video, transform: "scaleX(-1)"}} 
        />
 
        {/* Face oval */}
        <div style={{ ...styles.faceOval, borderColor: ovalBorderColor }} />
 
        {/* Bottom overlay bar */}
        {overlay && (
          <div style={{ ...styles.overlayBar, backgroundColor: overlayBg(overlay.accent) }}>
            <p style={{
              ...styles.overlayTitle,
              fontSize:      overlay.accent === "countdown" ? "52px" : "20px",
              letterSpacing: overlay.accent === "countdown" ? "-1px" : "0"
            }}>
              {overlay.title}
            </p>
            {overlay.sub && <p style={styles.overlaySub}>{overlay.sub}</p>}
          </div>
        )}
 
        {/* REC indicator */}
        {uiState === "RECORDING" && (
          <div style={styles.recDot}>
            <div style={styles.recPulse} />
            <span style={styles.recLabel}>REC</span>
          </div>
        )}
 
        {/* Model loading overlay */}
        {isModelLoading && (
          <div style={styles.fullOverlay}>
            <div style={styles.spinnerRing} />
            <p style={styles.spinnerText}>Preparing session...</p>
          </div>
        )}
      </div>
 
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
 
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh",
    backgroundColor: "#111827", padding: "24px", gap: "16px"
  },
  progressBar: {
    display: "flex", alignItems: "center", gap: "16px",
    width: "90vw", maxWidth: "1280px"
  },
  progressText: { color: "rgba(255,255,255,0.6)", fontSize: "13px", fontFamily: "monospace" },
  progressDots: { display: "flex", gap: "8px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", transition: "background-color 0.3s" },
  videoWrapper: {
    position: "relative", width: "90vw", maxWidth: "1280px",
    aspectRatio: "16 / 9", borderRadius: "12px", overflow: "hidden",
    backgroundColor: "#000", boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
  },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  faceOval: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -55%)", width: "22%", aspectRatio: "3 / 4",
    border: "2px solid rgba(255,255,255,0.3)", borderRadius: "50%",
    pointerEvents: "none", transition: "border-color 0.4s"
  },
  overlayBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "20px 28px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "4px", animation: "fadeIn 0.25s ease"
  },
  overlayTitle: { color: "#fff", margin: 0, fontWeight: 700, textAlign: "center", lineHeight: 1.2 },
  overlaySub:   { color: "rgba(255,255,255,0.65)", fontSize: "14px", margin: 0, textAlign: "center" },
  recDot:       { position: "absolute", top: "16px", right: "16px", display: "flex", alignItems: "center", gap: "6px" },
  recPulse:     { width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444", animation: "pulse 1s ease-in-out infinite" },
  recLabel:     { color: "#ef4444", fontSize: "12px", fontWeight: 700, fontFamily: "monospace" },
  fullOverlay:  {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.80)", gap: "16px"
  },
  spinnerRing: {
    width: "40px", height: "40px",
    border: "3px solid rgba(255,255,255,0.2)", borderTop: "3px solid #fff",
    borderRadius: "50%", animation: "spin 0.8s linear infinite"
  },
  spinnerText: { color: "rgba(255,255,255,0.8)", fontSize: "15px", margin: 0, fontWeight: 500 }
}
 