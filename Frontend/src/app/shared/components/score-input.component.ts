import { Component, model } from '@angular/core';
import { IonIcon, IonRange } from '@ionic/angular';
import { SCORE } from '../../core/constants/app.constants';
import { formatScore } from '../../core/utils/format';

/** Selector de puntaje 0-10 (de 0.5 en 0.5). Se usa con [(value)]. */
@Component({
  selector: 'app-score-input',
  imports: [IonRange, IonIcon],
  template: `
    <div class="head">
      <ion-icon name="star" />
      <span class="number">{{ format(value()) }}</span>
      <span class="max muted">/ 10</span>
    </div>
    <ion-range
      [min]="min"
      [max]="max"
      [step]="step"
      [snaps]="true"
      [ticks]="false"
      [value]="value()"
      (ionInput)="onChange($event)"
      aria-label="Puntaje"
    />
  `,
  styles: `
    .head {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    ion-icon {
      color: var(--app-orange);
      align-self: center;
      font-size: 1.4rem;
    }
    .number {
      font-size: 2rem;
      font-weight: 900;
    }
    ion-range {
      --bar-background-active: var(--app-orange);
      --knob-background: var(--app-orange);
      padding-inline: 0;
    }
  `,
})
export class ScoreInputComponent {
  readonly value = model(7);
  protected readonly min = SCORE.MIN;
  protected readonly max = SCORE.MAX;
  protected readonly step = SCORE.STEP;
  protected readonly format = formatScore;

  protected onChange(event: Event): void {
    const detail = (event as CustomEvent<{ value: number | { lower: number; upper: number } }>).detail;
    if (typeof detail.value === 'number') this.value.set(detail.value);
  }
}
