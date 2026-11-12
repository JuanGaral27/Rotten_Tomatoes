import { MediaType } from './movie.models';
import { Role } from './user.models';

export type ReviewerType = 'user' | 'critic';
export type ReviewSortBy = 'date' | 'rating';

export interface ReviewAuthor {
  id: string;
  username: string;
  role: Role;
}

export interface ReviewMovie {
  id: string;
  imdbId: string;
  title: string;
  year: number | null;
  poster: string | null;
  mediaType: MediaType;
}

/** `user` / `movie` vienen "populados" (objeto) en los listados y detalle. */
export interface Review {
  id: string;
  movie: ReviewMovie | string;
  user: ReviewAuthor | string;
  rating: number;
  comment: string;
  reviewerType: ReviewerType;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPayload {
  rating: number;
  comment: string;
}

export interface ReviewListFilters {
  reviewerType?: ReviewerType;
  sortBy?: ReviewSortBy;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
