import { Component, inject } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="catalog">
          <ion-icon name="home" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="discover">
          <ion-icon name="compass" />
          <ion-label>Explorar</ion-label>
        </ion-tab-button>

        @if (auth.isAdmin()) {
          <ion-tab-button tab="admin">
            <ion-icon name="people" />
            <ion-label>Usuarios</ion-label>
          </ion-tab-button>
        }

        <ion-tab-button tab="profile">
          <ion-icon name="person" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  protected readonly auth = inject(AuthService);
}
