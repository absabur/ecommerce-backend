const express = require("express");
const { registerUser, loginUser, logoutUser, ForgatePassword, resetPassword, getUserDetails, getAllUsers, updatePassword, updateProfile, getSingleUser, updateProfileByAdmin, deleteProfileByAdmin, deleteProfile, SignUpVerify, updateEmailConfirm, updateEmailRequest, addCartItem, deleteCart, addAddress, deleteAddress } = require("../controllers/userController");
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const { validateUserRegistration } = require("../validators/auth");
const runValidation = require("../validators/index")

const userRouter = express.Router()



userRouter.post("/signup",SignUpVerify);

userRouter.post("/new", validateUserRegistration, runValidation, registerUser);

userRouter.post("/login",loginUser);

userRouter.post("/logout",isLoggedIn, logoutUser);

userRouter.get("/user-info",isLoggedIn, getUserDetails);

userRouter.put("/add-cart",isLoggedIn, addCartItem);

userRouter.put("/delete-cart",isLoggedIn, deleteCart);

userRouter.put("/add-address",isLoggedIn, addAddress);

userRouter.put("/delete-address",isLoggedIn, deleteAddress);

userRouter.post("/forgot-password", ForgatePassword);

userRouter.put("/reset-password", resetPassword);

userRouter.put("/update-password",isLoggedIn, updatePassword);

userRouter.post("/update-email-requset",isLoggedIn, updateEmailRequest);

userRouter.put("/update-email", updateEmailConfirm);

userRouter.put("/update-profile",isLoggedIn, updateProfile);

userRouter.delete("/delete-profile",isLoggedIn, deleteProfile);

userRouter.get("/:id([0-9a-fA-F]{24})",isLoggedIn, isAdmin, getSingleUser);

userRouter.get("/all-users",isLoggedIn, isAdmin, getAllUsers);

userRouter.put("/:id([0-9a-fA-F]{24})",isLoggedIn, isAdmin, updateProfileByAdmin);

userRouter.delete("/:id([0-9a-fA-F]{24})",isLoggedIn, isAdmin, deleteProfileByAdmin);



module.exports = userRouter;