import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
} from '@ionic/angular';
import { environment } from '../../../../environments/environment';
import { PASSWORD, USERNAME } from '../../../core/constants/app.constants';
import { AuthService } from '../../../core/services/auth.service';
import { UiService } from '../../../core/services/ui.service';
import { getErrorMessage } from '../../../core/utils/error-message';

const passwordsMatch = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner],
  templateUrl: './register.page.html',
  styleUrl: '../auth.page.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);

  protected readonly appName = environment.appName;
  protected readonly usernameRules = USERNAME;
  protected readonly passwordRules = PASSWORD;
  protected readonly loading = signal(false);

  protected readonly form = this.fb.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(USERNAME.MIN_LENGTH),
          Validators.maxLength(USERNAME.MAX_LENGTH),
          Validators.pattern(USERNAME.PATTERN),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(PASSWORD.MIN_LENGTH), Validators.maxLength(PASSWORD.MAX_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.register({ username, email, password }).subscribe({
      next: (user) => {
        this.loading.set(false);
        void this.ui.success(`¡Bienvenido, ${user.username}!`);
        void this.router.navigateByUrl('/tabs/catalog', { replaceUrl: true });
      },
      error: (error: unknown) => {
        this.loading.set(false);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }
}
