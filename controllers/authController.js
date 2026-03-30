require("dotenv").config();
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { catchAsync, AppError } = require("../utils/errors");
const crypto = require("crypto");
const bcrypt = require("bcryptjs/dist/bcrypt");
const { sendEmail } = require("../utils/emails");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN + "d";
const SALT = parseInt(process.env.DB_SALT);

const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // Destructure fields
  const {
    name,
    email,
    password,
    photo,
    passwordConfirm,
    passwordChangedAt,
    role,
  } = req.body;

  // Create new user
  const newUser = await User.create({
    name,
    email,
    password,
    photo,
    passwordConfirm,
    passwordChangedAt,
    role,
  });

  newUser.password = undefined;

  // Send token
  const token = signToken(newUser._id);

  // Send cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    expiresIn: Date.now() + JWT_EXPIRES_IN * 24 * 60 * 60 * 1000,
  });

  // Send response
  res.status(200).json({
    status: "Success",
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  // Read email and password
  const { email, password } = req.body;

  // Check if they exist and send appropriate error using AppError class
  if (!email || !password) {
    return next(new AppError("No email or password provided", 400));
  }
  console.log({ email, password });

  // check if user exist and password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect credentials", 401));
  }

  // Generate token
  const token = signToken(user._id);

  // Send cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    expiresIn: Date.now() + JWT_EXPIRES_IN * 24 * 60 * 60 * 1000,
  });

  // Send response
  res.status(200).json({
    status: "Success",
    token,
  });
});

exports.protectRoute = catchAsync(async (req, res, next) => {
  // Check headers
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return next(new AppError("Unauthorized request", 401));
  }

  // Extract token
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return next(new AppError("Please login to get access", 401));
  }

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded) {
    return next(new AppError("Token expired or invalid. Please login", 401));
  }

  // Ensure user is still active
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError("The user associated with this token no longer exists", 401),
    );
  }

  // Check if password has not changed
  const result = user.hasPasswordChangedAfter(decoded.iat);
  if (result) {
    return next(
      new AppError("User recently changed password! Please login again", 401),
    );
  }

  // Attach user object to request
  console.log("Inside the protect Route");
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  // Ensures action can only be performed by permitted users
  return (req, res, next) => {
    console.log(roles);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user and send response if no user found
  const { email } = req.body;
  if (!email) {
    return next(new AppError("No email provided", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No users found or email incorrect.", 404));
  }
  console.log(user, "Done here");

  // Get random code to reset password
  const resetCode = await user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  console.log("Reset code is: ", resetCode);
  console.log(user);

  // const resetUrl = `${req.protocol}//${req.get("host")}/api/v1/users/reset-password/${resetCode}`;
  // Send email
  const options = {
    from: "Random-person@random.com",
    to: user.email,
    subject: "Testing reset email (valid for 10 minutes)",
    text: `This is a very simple test email as part of my coding life. 
        Please feel free to ignore. Random code is ${resetCode}. use resetUrl`,
  };

  // try {
  //     await sendEmail(options);
  // } catch (error) {
  //     // Reset token and the expired property
  //     user.passwordResetToken = undefined
  //     user.resetTokenExpiry = undefined
  //     await user.save({ validateBeforeSave: false });
  //     return next(new AppError("Error sending reset mail. Retry again", 500));
  // }

  res.status(200).json({
    status: "Success",
    message: "Token sent to email",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;
  console.log({ password, passwordConfirm });
  if (!password || !passwordConfirm) {
    return next(new AppError("No passwords provided for reset.", 400));
  }
  const token = req.params.resetToken;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  });

  // Deny password reset access if no user found
  if (!user) {
    return next(new AppError("Token invalid or has expired"), 400);
  }

  // Allow password reset and save changes
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  // Log user in with JWT token
  const loginToken = signToken(user._id);
  res.status(200).json({
    status: "Success",
    message: "Password reset successfully",
    loginToken,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new AppError("No password provided", 400));
  }
  // Get user (using token)
  const user = await User.findById(req.user._id).select("+password");

  // check if current password is correct
  const isCorrectPassword = await bcrypt.compare(
    currentPassword,
    user.password,
  );
  if (!isCorrectPassword) {
    return next(new AppError("User credentials incorrect, retry", 401));
  }

  // reset password
  user.password = newPassword;
  user.passwordConfirm = confirmPassword;
  await user.save();

  // login the current user by sending a token
  const loginToken = signToken(user._id);
  res.status(200).json({
    status: "Success",
    message: "Password updated successfully",
    loginToken,
  });
});
// promisifying functions
/**
 * Issues:
 * 1. Checking if user exists after verifying token
 * 2. Checking if user has changed password after token was issued (necessary?)
 *
 */

// Need to setup maximum login attempts to work against attacks

/** immediate todos */
// send token as a cookie res.cookie... (cookie expiry, httpOnly, but the secure is only in prod)
// refactor cookie sending process into a function
