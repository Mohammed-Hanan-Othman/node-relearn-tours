const mongoose = require("mongoose");

// Define "Review" Schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review must have content"],
      minlength: [20, "Review must be at least 20 characters"],
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "A review must have a rating"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Set index on review schema to stop duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Allowing a pre-find hook for population
reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: "tour user", select: "-__v -_id -passwordChangedAt" });
  this.populate({
    path: "user",
    select: "name -_id",
  });
  // .populate({ path: "tour", select: "name createdAt -_id" });
  next();
});

// Create "Review" model
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
