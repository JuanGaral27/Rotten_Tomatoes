import { Component, OnDestroy, inject, signal } from '@angular/core';
import type { InfiniteScrollCustomEvent, RefresherCustomEvent, SearchbarCustomEvent } from '@ionic/angular';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ROLE_LABEL, SEARCH_TEXT } from '../../core/constants/app.constants';
import { Role, User } from '../../core/models/user.models';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { UserService } from '../../core/services/user.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { UserFormModalComponent } from './user-form-modal.component';

type RoleFilter = Role | 'all';
const PAGE_SIZE = 15;

/** CRUD de usuarios (solo administradores). */
import { SearchbarMaxLengthDirective } from '../../shared/directives/shared/directives/searchbar-max-length.directive';
@Component({
  selector: 'app-admin-users',
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
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    EmptyStateComponent,
  ],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss',
})
export class AdminUsersPage implements OnDestroy {
  protected readonly searchRules = SEARCH_TEXT;
  private readonly userService = inject(UserService);
  private readonly modalController = inject(ModalController);
  private readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);

  protected readonly roleLabel = ROLE_LABEL;
  protected readonly users = signal<User[]>([]);
  protected readonly total = signal(0);
  protected readonly hasMore = signal(false);
  protected readonly loading = signal(false);
  protected readonly query = signal('');
  protected readonly role = signal<RoleFilter>('all');

  private page = 1;
  private subscription?: Subscription;

  ionViewWillEnter(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  protected onSearch(event: SearchbarCustomEvent): void {
    this.query.set((event.detail.value ?? '').slice(0, SEARCH_TEXT.MAX_LENGTH).trim());
    this.reload();
  }

  protected onRole(event: Event): void {
    this.role.set((event as CustomEvent<{ value: RoleFilter }>).detail.value);
    this.reload();
  }

  protected refresh(event: RefresherCustomEvent): void {
    this.reload(() => void event.target.complete());
  }

  protected loadMore(event: InfiniteScrollCustomEvent): void {
    this.page += 1;
    this.fetch(false, () => void event.target.complete());
  }

  protected async openForm(user: User | null = null): Promise<void> {
    const modal = await this.modalController.create({
      component: UserFormModalComponent,
      componentProps: { user },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss<User | null>();
    if (data) {
      // Si el admin se editó a sí mismo, mantiene su sesión al día.
      if (data.id === this.auth.user()?.id) this.auth.setUser(data);
      this.reload();
    }
  }

  protected async remove(user: User): Promise<void> {
    const confirmed = await this.ui.confirm(
      'Eliminar usuario',
      `Se borrará a "${user.username}" y todas sus reseñas.`,
      'Eliminar',
    );
    if (!confirmed) return;

    this.userService.remove(user.id).subscribe({
      next: () => {
        void this.ui.success('Usuario eliminado');
        this.reload();
      },
      error: (error: unknown) => void this.ui.error(getErrorMessage(error)),
    });
  }

  private reload(done?: () => void): void {
    this.page = 1;
    this.fetch(true, done);
  }

  private fetch(replace: boolean, done?: () => void): void {
    this.subscription?.unsubscribe();
    this.loading.set(true);

    const role = this.role();
    this.subscription = this.userService
      .list({ page: this.page, limit: PAGE_SIZE, q: this.query() || undefined, ...(role !== 'all' && { role }) })
      .subscribe({
        next: ({ items, pagination }) => {
          this.users.update((current) => (replace ? items : [...current, ...items]));
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
