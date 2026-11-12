/** Formato de respuesta del backend: { success, data, meta? } */
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { pagination?: Pagination; created?: boolean };
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field?: string; message: string }[] | string[];
  };
}

export interface Page<T> {
  items: T[];
  pagination: Pagination;
}
