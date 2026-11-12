import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

/** Avisos y confirmaciones reutilizables (así las pantallas no repiten código de Ionic). */
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  async toast(message: string, color: 'success' | 'danger' | 'medium' = 'medium'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 3000,
      position: 'bottom',
      cssClass: 'app-toast',
    });
    await toast.present();
  }

  success(message: string): Promise<void> {
    return this.toast(message, 'success');
  }

  error(message: string): Promise<void> {
    return this.toast(message, 'danger');
  }

  async confirm(header: string, message: string, confirmText = 'Confirmar'): Promise<boolean> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: confirmText, role: 'confirm', cssClass: 'alert-danger-button' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }
}
