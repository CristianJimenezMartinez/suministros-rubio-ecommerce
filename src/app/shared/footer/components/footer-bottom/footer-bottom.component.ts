import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-footer-bottom',
  standalone: true,
  imports: [],
  templateUrl: './footer-bottom.component.html',
  encapsulation: ViewEncapsulation.None
})
export class FooterBottomComponent {
  currentYear: number = new Date().getFullYear();
}
