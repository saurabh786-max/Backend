import {asyncHandler} from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { response } from "express";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async(userId)=>{

 try{
  const user = await User.findById(userId);
 const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave:false });
  return {accessToken,refreshToken};
 }
 catch(error){
  throw new ApiError(500,"something went wrong!!");
 }
}
const registerUser = asyncHandler(async (req,res)=>{
  console.log("Content-Type header:", req.headers["content-type"]);
console.log("req.body:", req.body);
console.log("req.files:", req.files);

    // get user details from frontend
    // validation - not empty 
    // check if user allready exists : username and email 
    // check for images , check for avatar
    // if available uplaod them to cloudinary, avatar 
    // create user object - create entry in db 
    // remove password and refresh token field from response 
    //  check for user creation 
    // if created return response

   const {username,fullName,email, password,} = req.body
   console.log("password", password);
   if([username,fullName,email,password].some((field) => field?.trim() === "")){
    throw ApiError(400, "all fields are required")
   }

  const existedUser = await User.findOne({
    $or :[{username},{email}]
   })
   if(existedUser){
    throw new ApiError(409, "userwith email or username is alredy exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath ;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenght > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }
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
const LoginUser = asyncHandler(async (req,res)=>{
  // take data from req.body 
  // validate that the user has given unsername or email 
  // search user in the db
  // if user is find check password 
  // if password is check , we have to generate access and refersh token for that user
  // send tokens in secure cookies
  

  const{username,password,email} = req.body;

  if(!(username || email)){
    throw new ApiError(400, "username or email is required")
  }
 const user = await User.findOne({
    $or :[{username},{email}]
  })

  if(!user){
    throw new ApiError(400, "user doesn't exists");
  }
  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid){
    throw new ApiError(401, "invalid user credentials")
  }
const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
  
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true,
  }
    return res.status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(200,{
        user: loggedInUser, accessToken, refreshToken
      },
    "user logged in Successfully")
    )


})

const logoutUser = asyncHandler(async (req, res)=>{
  // clear cookies for the user
  // also reset the refreshtoken field from the database
 await User.findByIdAndUpdate(req.user._id,{
    $set:{
      refreshToken:undefined
    }
  },
    {
      new :true
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
  }

  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("RefreshToken",options)
  .json(new ApiResponse(200, {}, "user logged out successfully "))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
 
 if(!incomingRefreshToken){
  throw new ApiError(404,"unauthorised request")
 }
 try {
  const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
  const user = await User.findById(decodedToken?._id)
 
  if(!user){
   throw new ApiError(402,"Invalid refresh token")
  }
  if(incomingRefreshToken !== user?.refreshToken){
   throw new ApiError(401,"Refresh token is expried or used")
  }
 
  const options={
   httpOnly : true,
   secure: true,
  }
 
  const {accessToken,newRefreshToken} =await generateAccessAndRefreshTokens(user._id)
   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken", newRefreshToken,options)
   .json(
     new ApiResponse(200, {accessToken,refreshToken: newRefreshToken})
   )
 } catch (error) {
  throw new ApiError(401, error?.message||"invalid refresh token")
 }
})

export {
    registerUser,
    LoginUser,
    logoutUser,
    refreshAccessToken
}












// const registerUser = asyncHandler(async (req,res) =>{
//     res.status(200).json({
//         message: "saurabh is learning backend"
//     })
// })