import { HttpParams } from '@angular/common/http';

type ParamValue = string | number | boolean | readonly string[] | null | undefined;

/** Convierte un objeto de filtros en HttpParams, ignorando vacíos; los arrays se unen con comas. */
export const toHttpParams = (filters: object): HttpParams => {
  let params = new HttpParams();

  for (const [key, raw] of Object.entries(filters) as [string, ParamValue][]) {
    if (raw === undefined || raw === null || raw === '') continue;
    if (Array.isArray(raw)) {
      if (raw.length > 0) params = params.set(key, raw.join(','));
      continue;
    }
    params = params.set(key, String(raw));
  }
  return params;
};
