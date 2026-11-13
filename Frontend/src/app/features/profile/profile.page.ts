import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { EMAIL, PASSWORD, ROLE_LABEL, USERNAME } from '../../core/constants/app.constants';
import { Review } from '../../core/models/review.models';
import { UpdateUserPayload } from '../../core/models/user.models';
import { AuthService } from '../../core/services/auth.service';
import { ReviewService } from '../../core/services/review.service';
import { UiService } from '../../core/services/ui.service';
import { UserService } from '../../core/services/user.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { formatDateTime, formatScore } from '../../core/utils/format';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PosterComponent } from '../../shared/components/poster.component';

type ProfileTab = 'reviews' | 'account';
const PAGE_SIZE = 10;

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon,
    IonInput,
    IonInputPasswordToggle,
    IonSpinner,
    EmptyStateComponent,
    PosterComponent,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly reviewService = inject(ReviewService);
  private readonly ui = inject(UiService);

  protected readonly user = this.auth.user;
  protected readonly roleLabel = computed(() => ROLE_LABEL[this.user()?.role ?? 'user']);
  protected readonly initial = computed(() => (this.user()?.username ?? '?').charAt(0).toUpperCase());
  protected readonly usernameRules = USERNAME;
  protected readonly passwordRules = PASSWORD;
  protected readonly emailRules = EMAIL;
  protected readonly formatScore = formatScore;
  protected readonly formatDateTime = formatDateTime;

  protected readonly tab = signal<ProfileTab>('reviews');
  protected readonly saving = signal(false);

  protected readonly reviews = signal<Review[]>([]);
  protected readonly reviewsTotal = signal(0);
  protected readonly reviewsHasMore = signal(false);
  protected readonly reviewsLoading = signal(false);
  private reviewsPage = 1;

  protected readonly form = this.fb.group({
    username: [
      '',
      [Validators.required, Validators.minLength(USERNAME.MIN_LENGTH), Validators.maxLength(USERNAME.MAX_LENGTH), Validators.pattern(USERNAME.PATTERN)],
    ],
    email: ['', [Validators.required, Validators.maxLength(EMAIL.MAX_LENGTH), Validators.pattern(EMAIL.PATTERN)]],
    // Opcional: solo se valida/envía si el usuario escribe una nueva.
    password: ['', [Validators.minLength(PASSWORD.MIN_LENGTH), Validators.maxLength(PASSWORD.MAX_LENGTH)]],
  });

  ionViewWillEnter(): void {
    this.auth.refreshProfile().subscribe({
      next: (user) => this.form.patchValue({ username: user.username, email: user.email }),
      error: () => undefined,
    });
    const user = this.user();
    if (user) this.form.patchValue({ username: user.username, email: user.email });
    this.loadReviews(true);
  }

  protected onTab(event: Event): void {
    this.tab.set((event as CustomEvent<{ value: ProfileTab }>).detail.value);
  }

  protected movieOf(review: Review) {
    return typeof review.movie === 'string' ? null : review.movie;
  }

  protected loadMore(): void {
    this.reviewsPage += 1;
    this.loadReviews(false);
  }

  protected save(): void {
    // Evita el doble envío (doble toque, o Enter del teclado + botón).
    if (this.saving()) return;

    const user = this.user();
    if (!user) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Solo se envía lo que cambió.
    const { username, email, password } = this.form.getRawValue();
    const changes: UpdateUserPayload = {
      ...(username !== user.username && { username }),
      ...(email !== user.email && { email }),
      ...(password && { password }),
    };
    if (Object.keys(changes).length === 0) {
      void this.ui.toast('No hay cambios para guardar');
      return;
    }

    this.saving.set(true);
    this.userService.update(user.id, changes).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.auth.setUser(updated);
        this.form.patchValue({ password: '' });
        void this.ui.success('Perfil actualizado');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }

  protected async deleteReview(review: Review): Promise<void> {
    if (!(await this.ui.confirm('Eliminar reseña', '¿Seguro que quieres eliminar esta reseña?', 'Eliminar'))) return;

    this.reviewService.remove(review.id).subscribe({
      next: () => {
        void this.ui.success('Reseña eliminada');
        this.loadReviews(true);
      },
      error: (error: unknown) => void this.ui.error(getErrorMessage(error)),
    });
  }

  protected logout(): void {
    this.auth.logout();
  }

  protected async deleteAccount(): Promise<void> {
    const user = this.user();
    if (!user) return;

    const confirmed = await this.ui.confirm(
      'Eliminar cuenta',
      'Se borrará tu cuenta y todas tus reseñas. Esta acción no se puede deshacer.',
      'Eliminar mi cuenta',
    );
    if (!confirmed) return;

    this.userService.remove(user.id).subscribe({
      next: () => {
        void this.ui.success('Cuenta eliminada');
        this.auth.logout();
      },
      error: (error: unknown) => void this.ui.error(getErrorMessage(error)),
    });
  }

  private loadReviews(replace: boolean): void {
    const userId = this.user()?.id;
    if (!userId) return;
    if (replace) this.reviewsPage = 1;

    this.reviewsLoading.set(true);
    this.reviewService.listByUser(userId, this.reviewsPage, PAGE_SIZE).subscribe({
      next: ({ items, pagination }) => {
        this.reviews.update((current) => (replace ? items : [...current, ...items]));
        this.reviewsTotal.set(pagination.total);
        this.reviewsHasMore.set(pagination.hasNextPage);
        this.reviewsLoading.set(false);
      },
      error: (error: unknown) => {
        this.reviewsLoading.set(false);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }
}
