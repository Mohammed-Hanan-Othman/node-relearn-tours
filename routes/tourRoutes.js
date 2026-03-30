const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");

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
  .post(tourController.createTour);

tourRouter
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protectRoute,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour,
  );

module.exports = tourRouter;
