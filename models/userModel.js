require("dotenv").config();
const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const otp = require("otp-generator");

const SALT = parseInt(process.env.DB_SALT);
const TEN_MINUTES = 10 * 60 * 1000;
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A user must have a name"],
    unique: [true, "Email addresses must be unique for each user"],
    minlength: [3, "Names must be at least 3 characters long"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "A user must have an email address"],
    unique: [true, "Email addresses must be unique for each user"],
    validate: [validator.isEmail, "Please provide an email"],
    lowercase: true,
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [8, "Passwords must be at least 8 characters long"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    minlength: [8, "Passwords must be at least 8 characters long"],
    validate: {
      validator: function (value) {
        return this.password == value;
      },
      message: "Second password must be same as initial password",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  resetTokenExpiry: Date,
});

// Using a presave to allow encryption
userSchema.pre("save", async function (next) {
  // Exiting if password is modified
  if (!this.isModified("password")) return next();

  // Hash password and remove confirm field
  this.password = await bcrypt.hash(this.password, SALT);
  this.passwordConfirm = undefined;

  next();
});

// middlewate to ensure only active users are always returned
userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

// creating an instance method for comparing passwords
// userSchema.methods.isCorrectPassword = async function(inputPassword, userPassword){
// return await bcrypt.compare(inputPassword, userPassword)
// }

// Update passwordChangedAt after password changes (I don't know why it is not in controller)
userSchema.pre("save", function (next) {
  // if password is not modified or we have new document, don't run
  if (!this.isModified("password") || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000; // Subtracting 1 second to tackle delays
  next();
});

// track password changes
userSchema.methods.hasPasswordChangedAfter = function (JwtTimestamp) {
  // returns true if password changed after JWTToken was issued
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return changedTimestamp > JwtTimestamp;
  }
  return false;
};
// Create a token for password reset
userSchema.methods.createResetPasswordToken = async function () {
  // Generate and hash code for password reset
  const otpOptions = {
    digits: 1,
    lowerCaseAlphabets: 0,
    upperCaseAlphabets: 1,
    specialChars: 0,
  };
  const resetCode = otp.generate(8, otpOptions);

  // Store hashed token and set token expiry
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");
  this.passwordResetToken = hashedToken;
  this.resetTokenExpiry = Date.now() + TEN_MINUTES;

  return resetCode;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
