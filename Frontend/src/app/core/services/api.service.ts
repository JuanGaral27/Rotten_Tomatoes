import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config/api-url.token';
import { ApiSuccess, Page } from '../models/api.models';
import { toHttpParams } from '../utils/query-params';

/**
 * Único punto que habla HTTP con el backend. Quita el sobre { success, data, meta }
 * para que el resto de la app trabaje directo con los datos.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_URL);

  get<T>(path: string, filters: object = {}): Observable<T> {
    return this.getRaw<T>(path, filters).pipe(map((response) => response.data));
  }

  getPage<T>(path: string, filters: object = {}): Observable<Page<T>> {
    return this.getRaw<T[]>(path, filters).pipe(
      map((response) => ({ items: response.data, pagination: response.meta!.pagination! })),
    );
  }

  post<T>(path: string, body: object): Observable<T> {
    return this.postRaw<T>(path, body).pipe(map((response) => response.data));
  }

  /** Igual que post, pero conserva `meta` (p. ej. `created` al importar una película). */
  postRaw<T>(path: string, body: object): Observable<ApiSuccess<T>> {
    return this.http.post<ApiSuccess<T>>(this.url(path), body);
  }

  patch<T>(path: string, body: object): Observable<T> {
    return this.http.patch<ApiSuccess<T>>(this.url(path), body).pipe(map((response) => response.data));
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(this.url(path));
  }

  private getRaw<T>(path: string, filters: object): Observable<ApiSuccess<T>> {
    const params: HttpParams = toHttpParams(filters);
    return this.http.get<ApiSuccess<T>>(this.url(path), { params });
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
