const fs = require("fs");
const User = require("../models/userModel");
const APIFeatures = require("../utils/utils");
const { catchAsync, AppError } = require("../utils/errors");

exports.getAllUsers = catchAsync(async (req, res) => {
  // Execute request
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const users = await features.query;

  // Send response
  res.status(200).json({
    status: "Success",
    results: users.length,
    data: { users },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // Prevent password update
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError("For password updates, use `passwordUpdateLink`", 400),
    );
  }

  // perform the update
  const { name, email } = req.body; // will create a filter object function
  const newObj = { name, email };
  // or we can use this { $set: { name } },
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name },
    { new: true, runValidators: true },
  );

  // send a response
  res.status(200).json({
    status: "Success",
    message: "User updated successfully",
    data: {
      user: updatedUser,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  // Get id of current user.
  // Fetch the data
  const myId = req.user.id;
  const me = await User.findById(myId, { _id: 0, __v: 0 });

  res.status(200).json({
    status: "Success",
    message: "User retrieved successfully",
    data: me,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // find user.id and then update the active property and set it to false
  const deletedUser = await User.findByIdAndUpdate(req.user._id, {
    isActive: false,
  });

  res.status(204).json({
    status: "Success",
    message: "User deleted successfully",
    data: null,
  });
});

// ensure that when we search for all users, this particular deleted one doesn't show
// use query middleware so it works from the user model
// let only those who don't have isactive as false
