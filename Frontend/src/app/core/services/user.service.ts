import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/api.models';
import { CreateUserPayload, UpdateUserPayload, User, UserListFilters } from '../models/user.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  list(filters: UserListFilters): Observable<Page<User>> {
    return this.api.getPage<User>('/users', filters);
  }

  getById(id: string): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  create(payload: CreateUserPayload): Observable<User> {
    return this.api.post<User>('/users', payload);
  }

  update(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.api.delete(`/users/${id}`);
  }
}
