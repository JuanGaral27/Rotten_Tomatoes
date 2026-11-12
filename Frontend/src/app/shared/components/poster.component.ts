import { Component, input, signal } from '@angular/core';
import { IonIcon } from '@ionic/angular';

/** Carátula con imagen de respaldo si no hay póster o falla la carga. */
@Component({
  selector: 'app-poster',
  imports: [IonIcon],
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="alt()" loading="lazy" (error)="failed.set(true)" />
    } @else {
      <div class="fallback"><ion-icon name="film" /></div>
    }
  `,
  styles: `
    :host {
      display: block;
      aspect-ratio: 2 / 3;
      background: var(--app-surface-2);
      overflow: hidden;
      border-radius: var(--app-radius);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .fallback {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      font-size: 2.5rem;
      color: var(--app-surface-3);
    }
  `,
})
export class PosterComponent {
  readonly src = input<string | null>(null);
  readonly alt = input('Carátula');
  protected readonly failed = signal(false);
}
