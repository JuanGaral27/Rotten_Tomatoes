import mongoose from 'mongoose';
import { REVIEWER_TYPE_VALUES, REVIEW_COMMENT, SCORE } from '../config/constants.js';
import { normalizeJson } from './plugins/normalizeJson.js';

const reviewSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: SCORE.MIN, max: SCORE.MAX },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: REVIEW_COMMENT.MIN_LENGTH,
      maxlength: REVIEW_COMMENT.MAX_LENGTH,
    },
    // "user" o "critic": define a cuál promedio aporta esta reseña.
    reviewerType: { type: String, enum: [...REVIEWER_TYPE_VALUES], required: true },
  },
  { timestamps: true },
);

// Un usuario solo puede reseñar una vez cada película/serie.
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });
reviewSchema.index({ movie: 1, reviewerType: 1 });

reviewSchema.plugin(normalizeJson);

export const Review = mongoose.model('Review', reviewSchema);
