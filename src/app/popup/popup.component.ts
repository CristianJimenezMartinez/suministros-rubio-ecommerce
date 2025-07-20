import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  standalone: true,
  template: `
    <div class="overlay">
      <div class="popup">
        <p>{{ message }}</p>
        <button (click)="onAccept()">Aceptar</button>
      </div>
    </div>
  `,
  styleUrls: ['./popup.component.sass']
})
export class PopupComponent {
  @Input() message: string = '';
  @Output() accepted: EventEmitter<void> = new EventEmitter();

  onAccept(): void {
    this.accepted.emit();
  }
}
