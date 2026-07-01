const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const multer = require("multer");
const { AppError } = require("../utils/errors");

const userRouter = express.Router();

// Defining storage and filter for multer.
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "notes/images");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const filename = `user-${req.user._id}-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});

const multerFilter = (req, file, cb) => {
  // Perform preliminary check for image
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new AppError("File may not be an image.Please upload only images.", 400),
      false,
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

userRouter.get("/", userController.getAllUsers);
userRouter.post("/signup", authController.signup);
userRouter.post("/login", authController.login);

userRouter.post("/forgot-password", authController.forgotPassword);
userRouter.patch("/reset-password/:resetToken", authController.resetPassword);
userRouter.patch(
  "/update-password",
  authController.protectRoute,
  authController.updatePassword,
);

userRouter.get("/me", authController.protectRoute, userController.getMe);
userRouter.patch(
  "/me",
  authController.protectRoute,
  upload.single("photo"),
  userController.updateMe,
);
userRouter.delete("/me", authController.protectRoute, userController.deleteMe);

userRouter.get("/test", (req, res, next) => {
  res.send("All is fine for now.");
});

// userRouter
//     .route("/")
//     .get(getAllUsers)
//     .post(createUser);

// userRouter
//     .route("/:id")
//     .get(getUser)
//     .patch(updateUser)
//     .delete(deleteUser);

module.exports = userRouter;
