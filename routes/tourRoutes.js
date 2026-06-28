const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewController = require("../controllers/reviewController");

const tourRouter = express.Router();

tourRouter
  .route("/top-5-tours")
  .get(tourController.topTours, tourController.getAllTours);

tourRouter.route("/tour-stats").get(tourController.getTourStats);

tourRouter
  .route("/busiest-months/:year")
  .get(tourController.getTourDatabyMonth);

tourRouter
  .route("/")
  .get(authController.protectRoute, tourController.getAllTours)
  .post(
    authController.protectRoute,
    authController.restrictTo("admin"),
    tourController.createTour,
  );

tourRouter
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protectRoute,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour,
  );

tourRouter
  .route("/:id/reviews")
  .get(reviewController.getAllReviews)
  .post(authController.protectRoute, reviewController.createReview);

module.exports = tourRouter;
