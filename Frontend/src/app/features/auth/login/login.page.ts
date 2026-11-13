import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMAIL, PASSWORD } from '../../../core/constants/app.constants';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
} from '@ionic/angular';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { UiService } from '../../../core/services/ui.service';
import { getErrorMessage } from '../../../core/utils/error-message';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner],
  templateUrl: './login.page.html',
  styleUrl: '../auth.page.scss',
})
export class LoginPage {
  protected readonly emailRules = EMAIL;
  protected readonly passwordRules = PASSWORD;
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);

  protected readonly appName = environment.appName;
  protected readonly loading = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.maxLength(EMAIL.MAX_LENGTH), Validators.pattern(EMAIL.PATTERN)]],
    password: ['', [Validators.required, Validators.maxLength(PASSWORD.MAX_LENGTH)]],
  });

  protected submit(): void {
    // Evita el doble envío (doble toque, o Enter del teclado + botón).
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.loading.set(false);
        void this.ui.success(`¡Hola, ${user.username}!`);
        void this.router.navigateByUrl('/tabs/catalog', { replaceUrl: true });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }
}
