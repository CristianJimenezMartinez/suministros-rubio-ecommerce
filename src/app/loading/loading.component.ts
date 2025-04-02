import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  template: `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `,
  styleUrls: ['./loading.component.sass'],
  standalone: true
})
export class LoadingComponent {}
