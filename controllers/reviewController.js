const Review = require("../models/reviewModel");
const APIFeatures = require("../utils/utils");
const { catchAsync, AppError } = require("../utils/errors");
const Tour = require("../models/tourModel");

exports.createReview = catchAsync(async (req, res, next) => {
  // Ensure tour exists
  const tourId = req.params.id;
  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError("No associated tour found", 404));
  }

  // Create review
  const reviewData = { ...req.body, tour: tourId, user: req.user.id };
  const review = await Review.create(reviewData);
  res.status(201).json({ status: "Success", data: { review } });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // Ensure tour exists
  const tourId = req.params.id;
  const tour = await Tour.findById(tourId);
  if (!tour) {
    return next(new AppError("No associated tour found", 404));
  }

  const features = new APIFeatures(Review.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const reviews = await features.query;

  res.status(200).json({
    status: "Success",
    results: reviews.length,
    data: { reviews },
  });
});
