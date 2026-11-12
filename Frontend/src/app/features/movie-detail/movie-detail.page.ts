import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSkeletonText,
  IonSpinner,
  IonTextarea,
  IonToolbar,
} from '@ionic/angular';
import { REVIEW_COMMENT, MEDIA_TYPE_LABEL } from '../../core/constants/app.constants';
import { Movie } from '../../core/models/movie.models';
import { Review, ReviewListFilters, ReviewerType } from '../../core/models/review.models';
import { AuthService } from '../../core/services/auth.service';
import { MovieService } from '../../core/services/movie.service';
import { ReviewService, reviewAuthorId } from '../../core/services/review.service';
import { UiService } from '../../core/services/ui.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { formatDate, formatDateTime, formatRuntime, formatScore, formatVotes } from '../../core/utils/format';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PosterComponent } from '../../shared/components/poster.component';
import { ScoreBadgeComponent } from '../../shared/components/score-badge.component';
import { ScoreInputComponent } from '../../shared/components/score-input.component';

type ReviewFilter = ReviewerType | 'all';
type ReviewOrder = 'recent' | 'oldest' | 'high' | 'low';

const REVIEW_ORDERS: Record<ReviewOrder, Pick<ReviewListFilters, 'sortBy' | 'order'>> = {
  recent: { sortBy: 'date', order: 'desc' },
  oldest: { sortBy: 'date', order: 'asc' },
  high: { sortBy: 'rating', order: 'desc' },
  low: { sortBy: 'rating', order: 'asc' },
};

const REVIEWS_PAGE_SIZE = 10;

@Component({
  selector: 'app-movie-detail',
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonIcon,
    IonChip,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    IonSkeletonText,
    PosterComponent,
    ScoreBadgeComponent,
    ScoreInputComponent,
    EmptyStateComponent,
  ],
  templateUrl: './movie-detail.page.html',
  styleUrl: './movie-detail.page.scss',
})
export class MovieDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movieService = inject(MovieService);
  private readonly reviewService = inject(ReviewService);
  private readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);

  private readonly movieId = this.route.snapshot.paramMap.get('id') ?? '';

  // ---- Estado de la película ----
  protected readonly movie = signal<Movie | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  // ---- Estado de las reseñas ----
  protected readonly reviews = signal<Review[]>([]);
  protected readonly reviewsTotal = signal(0);
  protected readonly reviewsHasMore = signal(false);
  protected readonly reviewsLoading = signal(false);
  protected readonly reviewFilter = signal<ReviewFilter>('all');
  protected readonly reviewOrder = signal<ReviewOrder>('recent');
  private reviewsPage = 1;

  // ---- Reseña propia ----
  protected readonly myReview = signal<Review | null>(null);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly draftRating = signal(7);
  protected readonly commentControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(REVIEW_COMMENT.MIN_LENGTH),
      Validators.maxLength(REVIEW_COMMENT.MAX_LENGTH),
    ],
  });
  protected readonly commentRules = REVIEW_COMMENT;

  protected readonly showForm = computed(() => this.myReview() === null || this.editing());
  protected readonly myReviewerLabel = computed(() => (this.auth.isCritic() ? 'Crítico' : 'Usuario'));

  protected readonly typeLabel = MEDIA_TYPE_LABEL;
  protected readonly formatDate = formatDate;
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatRuntime = formatRuntime;
  protected readonly formatScore = formatScore;
  protected readonly formatVotes = formatVotes;
  protected readonly authorId = reviewAuthorId;

  /** Ionic llama a este método cada vez que se entra a la página. */
  ionViewWillEnter(): void {
    this.loadMovie();
    this.loadReviews(true);
    this.loadMyReview();
  }

  // ---- Permisos de la UI (el backend vuelve a validarlos) ----
  protected isOwn(review: Review): boolean {
    return reviewAuthorId(review) === this.auth.user()?.id;
  }

  protected canDelete(review: Review): boolean {
    return this.isOwn(review) || this.auth.isAdmin();
  }

  protected authorName(review: Review): string {
    return typeof review.user === 'string' ? 'Usuario' : review.user.username;
  }

  // ---- Filtros de reseñas ----
  protected onFilter(event: Event): void {
    this.reviewFilter.set((event as CustomEvent<{ value: ReviewFilter }>).detail.value);
    this.loadReviews(true);
  }

  protected onOrder(event: Event): void {
    this.reviewOrder.set((event as CustomEvent<{ value: ReviewOrder }>).detail.value);
    this.loadReviews(true);
  }

  protected loadMoreReviews(): void {
    this.reviewsPage += 1;
    this.loadReviews(false);
  }

  // ---- Acciones sobre reseñas ----
  protected startEdit(): void {
    const mine = this.myReview();
    if (!mine) return;
    this.draftRating.set(mine.rating);
    this.commentControl.setValue(mine.comment);
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
    this.commentControl.reset('');
  }

  protected submitReview(): void {
    if (this.commentControl.invalid) {
      this.commentControl.markAsTouched();
      return;
    }

    const payload = { rating: this.draftRating(), comment: this.commentControl.value.trim() };
    const mine = this.myReview();
    const request$ = mine
      ? this.reviewService.update(mine.id, payload)
      : this.reviewService.create(this.movieId, payload);

    this.saving.set(true);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.commentControl.reset('');
        void this.ui.success(mine ? 'Reseña actualizada' : '¡Reseña publicada!');
        this.refreshAfterReviewChange();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }

  protected async deleteReview(review: Review): Promise<void> {
    const confirmed = await this.ui.confirm('Eliminar reseña', '¿Seguro que quieres eliminar esta reseña?', 'Eliminar');
    if (!confirmed) return;

    this.reviewService.remove(review.id).subscribe({
      next: () => {
        void this.ui.success('Reseña eliminada');
        this.refreshAfterReviewChange();
      },
      error: (error: unknown) => void this.ui.error(getErrorMessage(error)),
    });
  }

  protected async deleteMovie(): Promise<void> {
    const movie = this.movie();
    if (!movie) return;

    const confirmed = await this.ui.confirm(
      'Eliminar película',
      `Se borrará "${movie.title}" y todas sus reseñas.`,
      'Eliminar',
    );
    if (!confirmed) return;

    this.movieService.remove(movie.id).subscribe({
      next: () => {
        void this.ui.success('Película eliminada');
        void this.router.navigateByUrl('/tabs/catalog', { replaceUrl: true });
      },
      error: (error: unknown) => void this.ui.error(getErrorMessage(error)),
    });
  }

  // ---- Carga de datos ----
  private refreshAfterReviewChange(): void {
    this.loadMovie(); // los promedios cambian
    this.loadReviews(true);
    this.loadMyReview();
  }

  private loadMovie(): void {
    this.movieService.getById(this.movieId).subscribe({
      next: (movie) => {
        this.movie.set(movie);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.notFound.set(true);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }

  private loadMyReview(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.reviewService.findUserReviewForMovie(userId, this.movieId).subscribe({
      next: (review) => this.myReview.set(review),
      error: () => undefined,
    });
  }

  private loadReviews(replace: boolean): void {
    if (replace) this.reviewsPage = 1;
    this.reviewsLoading.set(true);

    const reviewerType = this.reviewFilter();
    const filters: ReviewListFilters = {
      ...REVIEW_ORDERS[this.reviewOrder()],
      ...(reviewerType !== 'all' && { reviewerType }),
      page: this.reviewsPage,
      limit: REVIEWS_PAGE_SIZE,
    };

    this.reviewService.listByMovie(this.movieId, filters).subscribe({
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
