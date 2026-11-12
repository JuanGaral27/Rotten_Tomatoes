import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../config/api-url.token';
import { TokenStorageService } from '../services/token-storage.service';

/** Agrega "Authorization: Bearer <token>" solo a las peticiones hacia NUESTRA API. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenStorageService).token();
  const apiUrl = inject(API_URL);

  if (!token || !request.url.startsWith(apiUrl)) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
