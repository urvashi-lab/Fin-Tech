
import mongoose from "mongoose";

const VKYCSchema = new mongoose.Schema(
  {

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    finalStatus: {
      type: String,
      enum: [
        "IN_PROGRESS",
        "VERIFIED",
        "FAILED"
      ],
      default: "IN_PROGRESS",
      required: true
    },
    checks: [
      {
        type: {
          type: String,
          enum: ["SELFIE", "PAN", "AADHAAR", "AADHAAR_BACK"],
          required: true
        },
        imageUrl: {
          type: String,
          required: true
        },
        status: {
          type: String,
          enum: ["PENDING", "SUCCESS", "FAILED"],
          default: "PENDING"
        },
        result: {
          type: String,
          default: null
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ── liveness block ────────────────────────────────────────────────────
   liveness: {
  passiveScore: {
    type: Number,
    default: null
  },
  passiveFlags: {
    type: [String],
    default: []
  },
  activeScore: {
    type: Number,
    default: null
  },
  challengeTypes: {
    type: [String],
    default: []
  },
  taskResults: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  compositeScore: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ["PASS", "FLAGGED", "FAIL"],
    default: null
  },
  flags: {
    type: [String],
    default: []
  }
},

    // ── face match block ──────────────────────────────────────────────────
  //   faceMatch: {
  //     score: {
  //       type: Number,
  //       default: null
  //     },
  //     status: {
  //       type: String,
  //       enum: ["PASS", "FAIL"],
  //       default: null
  //     },
  //     verifiedAt: {
  //       type: Date,
  //       default: null
  //     }
  //   }

  },
 
  { timestamps: true }
);

export default mongoose.model("VKYC", VKYCSchema);