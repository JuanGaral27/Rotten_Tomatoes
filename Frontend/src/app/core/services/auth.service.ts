import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { AuthResult, LoginPayload, RegisterPayload, User } from '../models/user.models';
import { ApiService } from './api.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);

  readonly user = this.storage.user.asReadonly();
  readonly isLoggedIn = computed(() => this.storage.token() !== null && this.storage.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');
  readonly isCritic = computed(() => this.user()?.role === 'critic');

  login(payload: LoginPayload): Observable<User> {
    return this.api.post<AuthResult>('/auth/login', payload).pipe(this.startSession());
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.api.post<AuthResult>('/auth/register', payload).pipe(this.startSession());
  }

  /** Vuelve a leer el usuario desde el servidor (por si un admin le cambió el rol). */
  refreshProfile(): Observable<User> {
    return this.api.get<User>('/auth/me').pipe(tap((user) => this.storage.saveUser(user)));
  }

  /** Actualiza el usuario en memoria tras editar el perfil. */
  setUser(user: User): void {
    this.storage.saveUser(user);
  }

  logout(): void {
    this.storage.clear();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private startSession() {
    return (source: Observable<AuthResult>): Observable<User> =>
      source.pipe(
        tap(({ token, user }) => this.storage.save(token, user)),
        map(({ user }) => user),
      );
  }
}
