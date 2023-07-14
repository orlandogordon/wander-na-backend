// TODO - Add startDate model object to the tour model so that tour availability can be tracked.
const mongoose = require('mongoose');

const startDateSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Start date must be specified!'],
    },
    participants: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

startDateSchema.index({ date: 1, participants: 1 }, { unique: true });

// startDateSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'user',
//     select: 'name photo',
//   });

//   next();
// });

// startDateSchema.statics.calcAverageRatings = async function (tourId) {
//   const stats = await this.aggregate([
//     {
//       $match: { tour: tourId },
//     },
//     {
//       $group: {
//         _id: '$tour',
//         nRating: { $sum: 1 },
//         avgRating: { $avg: '$rating' },
//       },
//     },
//   ]);
//   // console.log(stats);
//   if (stats.length > 0) {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: stats[0].nRating,
//       ratingsAverage: stats[0].avgRating,
//     });
//   } else {
//     await Tour.findByIdAndUpdate(tourId, {
//       ratingsQuantity: 0,
//       ratingsAverage: 4.5,
//     });
//   }
// };

// reviewSchema.post('save', function (next) {
//   // this points to current review
//   this.constructor.calcAverageRatings(this.tour);
// });

// // Update review average after a singular review is updated.
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   // console.log(this.r);
//   next();
// });

// reviewSchema.post(/^findOneAnd/, async function (next) {
//   await this.r.constructor.calcAverageRatings(this.r.tour);
// });

// const Review = mongoose.model('Review', reviewSchema);

// module.exports = Review;

// POST /tour/234dsaf/reviews
// GET /tour/234dsaf/reviews
// GET /tour/234dsaf/reviews/5446gsfg
