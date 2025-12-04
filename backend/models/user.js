import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },

    phone:{
        type:String,
        required:false,
    },

    password:{
        type:String,
         required: function () {
            return !this.isGoogleUser;
        }
    },

    googleId: {
        type: String,
        default: null
    },

    isGoogleUser: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    lastLogin: {
        type: Date,
        default: Date.now
    }

},{
    timestamps:true
});



// userSchema.pre("save", async function (next) {
//     if (!this.isModified("password")) return next();
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
// });

const User=mongoose.model('User',userSchema);

export default User;