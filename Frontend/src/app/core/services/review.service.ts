import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, defaultIfEmpty, expand, filter, map, take } from 'rxjs';
import { Page } from '../models/api.models';
import { Review, ReviewListFilters, ReviewPayload } from '../models/review.models';
import { ApiService } from './api.service';

export const reviewMovieId = (review: Review): string =>
  typeof review.movie === 'string' ? review.movie : review.movie.id;

export const reviewAuthorId = (review: Review): string =>
  typeof review.user === 'string' ? review.user : review.user.id;

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly api = inject(ApiService);

  listByMovie(movieId: string, filters: ReviewListFilters): Observable<Page<Review>> {
    return this.api.getPage<Review>(`/movies/${movieId}/reviews`, filters);
  }

  listByUser(userId: string, page: number, limit: number): Observable<Page<Review>> {
    return this.api.getPage<Review>(`/users/${userId}/reviews`, { page, limit });
  }

  /**
   * Busca la reseña que un usuario hizo de una película (el backend no tiene un endpoint directo,
   * así que se recorren sus reseñas por páginas y se detiene al encontrarla).
   */
  findUserReviewForMovie(userId: string, movieId: string): Observable<Review | null> {
    const PAGE = 50;
    const isMatch = (review: Review): boolean => reviewMovieId(review) === movieId;

    return this.listByUser(userId, 1, PAGE).pipe(
      expand((page) =>
        page.pagination.hasNextPage && !page.items.some(isMatch)
          ? this.listByUser(userId, page.pagination.page + 1, PAGE)
          : EMPTY,
      ),
      map((page) => page.items.find(isMatch) ?? null),
      filter((review): review is Review => review !== null),
      take(1),
      defaultIfEmpty(null),
    );
  }

  create(movieId: string, payload: ReviewPayload): Observable<Review> {
    return this.api.post<Review>(`/movies/${movieId}/reviews`, payload);
  }

  update(reviewId: string, payload: Partial<ReviewPayload>): Observable<Review> {
    return this.api.patch<Review>(`/reviews/${reviewId}`, payload);
  }

  remove(reviewId: string): Observable<void> {
    return this.api.delete(`/reviews/${reviewId}`);
  }
}
