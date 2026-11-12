import { Component, OnDestroy, inject, signal } from '@angular/core';
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
import { MEDIA_TYPE_LABEL, MEDIA_TYPE_OPTIONS } from '../../core/constants/app.constants';
import { ExternalMovie, MediaType } from '../../core/models/movie.models';
import { MovieService } from '../../core/services/movie.service';
import { UiService } from '../../core/services/ui.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PosterComponent } from '../../shared/components/poster.component';

type TypeChoice = MediaType | 'all';

/** Busca películas/series REALES en OMDb. Al abrir una, el backend la guarda en nuestra BD si no la tenía. */
@Component({
  selector: 'app-discover',
  imports: [
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
  ],
  templateUrl: './discover.page.html',
  styleUrl: './discover.page.scss',
})
export class DiscoverPage implements OnDestroy {
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);
  private readonly ui = inject(UiService);

  protected readonly typeOptions = MEDIA_TYPE_OPTIONS;
  protected readonly typeLabel = MEDIA_TYPE_LABEL;

  protected readonly query = signal('');
  protected readonly type = signal<TypeChoice>('all');
  protected readonly results = signal<ExternalMovie[]>([]);
  protected readonly total = signal(0);
  protected readonly hasMore = signal(false);
  protected readonly searching = signal(false);
  protected readonly searched = signal(false);
  protected readonly openingId = signal<string | null>(null);

  private page = 1;
  private subscription?: Subscription;

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  protected onSearch(event: SearchbarCustomEvent): void {
    this.query.set((event.detail.value ?? '').trim());
    this.search();
  }

  protected onTypeChange(event: Event): void {
    this.type.set((event as CustomEvent<{ value: TypeChoice }>).detail.value);
    if (this.query()) this.search();
  }

  protected loadMore(event: InfiniteScrollCustomEvent): void {
    this.page += 1;
    this.fetch(false, () => void event.target.complete());
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
