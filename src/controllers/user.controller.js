import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { response } from "express";

const registerUser = asyncHandler(async (req,res)=>{
    // get user details from frontend
    // validation - not empty 
    // check if user allready exists : username and email 
    // check for images , check for avatar
    // if available uplaod them to cloudinary, avatar 
    // create user object - create entry in db 
    // remove password and refresh token field from response 
    //  check for user creation 
    // if created return response

   const {username,fullName,email, password} = req.body
   console.log("password", password);
   if(
    [username,fullName,email,password].some((field) => field?.trim() === "")
   ){
    throw ApiError(400, "all fields are required")
   }

  const existedUser =  User.findOne({
    $or :[{username},{email}]
   })
   if(existedUser){
    throw new ApiError(409, "userwith email or username is alredy exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;
   if(!avatarLocalPath){
    throw new ApiError(400, "avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if(!avatar){
    throw new ApiError(400, "avatar is required");
   }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()
   })
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if(!createdUser){
    throw new ApiError(500, "something went wrong while registering the user");
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered successfully !")
   )
})
export {
    registerUser,
}












// const registerUser = asyncHandler(async (req,res) =>{
//     res.status(200).json({
//         message: "saurabh is learning backend"
//     })
// })