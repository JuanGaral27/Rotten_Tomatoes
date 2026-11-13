import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonRange,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { MEDIA_TYPE_OPTIONS, RATING_SOURCE_OPTIONS, SCORE, SEARCH_TEXT } from '../../core/constants/app.constants';
import { MediaType, MovieFilters, RatingSource } from '../../core/models/movie.models';

type TypeChoice = MediaType | 'all';

/** Panel de filtros del catálogo. Edita una copia y solo aplica al pulsar "Aplicar". */
@Component({
  selector: 'app-catalog-filters',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonChip,
    IonInput,
    IonRange,
  ],
  templateUrl: './catalog-filters.component.html',
  styleUrl: './catalog-filters.component.scss',
})
export class CatalogFiltersComponent {
  protected readonly searchRules = SEARCH_TEXT;
  /** Filtros actuales (solo se leen al abrir el panel). */
  readonly filters = input.required<MovieFilters>();
  readonly genres = input<string[]>([]);

  readonly apply = output<MovieFilters>();
  readonly dismiss = output<void>();

  protected readonly typeOptions = MEDIA_TYPE_OPTIONS;
  protected readonly sourceOptions = RATING_SOURCE_OPTIONS;
  protected readonly score = SCORE;

  protected readonly type = signal<TypeChoice>('all');
  protected readonly selectedGenres = signal<string[]>([]);
  protected readonly ratingSource = signal<RatingSource>('imdb');
  protected readonly ratingRange = signal<{ lower: number; upper: number }>({ lower: SCORE.MIN, upper: SCORE.MAX });
  protected actor = '';
  protected year = '';
  protected releasedFrom = '';
  protected releasedTo = '';

  protected readonly ratingLabel = computed(() => `${this.ratingRange().lower} – ${this.ratingRange().upper}`);

  ngOnInit(): void {
    const f = this.filters();
    this.type.set(f.type ?? 'all');
    this.selectedGenres.set(f.genre ?? []);
    this.ratingSource.set(f.ratingSource ?? 'imdb');
    this.ratingRange.set({ lower: f.minRating ?? SCORE.MIN, upper: f.maxRating ?? SCORE.MAX });
    this.actor = f.actor ?? '';
    this.year = f.year ? String(f.year) : '';
    this.releasedFrom = f.releasedFrom ?? '';
    this.releasedTo = f.releasedTo ?? '';
  }

  protected toggleGenre(genre: string): void {
    this.selectedGenres.update((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
    );
  }

  protected onTypeChange(event: Event): void {
    this.type.set((event as CustomEvent<{ value: TypeChoice }>).detail.value);
  }

  protected onSourceChange(event: Event): void {
    this.ratingSource.set((event as CustomEvent<{ value: RatingSource }>).detail.value);
  }

  protected onRangeChange(event: Event): void {
    const value = (event as CustomEvent<{ value: { lower: number; upper: number } | number }>).detail.value;
    if (typeof value !== 'number') this.ratingRange.set(value);
  }

  protected reset(): void {
    this.type.set('all');
    this.selectedGenres.set([]);
    this.ratingSource.set('imdb');
    this.ratingRange.set({ lower: SCORE.MIN, upper: SCORE.MAX });
    this.actor = '';
    this.year = '';
    this.releasedFrom = '';
    this.releasedTo = '';
  }

  protected submit(): void {
    const { lower, upper } = this.ratingRange();
    const ratingActive = lower > SCORE.MIN || upper < SCORE.MAX;
    const year = Number(this.year);

    // Conserva el orden elegido en la pantalla y reemplaza solo los filtros.
    const next: MovieFilters = {
      q: this.filters().q,
      sortBy: this.filters().sortBy,
      order: this.filters().order,
      ratingSource: this.ratingSource(),
      ...(this.type() !== 'all' && { type: this.type() as MediaType }),
      ...(this.selectedGenres().length > 0 && { genre: this.selectedGenres() }),
      ...(this.actor.trim() && { actor: this.actor.trim() }),
      ...(Number.isInteger(year) && year > 0 && { year }),
      ...(this.releasedFrom && { releasedFrom: this.releasedFrom }),
      ...(this.releasedTo && { releasedTo: this.releasedTo }),
      ...(ratingActive && { minRating: lower, maxRating: upper }),
    };
    this.apply.emit(next);
  }
}
