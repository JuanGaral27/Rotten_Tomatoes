import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { Movie } from '../../core/models/movie.models';
import { formatScore } from '../../core/utils/format';
import { PosterComponent } from './poster.component';

/** Tarjeta de una película/serie para el catálogo (carátula + título + puntajes). */
@Component({
  selector: 'app-movie-card',
  imports: [RouterLink, IonIcon, PosterComponent],
  template: `
    <a [routerLink]="['/movie', movie().id]">
      <app-poster [src]="movie().poster" [alt]="movie().title" />
      <div class="info">
        <h3 class="title">{{ movie().title }}</h3>
        <span class="muted year">{{ movie().year ?? '' }}</span>
        <div class="scores">
          <span class="score user" title="Usuarios"><ion-icon name="people" /> {{ userScore() }}</span>
          <span class="score critic" title="Críticos"><ion-icon name="ribbon-outline" /> {{ criticScore() }}</span>
          <span class="score imdb" title="IMDb"><ion-icon name="star" /> {{ imdbScore() }}</span>
        </div>
      </div>
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    a {
      display: block;
      color: inherit;
      text-decoration: none;
    }
    .info {
      padding: 8px 2px 0;
    }
    .title {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 700;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .year {
      font-size: 0.78rem;
    }
    .scores {
      display: flex;
      gap: 10px;
      margin-top: 4px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .score {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .user ion-icon {
      color: var(--app-score-user);
    }
    .critic ion-icon {
      color: var(--app-score-critic);
    }
    .imdb ion-icon {
      color: #f5c518;
    }
  `,
})
export class MovieCardComponent {
  readonly movie = input.required<Movie>();
  protected readonly userScore = computed(() => formatScore(this.movie().ratings.user.average));
  protected readonly criticScore = computed(() => formatScore(this.movie().ratings.critic.average));
  protected readonly imdbScore = computed(() => formatScore(this.movie().externalRatings.imdb.rating));
}
