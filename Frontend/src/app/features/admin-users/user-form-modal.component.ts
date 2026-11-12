import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { PASSWORD, ROLE_OPTIONS, USERNAME } from '../../core/constants/app.constants';
import { Role, UpdateUserPayload, User } from '../../core/models/user.models';
import { UiService } from '../../core/services/ui.service';
import { UserService } from '../../core/services/user.service';
import { getErrorMessage } from '../../core/utils/error-message';

/** Formulario (modal) para crear o editar un usuario. Devuelve el usuario guardado al cerrarse. */
@Component({
  selector: 'app-user-form-modal',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEdit ? 'Editar usuario' : 'Nuevo usuario' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div>
          <ion-input formControlName="username" label="Nombre de usuario" labelPlacement="floating" fill="outline" />
          @if (form.controls.username.touched && form.controls.username.invalid) {
            <p class="form-error">{{ rules.MIN_LENGTH }}-{{ rules.MAX_LENGTH }} caracteres (letras, números, . - _)</p>
          }
        </div>
        <div>
          <ion-input type="email" formControlName="email" label="Correo electrónico" labelPlacement="floating" fill="outline" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="form-error">Ingresa un correo válido</p>
          }
        </div>
        <div>
          <ion-input
            type="password"
            formControlName="password"
            [label]="isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'"
            labelPlacement="floating"
            fill="outline"
            autocomplete="new-password"
          />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="form-error">Mínimo {{ passwordRules.MIN_LENGTH }} caracteres</p>
          }
        </div>
        <ion-select formControlName="role" label="Rol" labelPlacement="floating" fill="outline" interface="popover">
          @for (option of roles; track option.value) {
            <ion-select-option [value]="option.value">{{ option.label }}</ion-select-option>
          }
        </ion-select>

        <ion-button type="submit" expand="block" [disabled]="saving()">
          @if (saving()) {
            <ion-spinner name="crescent" />
          } @else {
            {{ isEdit ? 'Guardar cambios' : 'Crear usuario' }}
          }
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    ion-input,
    ion-select {
      --background: var(--app-surface-2);
      --border-color: var(--app-border);
      --highlight-color-focused: var(--app-orange);
      --border-radius: var(--app-radius);
    }
  `,
})
export class UserFormModalComponent implements OnInit {
  /**
   * Si viene un usuario, el formulario edita; si no, crea.
   * Es un @Input clásico (no signal) porque ModalController asigna `componentProps` como valores planos.
   */
  @Input() user: User | null = null;

  private readonly fb = inject(FormBuilder).nonNullable;
  // OJO: no llamarlo `modal`: Ionic reserva ese nombre en componentes que se abren con ModalController.
  private readonly modalController = inject(ModalController);
  private readonly userService = inject(UserService);
  private readonly ui = inject(UiService);

  protected readonly roles = ROLE_OPTIONS;
  protected readonly rules = USERNAME;
  protected readonly passwordRules = PASSWORD;
  protected readonly saving = signal(false);
  protected get isEdit(): boolean {
    return this.user !== null;
  }

  protected readonly form = this.fb.group({
    username: [
      '',
      [Validators.required, Validators.minLength(USERNAME.MIN_LENGTH), Validators.maxLength(USERNAME.MAX_LENGTH), Validators.pattern(USERNAME.PATTERN)],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(PASSWORD.MIN_LENGTH), Validators.maxLength(PASSWORD.MAX_LENGTH)]],
    role: this.fb.control<Role>('user'),
  });

  ngOnInit(): void {
    const user = this.user;
    if (user) {
      this.form.patchValue({ username: user.username, email: user.email, role: user.role });
    } else {
      // Al crear, la contraseña es obligatoria.
      this.form.controls.password.addValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  protected close(saved?: User): void {
    void this.modalController.dismiss(saved ?? null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, email, password, role } = this.form.getRawValue();
    const current = this.user;
    this.saving.set(true);

    const request$ = current
      ? this.userService.update(current.id, this.changesFrom(current, { username, email, password, role }))
      : this.userService.create({ username, email, password, role });

    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        void this.ui.success(current ? 'Usuario actualizado' : 'Usuario creado');
        this.close(saved);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }

  private changesFrom(
    current: User,
    next: { username: string; email: string; password: string; role: Role },
  ): UpdateUserPayload {
    return {
      ...(next.username !== current.username && { username: next.username }),
      ...(next.email !== current.email && { email: next.email }),
      ...(next.role !== current.role && { role: next.role }),
      ...(next.password && { password: next.password }),
    };
  }
}
