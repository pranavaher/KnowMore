require("dotenv").config();
import mongoose, {Document, Model, Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  },
  role: string;
  isVerified: boolean;
  courses: Array<{courseId: string}>;
  comparePassword: (password: string) => Promise<boolean>;
  signAccessToken: () => string;
  signRefreshToken: () => string;
};

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    validate: {
      validator: function(value:string){
        return emailRegexPattern.test(value);
      },
      message: "Please enter valid email",
    },
    unique: true,
  },
  password: {
    type: String,
    // required: [true, "Please enter your password"], // Removed because of social auth.
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  avatar: {
    public_id: String,
    url: String,
  },
  role: {
    type: String,
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  courses: [
    {courseId: String}
  ]
},{timestamps: true});

// Hash Password before saving it

userSchema.pre<IUser>("save", async function(next){
  if(!this.isModified('password')){
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
})

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean>{
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign access token
userSchema.methods.signAccessToken = function (){
  return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN || "", {expiresIn: "5m"})
};

// Sign refresh token
userSchema.methods.signRefreshToken = function (){
  return jwt.sign({id: this._id}, process.env.REFRESH_TOKEN || "", {expiresIn: "3d"})
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);
export default userModel;
