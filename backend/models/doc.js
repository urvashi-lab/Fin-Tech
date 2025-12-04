import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    aadharFront: {
      type: String,
      required: true
    },

    aadharBack: {
      type: String,
      required: true
    },

    panFront: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);
export default Document;
