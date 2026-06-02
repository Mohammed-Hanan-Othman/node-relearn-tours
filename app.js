require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const { globalErrorHandler } = require("./utils/errors");
const userRouter = require("./routes/userRoutes");
const tourRouter = require("./routes/tourRoutes");
const helmet = require("helmet");
const sanitizer = require("express-mongo-sanitize");
const xClean = require("xss-clean");
const hpp = require("hpp");
const ONE_HOUR = 1 * 60 * 60;

const app = express();

// Middlewares
const limiter = rateLimit({
  max: 100,
  windowMs: ONE_HOUR,
  message: "Too many requests... Please try again after an hour",
});
app.use(limiter);

// Set security headers
app.use(helmet());

// sanitizer
app.use(sanitizer());
app.use(xClean());

// Body parsers
app.use(express.urlencoded({ extended: false, limit: "5KB" }));
app.use(express.json({ limit: "5KB" }));

// Assets directory
app.use(express.static("public"));

// Routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

// Tackle HTTP parameter pollution
app.use(hpp());

// Error Handling for undefined routes
// app.use((req, res) =>{
//     res.status(404).json({message:"Invalid request or resource not found"});
// });
app.all("*", (req, res, next) => {
  next("X is an error");
  // res.status(404).json({
  //     status: "Fail",
  //     message:`Invalid request or resource not found ${req.originalUrl}`
  // });
});

// Centralized error handling middleware for server errors
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: "Internal server error" });
// });

app.use(globalErrorHandler);

module.exports = app;

// install express mongo sanitize (call it in app.use)
// install xss-clean (call it in app.use)
// install hpp to work against http parameter pollution. (call it in app.use and towards the end)
//  you can whitelist some parameters
