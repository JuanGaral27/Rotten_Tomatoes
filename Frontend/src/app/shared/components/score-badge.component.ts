import { Component, computed, input } from '@angular/core';
import { formatScore } from '../../core/utils/format';

/** Círculo con un puntaje y una etiqueta (ej: "Usuarios · 12 reseñas"). */
@Component({
  selector: 'app-score-badge',
  template: `
    <div class="ring" [class.empty]="score() === null && valueText() === null" [style.--ring-color]="color()">
      <span class="value">{{ text() }}</span>
    </div>
    <span class="label">{{ label() }}</span>
    @if (caption()) {
      <span class="caption">{{ caption() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 72px;
    }
    .ring {
      --ring-color: var(--app-orange);
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 4px solid var(--ring-color);
      display: grid;
      place-items: center;
      background: var(--app-surface);
    }
    .ring.empty {
      border-color: var(--app-surface-3);
    }
    .value {
      font-size: 1.15rem;
      font-weight: 900;
    }
    .label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .caption {
      font-size: 0.7rem;
      color: var(--app-text-muted);
    }
  `,
})
export class ScoreBadgeComponent {
  readonly score = input<number | null>(null);
  readonly label = input.required<string>();
  readonly caption = input<string>('');
  /** Texto a mostrar en vez del puntaje (ej: "87%"). */
  readonly valueText = input<string | null>(null);
  readonly color = input('var(--app-orange)');
  protected readonly text = computed(() => this.valueText() ?? formatScore(this.score()));
}
