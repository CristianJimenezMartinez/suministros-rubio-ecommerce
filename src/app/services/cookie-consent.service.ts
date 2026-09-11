import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'cookie_consent';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {

  private consentSubject = new BehaviorSubject<boolean>(this.hasConsent());
  consent$ = this.consentSubject.asObservable();

  private hasConsent(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  giveConsent(): void {
    localStorage.setItem(STORAGE_KEY, 'true');
    this.consentSubject.next(true);
  }

  revokeConsent(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.consentSubject.next(false);
  }
}
