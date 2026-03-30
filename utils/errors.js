class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "Fail" : "Error";
    this.isOperational = true;
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

const globalErrorHandler = (err, req, res, next) => {
  console.log("Incoming Error");
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "fail";
  if (process.env.NODE_ENV == "production") {
    err.isOperational
      ? res.status(err.statusCode).json({
          status: err.status,
          message: err.message,
          stack: err.stack,
        })
      : res.status(500).json({
          status: "Fail",
          message: "Something went very wrong",
        });
  } else if (process.env.NODE_ENV == "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
};
module.exports = { AppError, catchAsync, globalErrorHandler };
