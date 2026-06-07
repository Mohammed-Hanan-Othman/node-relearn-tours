const fs = require("fs");
const Tour = require("../models/tourModel");
const APIFeatures = require("../utils/utils");
const { catchAsync, AppError } = require("../utils/errors");

exports.topTours = catchAsync(async (req, res, next) => {
  req.query.page = 1;
  req.query.limit = 5;
  req.query.sort = "price,-ratingAverage";
  req.query.fields = "name,price,rating,description,summary";
  next();
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  // Retrieve Tour stats
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRating: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1, numTours: -1 },
    },
  ]);

  // Send response
  res.status(200).json({
    status: "Success",
    data: { stats },
  });
});

exports.getTourDatabyMonth = catchAsync(async (req, res, next) => {
  const year = parseInt(req.params.year);

  const monthlyData = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTours: { $sum: 1 },
        tours: { $push: "$name" },
        numRating: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Send response
  res.status(200).json({
    status: "Success",
    data: { monthlyData },
  });
});

exports.getAllTours = catchAsync(async (req, res) => {
  // Execute request
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // Send response
  res.status(200).json({
    status: "Success",
    results: tours.length,
    data: { tours },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // Get a Tours
  const tour = await Tour.findById(req.params.id).populate("review");

  // No tours found
  if (!tour) {
    return next(new AppError("No tour found with associated ID", 404));
  }

  // Send response
  res.status(200).json({ status: "Success", data: { tour } });
});

exports.createTour = catchAsync(async (req, res, next) => {
  console.log("Hello world");

  // Create new tour
  const newTour = await Tour.create(req.body);

  // Send response
  res.status(201).json({ status: "Success", data: { tour: newTour } });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // Find and Update Tour
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // No tours found
  if (!updatedTour) {
    return next(new AppError("No tour found with associated ID", 404));
  }

  // Send response
  res.status(200).json({
    status: "Success",
    data: { tour: updatedTour },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // Find and delete tour
  const deletedTour = await Tour.findByIdAndDelete(req.params.id);

  // No tours found
  if (!deletedTour) {
    return next(new AppError("No tour found with associated ID", 404));
  }

  // Send response
  res.status(204).json({
    status: "Success",
    data: null,
  });
});
