import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-empty-state',
  imports: [IonIcon],
  template: `
    <ion-icon [name]="icon()" />
    <h3>{{ title() }}</h3>
    @if (message()) {
      <p>{{ message() }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 24px;
      gap: 8px;
    }
    ion-icon {
      font-size: 3.5rem;
      color: var(--app-surface-3);
    }
    h3 {
      margin: 0;
      font-weight: 900;
    }
    p {
      margin: 0;
      color: var(--app-text-muted);
      max-width: 320px;
    }
  `,
})
export class EmptyStateComponent {
  readonly icon = input('film-outline');
  readonly title = input.required<string>();
  readonly message = input('');
}
