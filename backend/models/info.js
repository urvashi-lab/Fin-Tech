import mongoose from "mongoose";

const personalInfoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    fullName: {
        type: String,
        required: true
    },

    dob: {
        type: Date,
        required: true
    },

    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
    },

    phone: {
        type: String,
        required: true,
    },

    address: {
      
        type: String,
        required: true
    },

}, { timestamps: true });

const PersonalInfo= mongoose.model("PersonalInfo", personalInfoSchema);
export default PersonalInfo;

