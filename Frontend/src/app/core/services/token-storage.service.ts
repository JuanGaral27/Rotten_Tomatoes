import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/app.constants';
import { User } from '../models/user.models';

/** Guarda la sesión (token + usuario) en localStorage y la expone como signals. */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  readonly token = signal<string | null>(this.read(STORAGE_KEYS.TOKEN));
  readonly user = signal<User | null>(this.parseUser(this.read(STORAGE_KEYS.USER)));

  save(token: string, user: User): void {
    this.token.set(token);
    this.write(STORAGE_KEYS.TOKEN, token);
    this.saveUser(user);
  }

  saveUser(user: User): void {
    this.user.set(user);
    this.write(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  clear(): void {
    this.token.set(null);
    this.user.set(null);
    this.remove(STORAGE_KEYS.TOKEN);
    this.remove(STORAGE_KEYS.USER);
  }

  // localStorage puede fallar (modo privado, datos bloqueados): nunca debe romper la app.
  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* se mantiene solo en memoria */
    }
  }

  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* nada que hacer */
    }
  }

  private parseUser(raw: string | null): User | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
