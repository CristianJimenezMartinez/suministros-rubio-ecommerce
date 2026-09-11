import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CookieConsentService } from '../../../services/cookie-consent.service';

@Component({
  selector: 'app-cookie-banner',
  imports: [CommonModule],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.sass',
  standalone: true
})
export class CookieBannerComponent {
  consent$: Observable<boolean>;

    constructor(private consentService: CookieConsentService) {
      this.consent$ = this.consentService.consent$;
    }

    accept(): void {
      this.consentService.giveConsent();
    }
}
