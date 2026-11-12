import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { registerIcons } from './core/config/icons';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet />
    </ion-app>
  `,
})
export class App {
  constructor() {
    registerIcons();

    // Si ya hay sesión, refresca el usuario (por si un admin le cambió el rol).
    const auth = inject(AuthService);
    if (auth.isLoggedIn()) auth.refreshProfile().subscribe({ error: () => undefined });
  }
}
