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
    },

    aadharNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Validates format: XXXX XXXX XXXX (12 digits with spaces)
          return /^\d{4}\s\d{4}\s\d{4}$/.test(v);
        },
        message: 'Invalid Aadhar number format'
      }
    },

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      validate: {
        validator: function(v) {
          // Validates format: ABCDE1234F
          return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
        },
        message: 'Invalid PAN number format'
      }
    },

    issueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          // Ensures issue date is not in the future
          return v <= new Date();
        },
        message: 'Issue date cannot be in the future'
      }
    }
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);
export default Document;
