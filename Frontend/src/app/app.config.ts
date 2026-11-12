import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { API_URL } from './core/config/api-url.token';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { unauthorizedInterceptor } from './core/interceptors/unauthorized.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, unauthorizedInterceptor])),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: API_URL, useValue: environment.apiUrl },
  ],
};
