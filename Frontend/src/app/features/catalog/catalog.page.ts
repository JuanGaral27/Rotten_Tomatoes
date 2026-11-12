import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent, SearchbarCustomEvent } from '@ionic/angular';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DEFAULT_SORT, PAGE_SIZE, RATING_SOURCE_OPTIONS, SORT_OPTIONS } from '../../core/constants/app.constants';
import { Movie, MovieFilters, MovieSortBy, RatingSource } from '../../core/models/movie.models';
import { MovieService } from '../../core/services/movie.service';
import { UiService } from '../../core/services/ui.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { MovieCardComponent } from '../../shared/components/movie-card.component';
import { CatalogFiltersComponent } from './catalog-filters.component';

const FILTER_KEYS: (keyof MovieFilters)[] = [
  'genre',
  'type',
  'actor',
  'year',
  'releasedFrom',
  'releasedTo',
  'minRating',
  'maxRating',
];

@Component({
  selector: 'app-catalog',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSkeletonText,
    MovieCardComponent,
    EmptyStateComponent,
    CatalogFiltersComponent,
  ],
  templateUrl: './catalog.page.html',
  styleUrl: './catalog.page.scss',
})
export class CatalogPage implements OnDestroy {
  private readonly movieService = inject(MovieService);
  private readonly ui = inject(UiService);

  protected readonly appName = environment.appName;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly sourceOptions = RATING_SOURCE_OPTIONS;
  protected readonly skeletons = Array.from({ length: 6 });

  protected readonly filters = signal<MovieFilters>({ ...DEFAULT_SORT, ratingSource: 'imdb' });
  protected readonly genres = signal<string[]>([]);
  protected readonly movies = signal<Movie[]>([]);
  protected readonly total = signal(0);
  protected readonly hasMore = signal(false);
  protected readonly loading = signal(false);
  protected readonly filtersOpen = signal(false);

  protected readonly activeFilterCount = computed(
    () => FILTER_KEYS.filter((key) => {
      const value = this.filters()[key];
      return Array.isArray(value) ? value.length > 0 : value !== undefined;
    }).length,
  );
  protected readonly showSourcePicker = computed(() => this.filters().sortBy === 'rating');

  private page = 1;
  private subscription?: Subscription;

  /** Se ejecuta cada vez que se entra a la pestaña (así se ven los puntajes recién actualizados). */
  ionViewWillEnter(): void {
    this.reload();
    this.movieService.genres().subscribe({ next: (genres) => this.genres.set(genres), error: () => undefined });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // ---- Acciones de la pantalla ----
  protected onSearch(event: SearchbarCustomEvent): void {
    const q = (event.detail.value ?? '').trim();
    this.filters.update((current) => ({ ...current, q: q || undefined }));
    this.reload();
  }

  protected onSortBy(event: Event): void {
    const sortBy = (event as CustomEvent<{ value: MovieSortBy }>).detail.value;
    if (sortBy === this.filters().sortBy) return;
    // Al cambiar el criterio, usa su orden natural (puntaje/fecha: mayor primero; título: A-Z).
    this.filters.update((current) => ({ ...current, sortBy, order: sortBy === 'title' ? 'asc' : 'desc' }));
    this.reload();
  }

  protected onSource(event: Event): void {
    const ratingSource = (event as CustomEvent<{ value: RatingSource }>).detail.value;
    if (ratingSource === this.filters().ratingSource) return;
    this.filters.update((current) => ({ ...current, ratingSource }));
    this.reload();
  }

  protected toggleOrder(): void {
    this.filters.update((current) => ({ ...current, order: current.order === 'asc' ? 'desc' : 'asc' }));
    this.reload();
  }

  protected applyFilters(next: MovieFilters): void {
    this.filters.set(next);
    this.filtersOpen.set(false);
    this.reload();
  }

  protected refresh(event: RefresherCustomEvent): void {
    this.reload(() => void event.target.complete());
  }

  protected loadMore(event: InfiniteScrollCustomEvent): void {
    this.page += 1;
    this.fetch(false, () => void event.target.complete());
  }

  // ---- Carga de datos ----
  private reload(done?: () => void): void {
    this.page = 1;
    this.fetch(true, done);
  }

  private fetch(replace: boolean, done?: () => void): void {
    this.subscription?.unsubscribe();
    this.loading.set(true);

    this.subscription = this.movieService.list(this.filters(), this.page, PAGE_SIZE).subscribe({
      next: ({ items, pagination }) => {
        this.movies.update((current) => (replace ? items : [...current, ...items]));
        this.total.set(pagination.total);
        this.hasMore.set(pagination.hasNextPage);
        this.loading.set(false);
        done?.();
      },
      error: (error: unknown) => {
        this.loading.set(false);
        void this.ui.error(getErrorMessage(error));
        done?.();
      },
    });
  }
}
