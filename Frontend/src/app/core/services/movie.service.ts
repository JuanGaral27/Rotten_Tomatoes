import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/api.models';
import { ExternalMovie, ExternalSearchFilters, ImportResult, Movie, MovieFilters } from '../models/movie.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MovieService {
  private readonly api = inject(ApiService);

  // ---- Catálogo propio (MongoDB) ----
  list(filters: MovieFilters, page: number, limit: number): Observable<Page<Movie>> {
    return this.api.getPage<Movie>('/movies', { ...filters, page, limit });
  }

  genres(): Observable<string[]> {
    return this.api.get<string[]>('/movies/genres');
  }

  getById(id: string): Observable<Movie> {
    return this.api.get<Movie>(`/movies/${id}`);
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/movies/${id}`);
  }

  // ---- API externa (OMDb) ----
  searchExternal(filters: ExternalSearchFilters, page: number): Observable<Page<ExternalMovie>> {
    return this.api.getPage<ExternalMovie>('/movies/external/search', { ...filters, page });
  }

  /** Si la película ya está en nuestra BD la devuelve; si no, el backend la trae de OMDb y la guarda. */
  importByImdbId(imdbId: string): Observable<ImportResult> {
    return new Observable<ImportResult>((subscriber) => {
      const subscription = this.api.postRaw<Movie>('/movies/import', { imdbId }).subscribe({
        next: (response) => {
          subscriber.next({ movie: response.data, created: response.meta?.created ?? false });
          subscriber.complete();
        },
        error: (error) => subscriber.error(error),
      });
      return () => subscription.unsubscribe();
    });
  }
}
