import { InjectionToken } from '@angular/core';

/** URL base de la API. Se provee en app.config.ts desde environment.ts (nada hardcodeado en los servicios). */
export const API_URL = new InjectionToken<string>('API_URL');
