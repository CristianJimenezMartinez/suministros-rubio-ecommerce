import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer-links',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer-links.component.html',
  encapsulation: ViewEncapsulation.None
})
export class FooterLinksComponent {}
