export type Role = 'user' | 'critic' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  username: string;
}

export interface CreateUserPayload extends RegisterPayload {
  role: Role;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface UserListFilters {
  q?: string;
  role?: Role;
  page?: number;
  limit?: number;
}
