import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/** ion-searchbar no trae `maxlength`: este directive recorta lo escrito (o pegado) al límite indicado. */
@Directive({ selector: 'ion-searchbar[appMaxLength]' })
export class SearchbarMaxLengthDirective {
  readonly appMaxLength = input.required<number>();
  private readonly host = inject<ElementRef<HTMLIonSearchbarElement>>(ElementRef);

  @HostListener('ionInput')
  protected clamp(): void {
    const el = this.host.nativeElement;
    const value = el.value ?? '';
    if (value.length > this.appMaxLength()) el.value = value.slice(0, this.appMaxLength());
  }
}