import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true 
    },

    aadharVerificationStatus:{
        type:String,
        enum:["Pending","Verified","Rejected"],
        default:"Pending",
        required:true,
    },

    aadharCheckResult:{
        type:String,
        default:null,
    },

    panVerificationStatus:{
        type:String,
        enum:["Pending","Verified","Rejected"],
        default:"Pending",
        required:true,
    },

    panCheckResult:{
        type:String,
        default:null,
    }
},{
    timestamps:true
});

const Result= mongoose.model("Result", ResultSchema);
export default Result;