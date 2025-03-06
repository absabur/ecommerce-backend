const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const Product = require("../models/productModel.js");
const { jwtToken } = require("../utils/jwtToken.js");
const sendEmailWithNode = require("../utils/mailSender.js");
const { createJsonWebToken } = require("../utils/createToken.js");
const cloudinary = require("cloudinary");
const { localTime } = require("../utils/localTime.js");

exports.SignUpVerify = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      throw createError(400, "Email already in use.");
    }

    const token = createJsonWebToken(
      {
        email,
      },
      process.env.JWT_SIGNUP_KEY,
      10*60*1000
    );

    const time = localTime(10);

    // <div style="display: block; text-align: center;">
    //     <img width="200" height="200" style="margin: 1rem;" src="https://res.cloudinary.com/dh96uxb54/image/upload/v1697446308/avtars/apple-touch-icon_ypdhev.png" alt="Logo" />
    // </div>

    const emailData = {
      email,
      subject: "Verify Email",
      html: `
              <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello There</h2>
                <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">This is a Email verification. We got a request to signup from your Email address <br /> If you are not this requested person then ignore this Email.</p>
                <p style="text-align: center;">
                  <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/register/${token}" target="_blank">Click Here </a>
                </p>
                <p style="text-align: center; font-size: 18px; color: black;">to get register form.</p>
                <p style="text-align: center;">
                  <b style="color: red; font-size: 20px; text-align: center;">This Email will expires in <span style="color: black;">${time.expireTime}</span>, Complete registration before <span style="color: black;">${time.expireTime}</span></b>
                </p>
              </div>
            `,
    };

    try {
      await sendEmailWithNode(emailData);
    } catch (error) {
      throw createError(500, "failed to send verification email.");
    }

    res.status(200).json({
      success: true,
      message:
        "An email send to " +
        email +
        ". Please check the email and register from there.",
    });
  } catch (error) {
    next(error);
  }
};

exports.registerUser = async (req, res, next) => {
  try {
    const { name, password, confirmPassword, rtoken } = req.body;
    if (name.includes("@")) {
      throw createError(400, "'@' is not allow in Name.");
    }
    if (password !== confirmPassword) {
      throw createError(400, "Password and Confirm Password did not match.");
    }
    if (!rtoken) throw createError(404, "token not found.");

    const decoded = jwt.verify(rtoken, process.env.JWT_SIGNUP_KEY);
    if (!decoded)
      throw createError(
        401,
        "Unable to verify user. token has been expire or wrong token"
      );
    const email = decoded.email;

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avtars",
      width: 150,
      crop: "scale",
    });
    let createDate = localTime(0);
    let updateDate = localTime(0);
    const user = await User.create({
      name,
      email,
      password,
      address: { email },
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      createDate,
      updateDate,
    });
    if (!user) {
      throw createError(401, "unable to create user");
    }
    const token = user.getJWTToken();
    await jwtToken(token, res);

    res.status(200).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createError(401, "Please enter email and password");
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw createError(401, "invalid email or password");
    }
    const isPasswordMatch = await user.comparedPassword(password);
    if (!isPasswordMatch) {
      throw createError(401, "invalid email or password");
    }
    const token = user.getJWTToken();
    await jwtToken(token, res);
    res.status(200).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.logoutUser = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.ForgatePassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw createError(400, "No account with this email: " + email + ".");
    }

    const token = createJsonWebToken(
      {
        email,
      },
      process.env.JWT_PASSWORD_KEY,
      10*60*1000
    );

    const time = localTime(10);

    const emailData = {
      email,
      subject: "Reset Password",
      html: `
              <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user.name}</h2>
                <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">This is a confirmation Email for reset password. We got a request from your Email address to reset password. <br /> If you are not this requested person then ignore this Email.</p>
                <p style="text-align: center;">
                  <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/reset-password/${token}" target="_blank">Click Here </a>
                </p>
                <p style="text-align: center; font-size: 18px; color: black;">to get reset password form.</p>
                <p style="text-align: center;">
                  <b style=" color: red; font-size: 20px; text-align: center;">This Email will expires in <span style="color: black;">${time.expireTime}</span>, Reset Password before <span style="color: black;">${time.expireTime}</span></b>
                </p>
              </div>
            `,
    };

    try {
      await sendEmailWithNode(emailData);
    } catch (error) {
      throw createError(500, "failed to send verification email.");
    }

    res.status(200).json({
      success: true,
      message:
        "An email send to " +
        email +
        ". Please check the email and reset password from there.",
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword, confirmPassword, token } = req.body;
    if (!token) throw createError(404, "token not found.");
    try {
      const decoded = jwt.verify(token, process.env.JWT_PASSWORD_KEY);
      if (!decoded)
        throw createError(
          401,
          "Unable to verify user. token has been expire or wrong token"
        );
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        throw createError(
          400,
          "Unable to reset password. User does not exists."
        );
      }
      if (newPassword !== confirmPassword) {
        throw createError(402, "old password and new password did not match.");
      }

      user.password = newPassword;
      user.updateDate = localTime(0);

      await user.save();

      res.status(201).json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw createError(401, "Token has expired.");
      } else if (error.name === "JsonWebTokenError") {
        throw createError(401, "Invalid token.");
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

// personal details
exports.getUserDetails = async (req, res, next) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);

    for (let index = 0; index < user.cart.length; index++) {
      const product = await Product.findById(user.cart[index].productId);
      if (product.Stock < user.cart[index].quantity) {
        user.cart[index].stock = product.Stock;
        user.cart[index].quantity = product.Stock;
      }
    }

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// user details by admin
exports.getSingleUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (!user) {
      throw createError(
        402,
        `user does not exists with this id: ${req.parama.id}`
      );
    }
    res.status(201).json({
      success: true,
      message: `userDetails of Id: ${req.params.id}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    let id = req.query.id;
    let sort = req.query.sort;
    let name = req.query.name;
    if (id === "null") {
      id = "";
    }
    if (sort === "null") {
      sort = "";
    }
    if (name === "null") {
      name = "";
    }
    let filter = {};

    if (name && name.includes("@")) {
      if (sort === "admin") {
        filter = { isAdmin: true, email: name };
      } else if (sort === "ban") {
        filter = { isBan: true, email: name };
      } else {
        filter = { email: name };
      }
    } else {
      if (name !== "undefined") {
        name = new RegExp(".*" + name + ".*", "i");
      }
      if (sort === "admin") {
        filter = { isAdmin: true, name: name };
      } else if (sort === "ban") {
        filter = { isBan: true, name: name };
      } else {
        filter = { name: name };
      }
    }

    if (id.length === 24) {
      filter = { _id: id };
    }

    if (id == "undefined" && sort == "undefined" && name == "undefined") {
      filter = {};
    }

    const users = await User.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    if (!users) {
      throw createError(404, "No User to show");
    }
    const count = await User.find().countDocuments();

    res.status(200).json({
      success: true,
      users,
      pagination: {
        number_of_Users: count,
        number_of_User_in_a_page: limit,
        number_of_Pages: Math.ceil(count / limit),
        currentPage: page,
        prevPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      throw createError(
        400,
        "Unable to update password. User does not exists."
      );
    }
    const isPasswordMatch = await user.comparedPassword(oldPassword);

    if (!isPasswordMatch) {
      throw createError(401, "wrong old password.");
    }
    if (newPassword !== confirmPassword) {
      throw createError(
        402,
        "New Password and Confirm Password did not match."
      );
    }

    user.password = newPassword;
    user.updateDate = localTime(0);

    await user.save();
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
exports.updateEmailRequest = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await User.findById(req.user.id).select("+password");

    const isPasswordMatch = await data.comparedPassword(password);

    if (!isPasswordMatch) {
      throw createError(401, "wrong password.");
    }

    const user = await User.findOne({ email });
    if (user) {
      throw createError(400, "Email already in use.");
    }

    const token = createJsonWebToken(
      {
        email,
        id: req.user.id,
      },
      process.env.JWT_CHANGE_PASSWORD_KEY,
      10*60*1000
    );

    const time = localTime(10);
    const currentUser = await User.findById(req.user.id);

    const emailData = {
      email,
      subject: "Verify Email",
      html: `
              <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${currentUser.name}</h2>
                <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">This is a Email verification. We got a request to change Email from your Email address. <br /> If you are not this requested person then ignore this Email.</p>
                <p style="text-align: center;">
                  <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;" href="${process.env.clientUrl}/mail-update/${token}" target="_blank">Click Here </a>
                </p>
                <p style="text-align: center; font-size: 18px; color: black;">to update email.</p>
                <p style="text-align: center;">
                  <b style="color: red; font-size: 20px; text-align: center;">This Email will expires in <span style="color: black;">${time.expireTime}</span>, Verify Email before <span style="color: black;">${time.expireTime}</span></b>
                </p>
              </div>
            `,
    };

    try {
      await sendEmailWithNode(emailData);
    } catch (error) {
      throw createError(500, "failed to send verification email.");
    }

    res.status(200).json({
      success: true,
      message:
        "An email send to " +
        email +
        ". Please check the email and update from there.",
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEmailConfirm = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw createError(404, "token not found.");

    const decoded = jwt.verify(token, process.env.JWT_CHANGE_PASSWORD_KEY);
    if (!decoded)
      throw createError(
        401,
        "Unable to verify user. token has been expire or wrong token"
      );
    let updateDate = localTime(0);
    const { email, id } = decoded;
    const user = await User.findByIdAndUpdate(
      id,
      { email, updateDate },
      { new: true, runValidators: true, useFindAndModify: false }
    );

    if (!user) {
      throw createError(400, "Unable to update email. User does not exists.");
    }

    res.status(200).json({
      success: true,
      message: "Email updated Successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.addCartItem = async (req, res, next) => {
  try {
    let { productId, quantity, name, price, image } = req.body;
    const id = req.user.id;
    const product = await Product.findById(productId);
    if (product?.Stock === 0) {
      quantity = 0;
    }
    const user = await User.findById(id);
    const newCart = {
      productId,
      quantity: Number(quantity),
      name,
      price,
      stock: product.Stock,
      image,
    };
    let index = 0;

    const isNew = user.cart.map((item) => {
      if (item.productId.toString() === newCart.productId) {
        if (item.quantity === newCart.quantity) {
          throw createError(400, "Product alrady in cart.");
        }
        if (newCart.quantity > item.stock) {
          throw createError(403, "You reached maximum");
        }
        if (newCart.quantity < 1) {
          throw createError(403, "Item Can't be 0");
        }
        // user.cart.splice(index, 1)
        user.cart[index] = newCart;
        return false;
      }
      index++;
    });

    const found = isNew.find((item) => item === false);
    if (found !== false) {
      user.cart.push(newCart);
    }

    await user.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      message: "Add to cart successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const id = req.user.id;
    const user = await User.findById(id);

    let index = 0;
    user.cart.map((item) => {
      if (item.productId.toString() === productId) {
        user.cart.splice(index, 1);
      }
      index++;
    });

    await user.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      message: "Cart removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    let { division, district, upozila, address, number, email } = req.body;
    const id = req.user.id;
    const user = await User.findById(id);
    const newAddress = {
      division,
      district,
      upozila,
      address,
      number,
      email,
    };

    user.address = newAddress;
    await user.save({ validateBeforeSave: true });
    res.status(200).json({
      success: true,
      message: "Address added",
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);

    user.address = {};

    await user.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    var { name, avatar } = req.body;
    if (name.includes("@")) {
      throw createError(400, "'@' is not allow in Name.");
    }
    const data = await User.findById(req.user.id);

    if (name === "") {
      name = data.name;
    }
    const updatedData = {
      name: name,
    };
    if (avatar) {
      const imageId = data.avatar.public_id;
      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avtars",
        width: 300,
        crop: "scale",
      });
      await cloudinary.v2.uploader.destroy(imageId);
      updatedData.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    updatedData.updateDate = localTime(0);
    const user = await User.findByIdAndUpdate(req.user.id, updatedData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    if (!user) {
      throw createError(400, "Unable to update Profile. User does not exists.");
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw createError(400, "No user find to delete.");
    }
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie("access_token");
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    const emailData = {
      email: user?.email,
      subject: "Account Deleted",
      html: `
              <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user.name}</h2>
                <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;">Your ABS Ecommerce account is deleted successfully.</p>
                <p style="text-align: center;">
                  <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;"  href="${process.env.clientUrl}" target="_blank">Click Here </a>
                </p>
                <p style="text-align: center; font-size: 18px; color: black;">to visit us again.</p>
              </div>
            `,
    };

    try {
      await sendEmailWithNode(emailData);
    } catch (error) {
      throw createError(500, "Failed to send order Confirmation email.");
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfileByAdmin = async (req, res, next) => {
  try {
    const newData = {
      name: req.body.name,
      isAdmin: req.body.isAdmin,
      isBan: req.body.isBan,
    };
    const user = await User.findById(req.params.id);
    if (!user) {
      throw createError(404, "Unable to delete Profile. User does not exists.");
    }
    if (req.body.isAdmin === true) {
      const emailData = {
        email: user?.email,
        subject: "Promoted as Admin",
        html: `
                <div style="background-color: rgba(175, 175, 175, 0.455); width: 100%; min-width: 350px; padding: 1rem; box-sizing: border-box;">
                  <p style="font-size: 25px; font-weight: 500; text-align: center; color: tomato;">ABS E-Commerce</p>
                  <h2 style="font-size: 30px; font-weight: 700; text-align: center; color: green;">Hello ${user.name}</h2>
                  <p style="margin: 0 auto; font-size: 22px; font-weight: 500; text-align: center; color: black;"><span style="color: #141f2a;">Congratulation,</span> <br /> You promoted as an Admin of ABS E-Commerce. Now you can access all of admin routes.</p>
                  <p style="text-align: center;">
                    <a style="margin: 0 auto; text-align: center; background-color: #34eb34; font-size: 25px; box-shadow: 0 0 5px black; color: black; font-weight: 700; padding: 5px 10px; text-decoration: none;"  href="${process.env.clientUrl}/admin/dashboard" target="_blank">Click Here </a>
                  </p>
                  <p style="text-align: center; font-size: 18px; color: black;">to visit admin Dashboard.</p>
                </div>
              `,
      };
  
      try {
        await sendEmailWithNode(emailData);
      } catch (error) {
        throw createError(500, "Failed to send order Confirmation email.");
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfileByAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw createError(404, "Unable to delete Profile. User does not exists.");
    }
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
