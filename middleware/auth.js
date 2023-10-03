const createError = require("http-errors");
const jwt= require("jsonwebtoken");
const User = require("../models/userModel");

const isLoggedIn = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            throw createError(401, "You must login first.")
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) {
            throw createError(404, "Login with correct information.")
        }
        const exist = await User.findById(decoded.id)
        if (!exist) {
            throw createError(401, "User is not exist")
        }
        req.user = decoded;
        next()
    } catch (error) {
        next(error)
    }
}

const isLoggedOut = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;
        if (token) {
            throw createError(400, "User is already logged in.")
        }
        next()
    } catch (error) {
        next(error);
    }
}

const isAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        const userDetails = await User.findById(user.id)
        if (!userDetails.isAdmin) {
            throw createError(402, "Only admin can get this info.")
        }
        next()
    } catch (error) {
        next(error);
    }
}

const inBan = async (req, res, next) => {
    try {
        const user = req.user;
        const userDetails = await User.findById(user.id)
        if (userDetails.isBan) {
            throw createError(402, "Unfortunately you are ban now, please contact to author.")
        }
        next()
    } catch (error) {
        next(error);
    }
}




module.exports = { isLoggedIn, isLoggedOut, isAdmin, inBan }