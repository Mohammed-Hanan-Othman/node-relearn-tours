const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const userRouter = express.Router();

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
  "/updateme",
  authController.protectRoute,
  userController.updateMe,
);

userRouter.delete(
  "/deleteme",
  authController.protectRoute,
  userController.deleteMe,
);
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
