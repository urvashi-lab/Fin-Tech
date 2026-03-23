import { useRef, useState, useCallback } from "react"
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import {
  extractEyeLandmarks,
  extractHeadPoseMatrix,
  extractBlendshapes,
  downsampleFrames
} from "./livenessUtils"
import type {
  FrameSample,
  PassiveLivenessPayload,
  PassiveLivenessResponse
} from "./livenessUtils"

const DURATION_MS = 15000
const SAMPLE_FPS  = 10
const CAPTURE_FPS = 30

export type LivenessStatus =
  | "idle"
  | "loading"
  | "ready"
  | "recording"
  | "processing"
  | "done"
  | "error"

export interface UseLivenessDetectorReturn {
  status: LivenessStatus
  progress: number
  error: string | null
  result: PassiveLivenessResponse | null
  initialize: () => Promise<void>
  startRecording: (videoElement: HTMLVideoElement) => void
  cleanup: () => void
}

export function useLivenessDetector(
  userId: string
): UseLivenessDetectorReturn {

  const [status,   setStatus]   = useState<LivenessStatus>("idle")
  const [progress, setProgress] = useState<number>(0)
  const [error,    setError]    = useState<string | null>(null)
  const [result,   setResult]   = useState<PassiveLivenessResponse | null>(null)

  const landmarkerRef    = useRef<FaceLandmarker | null>(null)
  const framesRef        = useRef<FrameSample[]>([])
  const totalFramesRef   = useRef<number>(0)
  const startTimeRef     = useRef<number>(0)
  const rafRef           = useRef<number>(0)
  const videoElementRef  = useRef<HTMLVideoElement | null>(null)
  const isFinishedRef    = useRef<boolean>(false)  // ← guard against double calls
  const isRecordingRef   = useRef<boolean>(false)  // ← guard against premature finish

  // ── 1. Load MediaPipe model ──────────────────────────────────────────────
  const initialize = useCallback(async (): Promise<void> => {
    setStatus("loading")
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )
      landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode:                        "VIDEO",
        numFaces:                           1,
        outputFaceBlendshapes:              true,
        outputFacialTransformationMatrixes: true
      })
      setStatus("ready")
    } catch (e) {
      setError("Failed to load liveness model. Please refresh.")
      setStatus("error")
    }
  }, [])

  // ── 2. Finish recording + send to FastAPI ────────────────────────────────
  const finishRecording = useCallback(async (): Promise<void> => {
    // Guard: only run once, and only if recording actually started
    if (isFinishedRef.current || !isRecordingRef.current) return
    isFinishedRef.current  = true
    isRecordingRef.current = false

    cancelAnimationFrame(rafRef.current)
    setStatus("processing")

    const sampledFrames = downsampleFrames(
      framesRef.current,
      SAMPLE_FPS,
      CAPTURE_FPS
    )

    const payload: PassiveLivenessPayload = {
      vkyc_id:               userId,
      duration_ms:           DURATION_MS,
      sample_rate_fps:       SAMPLE_FPS,
      total_frames_analyzed: totalFramesRef.current,
      frames:                sampledFrames
    }

    const apiUrl = import.meta.env.VITE_FASTAPI_URL
    console.log("Submitting to:", `${apiUrl}/vkyc/liveness/passive`)
    console.log("Frame count being sent:", sampledFrames.length)

    try {
      const res = await fetch(
        `${apiUrl}/vkyc/liveness/passive`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload)
        }
      )

      if (!res.ok) {
        const detail = await res.json()
        throw new Error(`Server error: ${res.status} — ${JSON.stringify(detail)}`)
      }

      const data: PassiveLivenessResponse = await res.json()

      const backendUrl = import.meta.env.VITE_BACKEND_URL
      try {
        await fetch(`${backendUrl}/api/vkyc/liveness/passive`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
          },
          body: JSON.stringify({
            passive_score: data.passive_score,
            signal_scores: data.signal_scores,
            flags:         data.flags,
            status:        data.status
          })
        })
      } catch (storageErr) {
        // Don't block the flow if storage fails
        // Score is still available for the session
        console.error("Score storage failed:", storageErr)
      }

      setResult(data)
      setStatus("done")
    } catch (e) {
      console.error("Fetch error:", e)
      setError("Failed to submit liveness check. Please retry.")
      setStatus("error")
    }
  }, [userId])

  // ── 3. Frame processing loop ─────────────────────────────────────────────
  const processFrame = useCallback((): void => {
    const video      = videoElementRef.current
    const landmarker = landmarkerRef.current

    // Safety: stop if not recording or refs gone
    if (!video || !landmarker || !isRecordingRef.current) return

    const now     = performance.now()
    const elapsed = now - startTimeRef.current

    setProgress(Math.min((elapsed / DURATION_MS) * 100, 100))

    // Stop after 15 seconds
    if (elapsed >= DURATION_MS) {
      finishRecording()
      return
    }

    const detection = landmarker.detectForVideo(video, now)
    totalFramesRef.current++

    if (
      detection.faceLandmarks?.length > 0 &&
      detection.faceBlendshapes?.length > 0 &&
      detection.facialTransformationMatrixes?.length > 0
    ) {
      const frame: FrameSample = {
        timestamp_ms:     Math.round(elapsed),
        eye_landmarks:    extractEyeLandmarks(detection.faceLandmarks[0]),
        blendshapes:      extractBlendshapes(detection.faceBlendshapes),
        head_pose_matrix: extractHeadPoseMatrix(
          detection.facialTransformationMatrixes[0]
        )
      }
      framesRef.current.push(frame)
    }

    rafRef.current = requestAnimationFrame(processFrame)
  }, [finishRecording])

  // ── 4. Start recording ───────────────────────────────────────────────────
  const startRecording = useCallback((
    videoElement: HTMLVideoElement
  ): void => {
    // Reset all state for fresh session
    framesRef.current       = []
    totalFramesRef.current  = 0
    isFinishedRef.current   = false
    isRecordingRef.current  = true      // ← mark as actively recording
    videoElementRef.current = videoElement
    startTimeRef.current    = performance.now()

    setStatus("recording")
    setProgress(0)
    rafRef.current = requestAnimationFrame(processFrame)
  }, [processFrame])

  // ── 5. Cleanup ───────────────────────────────────────────────────────────
  const cleanup = useCallback((): void => {
    isRecordingRef.current = false
    cancelAnimationFrame(rafRef.current)
    landmarkerRef.current?.close()
  }, [])

  return {
    status,
    progress,
    error,
    result,
    initialize,
    startRecording,
    cleanup
  }
}