import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { InfiniteScrollCustomEvent, SearchbarCustomEvent } from '@ionic/angular';
import {
  IonBadge,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import {
  MEDIA_TYPE_LABEL,
  MEDIA_TYPE_OPTIONS,
  POPULAR_SORT,
  PAGE_SIZE,
  SEARCH_TEXT,
} from '../../core/constants/app.constants';
import { ExternalMovie, MediaType, Movie } from '../../core/models/movie.models';
import { MovieService } from '../../core/services/movie.service';
import { UiService } from '../../core/services/ui.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { MovieCardComponent } from '../../shared/components/movie-card.component';
import { PosterComponent } from '../../shared/components/poster.component';

type TypeChoice = MediaType | 'all';

/**
 * Explorar. Sin texto: muestra las películas más populares de NUESTRA base de datos con una barra de categorías.
 * Con texto: busca películas/series REALES en OMDb; al abrir una, el backend la guarda si no la tenía.
 */
import { SearchbarMaxLengthDirective } from '../../shared/directives/shared/directives/searchbar-max-length.directive';
@Component({
  selector: 'app-discover',
  imports: [
    SearchbarMaxLengthDirective,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    EmptyStateComponent,
    PosterComponent,
    MovieCardComponent,
  ],
  templateUrl: './discover.page.html',
  styleUrl: './discover.page.scss',
})
export class DiscoverPage implements OnInit, OnDestroy {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);

  protected readonly typeOptions = MEDIA_TYPE_OPTIONS;
  protected readonly typeLabel = MEDIA_TYPE_LABEL;
  protected readonly searchRules = SEARCH_TEXT;

  // ---- Modo "populares" (base de datos propia) ----
  protected readonly genres = signal<string[]>([]);
  protected readonly genre = signal<string | null>(null);
  protected readonly popular = signal<Movie[]>([]);
  protected readonly popularLoading = signal(false);
  protected readonly popularHasMore = signal(false);
  protected readonly popularError = signal(false);
  private popularPage = 1;
  private popularSub?: Subscription;

  protected readonly query = signal('');
  protected readonly type = signal<TypeChoice>('all');
  protected readonly results = signal<ExternalMovie[]>([]);
  protected readonly total = signal(0);
  protected readonly hasMore = signal(false);
  protected readonly searching = signal(false);
  protected readonly searched = signal(false);
  protected readonly openingId = signal<string | null>(null);

  protected readonly isSearching = computed(() => this.query().length > 0);

  private page = 1;
  private subscription?: Subscription;

  ngOnInit(): void {
    this.movieService.genres().subscribe({
      next: (list) => this.genres.set(list),
      error: () => this.genres.set([]),
    });
    this.loadPopular(true);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.popularSub?.unsubscribe();
  }

  protected selectGenre(value: string | null): void {
    if (this.genre() === value) return;
    this.genre.set(value);
    this.loadPopular(true);
  }

  protected onSearch(event: SearchbarCustomEvent): void {
    this.query.set((event.detail.value ?? '').slice(0, SEARCH_TEXT.MAX_LENGTH).trim());
    this.search();
  }

  protected onTypeChange(event: Event): void {
    this.type.set((event as CustomEvent<{ value: TypeChoice }>).detail.value);
    if (this.query()) this.search();
    else this.loadPopular(true);
  }

  protected loadMore(event: InfiniteScrollCustomEvent): void {
    const done = () => void event.target.complete();
    if (this.isSearching()) {
      this.page += 1;
      this.fetch(false, done);
    } else {
      this.popularPage += 1;
      this.loadPopular(false, done);
    }
  }

  protected retryPopular(): void {
    this.loadPopular(true);
  }

  /** Abre la película: si ya está guardada navega directo; si no, el backend la importa primero. */
  protected open(item: ExternalMovie): void {
    if (this.openingId()) return;

    if (item.inDatabase && item.movieId) {
      void this.router.navigate(['/movie', item.movieId]);
      return;
    }

    this.openingId.set(item.imdbId);
    this.movieService.importByImdbId(item.imdbId).subscribe({
      next: ({ movie, created }) => {
        this.openingId.set(null);
        // Marca el resultado como guardado para no volver a importarlo.
        this.results.update((list) =>
          list.map((entry) => (entry.imdbId === item.imdbId ? { ...entry, inDatabase: true, movieId: movie.id } : entry)),
        );
        if (created) void this.ui.success(`"${movie.title}" se guardó en tu base de datos`);
        void this.router.navigate(['/movie', movie.id]);
      },
      error: (error: unknown) => {
        this.openingId.set(null);
        void this.ui.error(getErrorMessage(error));
      },
    });
  }

  /** Carga las películas más votadas de la BD (filtradas por categoría y tipo si hay). */
  private loadPopular(replace: boolean, done?: () => void): void {
    if (replace) this.popularPage = 1;
    this.popularSub?.unsubscribe();
    this.popularLoading.set(true);
    this.popularError.set(false);

    const genre = this.genre();
    const type = this.type();
    this.popularSub = this.movieService
      .list({ ...POPULAR_SORT, ...(genre && { genre: [genre] }), ...(type !== 'all' && { type }) }, this.popularPage, PAGE_SIZE)
      .subscribe({
        next: ({ items, pagination }) => {
          this.popular.update((current) => (replace ? items : [...current, ...items]));
          this.popularHasMore.set(pagination.hasNextPage);
          this.popularLoading.set(false);
          done?.();
        },
        error: (error: unknown) => {
          if (replace) this.popular.set([]);
          this.popularHasMore.set(false);
          this.popularError.set(true);
          this.popularLoading.set(false);
          void this.ui.error(getErrorMessage(error));
          done?.();
        },
      });
  }

  private search(): void {
    this.page = 1;
    if (!this.query()) {
      this.subscription?.unsubscribe();
      this.results.set([]);
      this.searched.set(false);
      this.searching.set(false);
      return;
    }
    this.fetch(true);
  }

  private fetch(replace: boolean, done?: () => void): void {
    this.subscription?.unsubscribe();
    this.searching.set(true);

    const type = this.type();
    this.subscription = this.movieService
      .searchExternal({ q: this.query(), ...(type !== 'all' && { type }) }, this.page)
      .subscribe({
        next: ({ items, pagination }) => {
          this.results.update((current) => (replace ? items : [...current, ...items]));
          this.total.set(pagination.total);
          this.hasMore.set(pagination.hasNextPage);
          this.searched.set(true);
          this.searching.set(false);
          done?.();
        },
        error: (error: unknown) => {
          this.searching.set(false);
          this.searched.set(true);
          void this.ui.error(getErrorMessage(error));
          done?.();
        },
      });
  }
}
