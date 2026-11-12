import mongoose from 'mongoose';
import { MEDIA_TYPES, MEDIA_TYPE_VALUES } from '../config/constants.js';
import { normalizeJson } from './plugins/normalizeJson.js';

// Promedio y cantidad de reseñas de una categoría (usuarios o críticos).
const ratingStatSchema = new mongoose.Schema(
  {
    average: { type: Number, default: null },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

const movieSchema = new mongoose.Schema(
  {
    imdbId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    mediaType: { type: String, enum: [...MEDIA_TYPE_VALUES], default: MEDIA_TYPES.MOVIE },

    year: { type: Number, default: null },
    released: { type: Date, default: null },
    rated: { type: String, default: null },
    runtime: { type: Number, default: null }, // minutos

    genres: { type: [String], default: [] },
    directors: { type: [String], default: [] },
    writers: { type: [String], default: [] },
    actors: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    countries: { type: [String], default: [] },

    plot: { type: String, default: null }, // sinopsis
    awards: { type: String, default: null },
    poster: { type: String, default: null }, // URL de la carátula

    // Puntajes que vienen de la API externa (informativos).
    externalRatings: {
      imdb: {
        rating: { type: Number, default: null }, // 0-10
        votes: { type: Number, default: null },
      },
      metascore: { type: Number, default: null }, // 0-100
      rottenTomatoes: { type: Number, default: null }, // 0-100
    },

    // Puntajes de NUESTRA app (se recalculan al crear/editar/borrar reseñas).
    ratings: {
      user: { type: ratingStatSchema, default: () => ({}) },
      critic: { type: ratingStatSchema, default: () => ({}) },
    },

    source: { type: String, default: 'omdb' },
  },
  { timestamps: true },
);

movieSchema.index({ title: 1 });
movieSchema.index({ released: -1 });
movieSchema.index({ year: 1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ 'ratings.user.average': -1 });
movieSchema.index({ 'ratings.critic.average': -1 });
movieSchema.index({ 'externalRatings.imdb.rating': -1 });

movieSchema.plugin(normalizeJson);

export const Movie = mongoose.model('Movie', movieSchema);
