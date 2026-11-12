import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { getErrorCode } from '../utils/error-message';

const SESSION_ERROR_CODES = ['INVALID_TOKEN', 'MISSING_TOKEN'];

/** Si el token expiró o el usuario ya no existe, cierra la sesión y manda a /login. */
export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const isSessionError =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        SESSION_ERROR_CODES.includes(getErrorCode(error) ?? '');

      if (isSessionError && auth.isLoggedIn()) auth.logout();
      return throwError(() => error);
    }),
  );
};
