import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision"

// MediaPipe eye landmark indices from the 478-point face mesh
export const LEFT_EYE_INDICES  = [362, 385, 387, 263, 373, 380]
export const RIGHT_EYE_INDICES = [33,  160, 158, 133, 153, 144]

// Types
export interface EyeLandmark {
  x: number
  y: number
  z: number
}

export interface EyeLandmarks {
  left: EyeLandmark[]
  right: EyeLandmark[]
}

export interface Blendshapes {
  eyeBlinkLeft: number
  eyeBlinkRight: number
}

export interface FrameSample {
  timestamp_ms: number
  eye_landmarks: EyeLandmarks
  blendshapes: Blendshapes
  head_pose_matrix: number[]
}

export interface PassiveLivenessPayload {
  vkyc_id: string
  duration_ms: number
  sample_rate_fps: number
  total_frames_analyzed: number
  frames: FrameSample[]
}

export interface SignalScores {
  blink_presence: number
  blink_rate: number
  head_movement: number
}

export interface PassiveLivenessResponse {
  passive_score: number
  signal_scores: SignalScores
  flags: string[]
  status: "pass" | "flagged"
  check_id: string
}

// Extract only the eye landmarks we need from full 478-point result
export function extractEyeLandmarks(
  landmarks: FaceLandmarkerResult["faceLandmarks"][0]
): EyeLandmarks {
  const extract = (indices: number[]): EyeLandmark[] =>
    indices.map(i => ({
      x: landmarks[i].x,
      y: landmarks[i].y,
      z: landmarks[i].z
    }))
  return {
    left:  extract(LEFT_EYE_INDICES),
    right: extract(RIGHT_EYE_INDICES)
  }
}

// Extract head pose matrix from MediaPipe facial transformation matrix
export function extractHeadPoseMatrix(
  matrix: FaceLandmarkerResult["facialTransformationMatrixes"][0]
): number[] {
  return Array.from(matrix.data)
}

// Extract blink blendshape scores
export function extractBlendshapes(
  blendshapes: FaceLandmarkerResult["faceBlendshapes"]
): Blendshapes {
  const scores: Partial<Blendshapes> = {}
  blendshapes[0].categories.forEach(cat => {
    if (cat.categoryName === "eyeBlinkLeft")
      scores.eyeBlinkLeft  = cat.score
    if (cat.categoryName === "eyeBlinkRight")
      scores.eyeBlinkRight = cat.score
  })
  return {
    eyeBlinkLeft:  scores.eyeBlinkLeft  ?? 0,
    eyeBlinkRight: scores.eyeBlinkRight ?? 0
  }
}

// Downsample collected frames to target FPS before sending to FastAPI
export function downsampleFrames(
  frames: FrameSample[],
  targetFps: number,
  actualFps: number
): FrameSample[] {
  const step = Math.max(1, Math.round(actualFps / targetFps))
  return frames.filter((_, i) => i % step === 0)
}