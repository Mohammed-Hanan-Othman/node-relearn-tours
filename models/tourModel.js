const mongoose = require("mongoose");

// Create Tour schema

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      minlength: [10, "Tour name must be at least 10 characters"],
      maxlength: [50, "Tour name cannot exceed 50 characters"],
      trim: true,
    },
    slug: {
      type: String,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount must be less than tour price",
      },
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a maximum group size"],
    },
    difficulty: {
      type: String,
      required: [true, "The difficulty of a tour must be stated"],
      enum: {
        values: ["Easy", "Intermediate", "Hard"],
        message: "Tour difficulty can only be 'Easy', 'Intermediate' or 'Hard'",
      },
    },
    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: "String",
        default: "Point",
        enum: {
          values: ["Point"],
          message: "Only Point",
        },
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: "String",
          default: "Point",
          enum: {
            values: ["Point"],
            message: "Only Point",
          },
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Create index on price for ascending order
tourSchema.index({ price: 1 });

// Adding a virtual property
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// Virtual populate..
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// Document middleware.
tourSchema.pre("save", function (next) {
  // We would require a slugify package vid105.
  this.slug = this.name.toLowerCase().replaceAll(" ", "-");
  next();
});
// tourSchema.post("save", function (doc, next){
//     console.log(doc);
//     next();
// });

// Query middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: "guides", select: "-__v -_id -passwordChangedAt" });
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs)
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// Create tour model
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

/**
 * 1. GeoJSON for location data (must have type and coordinates)
 *
 * 2. Set up guides field with type mongoose shema object id to store only the ids of guides
 *
 * 3. Set it to ref User
 *
 * 4. apply populate to guides field in controller method to reference user documents into the guides
 *
 * 5. set populate path to guides and use select to exclude fields
 *
 * 6. better still set it as a pre find middleware so we don't repeat ourselves lol
 */
