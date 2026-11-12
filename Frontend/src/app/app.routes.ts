import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'discover',
        loadComponent: () => import('./features/discover/discover.page').then((m) => m.DiscoverPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin-users/admin-users.page').then((m) => m.AdminUsersPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'catalog' },
    ],
  },
  {
    path: 'movie/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/movie-detail/movie-detail.page').then((m) => m.MovieDetailPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'tabs/catalog' },
  { path: '**', redirectTo: 'tabs/catalog' },
];
