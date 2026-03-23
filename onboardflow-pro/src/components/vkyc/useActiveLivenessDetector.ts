import { useRef, useState, useCallback } from "react"
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import type { ActiveTaskId } from "./Activelivenessutils"

// ── Landmark indices ─────────────────────────────────────────────────────────
// Lip corners
const LIP_LEFT_IDX        = 61
const LIP_RIGHT_IDX       = 291
// Eye centers (average of inner + outer corner per eye)
const EYE_LEFT_INNER_IDX  = 133
const EYE_LEFT_OUTER_IDX  = 33
const EYE_RIGHT_INNER_IDX = 362
const EYE_RIGHT_OUTER_IDX = 263
// Eyebrow centers
const BROW_LEFT_IDX       = 105
const BROW_RIGHT_IDX      = 334
// Eye top landmarks (upper eyelid center)
const EYE_TOP_LEFT_IDX    = 159
const EYE_TOP_RIGHT_IDX   = 386

// ── Types ────────────────────────────────────────────────────────────────────

interface LandmarkPoint {
  x: number
  y: number
  z: number
}

export interface ActiveFrameSample {
  timestamp_ms:       number
  head_pose_matrix:   number[]
  lip_left:           LandmarkPoint
  lip_right:          LandmarkPoint
  eye_center_left:    LandmarkPoint
  eye_center_right:   LandmarkPoint
  brow_center_left:   LandmarkPoint
  brow_center_right:  LandmarkPoint
  eye_top_left:       LandmarkPoint
  eye_top_right:      LandmarkPoint
}

export interface ActiveLivenessPayload {
  vkyc_id:     string
  task_id:     ActiveTaskId
  duration_ms: number
  frames:      ActiveFrameSample[]
}

export interface ActiveTaskScoreResponse {
  task_id:  ActiveTaskId
  score:    number
  passed:   boolean
  status:   "pass" | "flagged"
  flags:    string[]
  check_id: string
}

export type ActiveDetectorStatus =
  | "idle"
  | "loading"
  | "ready"
  | "recording"
  | "processing"
  | "done"
  | "error"

export interface UseActiveDetectorReturn {
  status:         ActiveDetectorStatus
  error:          string | null
  result:         ActiveTaskScoreResponse | null
  initialize:     () => Promise<void>
  startRecording: (videoElement: HTMLVideoElement, taskId: ActiveTaskId, durationMs: number) => void
  resetForNextTask: () => void
  cleanup:        () => void
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useActiveLivenessDetector(
  vkycId: string
): UseActiveDetectorReturn {

  const [status, setStatus] = useState<ActiveDetectorStatus>("idle")
  const [error,  setError]  = useState<string | null>(null)
  const [result, setResult] = useState<ActiveTaskScoreResponse | null>(null)

  const landmarkerRef    = useRef<FaceLandmarker | null>(null)
  const framesRef        = useRef<ActiveFrameSample[]>([])
  const startTimeRef     = useRef<number>(0)
  const rafRef           = useRef<number>(0)
  const videoElementRef  = useRef<HTMLVideoElement | null>(null)
  const taskIdRef        = useRef<ActiveTaskId | null>(null)
  const durationMsRef    = useRef<number>(0)
  const isRecordingRef   = useRef<boolean>(false)
  const isFinishedRef    = useRef<boolean>(false)

  // ── 1. Load MediaPipe (reuses same model as passive) ─────────────────────
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
        outputFaceBlendshapes:              false,   // not needed for active tasks
        outputFacialTransformationMatrixes: true     // needed for head pose
      })
      setStatus("ready")
    } catch (e) {
      setError("Failed to load liveness model. Please refresh.")
      setStatus("error")
    }
  }, [])

  // ── 2. Extract landmarks from a single detection result ───────────────────
  const extractFrame = useCallback((
  landmarks: Array<{ x: number; y: number; z: number }>,
  matrix: { data: number[] | Float32Array },
  elapsedMs: number
): ActiveFrameSample => {

    const lm = landmarks

    // Eye center = average of inner + outer corner
    const eyeCenterLeft: LandmarkPoint = {
      x: (lm[EYE_LEFT_INNER_IDX].x  + lm[EYE_LEFT_OUTER_IDX].x)  / 2,
      y: (lm[EYE_LEFT_INNER_IDX].y  + lm[EYE_LEFT_OUTER_IDX].y)  / 2,
      z: (lm[EYE_LEFT_INNER_IDX].z  + lm[EYE_LEFT_OUTER_IDX].z)  / 2,
    }
    const eyeCenterRight: LandmarkPoint = {
      x: (lm[EYE_RIGHT_INNER_IDX].x + lm[EYE_RIGHT_OUTER_IDX].x) / 2,
      y: (lm[EYE_RIGHT_INNER_IDX].y + lm[EYE_RIGHT_OUTER_IDX].y) / 2,
      z: (lm[EYE_RIGHT_INNER_IDX].z + lm[EYE_RIGHT_OUTER_IDX].z) / 2,
    }

    return {
      timestamp_ms:      Math.round(elapsedMs),
      head_pose_matrix:  Array.from(matrix.data),
      lip_left:          { x: lm[LIP_LEFT_IDX].x,       y: lm[LIP_LEFT_IDX].y,       z: lm[LIP_LEFT_IDX].z },
      lip_right:         { x: lm[LIP_RIGHT_IDX].x,      y: lm[LIP_RIGHT_IDX].y,      z: lm[LIP_RIGHT_IDX].z },
      eye_center_left:   eyeCenterLeft,
      eye_center_right:  eyeCenterRight,
      brow_center_left:  { x: lm[BROW_LEFT_IDX].x,      y: lm[BROW_LEFT_IDX].y,      z: lm[BROW_LEFT_IDX].z },
      brow_center_right: { x: lm[BROW_RIGHT_IDX].x,     y: lm[BROW_RIGHT_IDX].y,     z: lm[BROW_RIGHT_IDX].z },
      eye_top_left:      { x: lm[EYE_TOP_LEFT_IDX].x,   y: lm[EYE_TOP_LEFT_IDX].y,   z: lm[EYE_TOP_LEFT_IDX].z },
      eye_top_right:     { x: lm[EYE_TOP_RIGHT_IDX].x,  y: lm[EYE_TOP_RIGHT_IDX].y,  z: lm[EYE_TOP_RIGHT_IDX].z },
    }
  }, [])

  // ── 3. Send collected frames to FastAPI ───────────────────────────────────
  const finishRecording = useCallback(async (): Promise<void> => {
    if (isFinishedRef.current || !isRecordingRef.current) return
    isFinishedRef.current  = true
    isRecordingRef.current = false

    cancelAnimationFrame(rafRef.current)
    setStatus("processing")

    const payload: ActiveLivenessPayload = {
      vkyc_id:     vkycId,
      task_id:     taskIdRef.current!,
      duration_ms: durationMsRef.current,
      frames:      framesRef.current
    }

    const apiUrl = import.meta.env.VITE_FASTAPI_URL

    try {
      const res = await fetch(`${apiUrl}/vkyc/liveness/active`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
      })

      if (!res.ok) {
        const detail = await res.json()
        throw new Error(`Server error ${res.status}: ${JSON.stringify(detail)}`)
      }

      const data: ActiveTaskScoreResponse = await res.json()
      setResult(data)
      setStatus("done")

    } catch (e) {
      console.error("Active liveness fetch error:", e)
      setError("Failed to submit active liveness check. Please retry.")
      setStatus("error")
    }
  }, [vkycId])

  // ── 4. Frame processing loop (rAF — same pattern as passive) ─────────────
  const processFrame = useCallback((): void => {
    const video      = videoElementRef.current
    const landmarker = landmarkerRef.current

    if (!video || !landmarker || !isRecordingRef.current) return

    const now     = performance.now()
    const elapsed = now - startTimeRef.current

    // Stop when task duration is reached
    if (elapsed >= durationMsRef.current) {
      finishRecording()
      return
    }

    const detection = landmarker.detectForVideo(video, now)

    const hasLandmarks = detection.faceLandmarks?.length > 0
    const hasMatrix    = detection.facialTransformationMatrixes?.length > 0

    if (hasLandmarks && hasMatrix) {
      const frame = extractFrame(
        detection.faceLandmarks[0],
        detection.facialTransformationMatrixes[0],
        elapsed
      )
      framesRef.current.push(frame)
    }

    rafRef.current = requestAnimationFrame(processFrame)
  }, [finishRecording, extractFrame])

  // ── 5. Start recording for a specific task ────────────────────────────────
  const startRecording = useCallback((
    videoElement: HTMLVideoElement,
    taskId:       ActiveTaskId,
    durationMs:   number
  ): void => {
    // Reset for fresh task
    framesRef.current      = []
    isFinishedRef.current  = false
    isRecordingRef.current = true
    videoElementRef.current = videoElement
    taskIdRef.current       = taskId
    durationMsRef.current   = durationMs
    startTimeRef.current    = performance.now()

    setStatus("recording")
    setError(null)
    rafRef.current = requestAnimationFrame(processFrame)
  }, [processFrame])

  // ── 6. Reset between tasks (clears result, keeps landmarker loaded) ───────
  const resetForNextTask = useCallback((): void => {
    cancelAnimationFrame(rafRef.current)
    framesRef.current      = []
    isFinishedRef.current  = false
    isRecordingRef.current = false
    setResult(null)
    setError(null)
    setStatus("ready")   // landmarker stays loaded — no re-initialize needed
  }, [])

  // ── 7. Cleanup ────────────────────────────────────────────────────────────
  const cleanup = useCallback((): void => {
    isRecordingRef.current = false
    cancelAnimationFrame(rafRef.current)
    landmarkerRef.current?.close()
  }, [])

  return {
    status,
    error,
    result,
    initialize,
    startRecording,
    resetForNextTask,
    cleanup
  }
}