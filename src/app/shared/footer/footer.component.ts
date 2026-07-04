import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FooterBrandComponent } from './components/footer-brand/footer-brand.component';
import { FooterLinksComponent } from './components/footer-links/footer-links.component';
import { FooterBottomComponent } from './components/footer-bottom/footer-bottom.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.sass'],
  standalone: true,
  imports: [
    CommonModule,
    FooterBrandComponent,
    FooterLinksComponent,
    FooterBottomComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class FooterComponent {}
