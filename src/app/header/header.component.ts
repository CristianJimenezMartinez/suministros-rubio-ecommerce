import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from '../profile/profile.component';
import { CartService } from '../services/cart.service'; // Importa el servicio del carrito
import { CartComponent } from '../cart/cart.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ProfileComponent, CartComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass']
})
export class HeaderComponent implements OnInit {
  isNavDropdownOpen: boolean = false;
  isProfileDropdownOpen: boolean = false;
  
  isLoggedIn: boolean = false;
  showLoginButton: boolean = true;
  showRegisterButton: boolean = true;

  // Propiedades para el carrito
  isCartOpen: boolean = false;
  cartItemCount: number = 0;

  constructor(
    private router: Router, 
    private elementRef: ElementRef,
    private cartService: CartService  // Inyecta el servicio del carrito
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    this.isLoggedIn = !!user;
    if (this.isLoggedIn) {
      this.showLoginButton = false;
      this.showRegisterButton = false;
    }
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        console.log('NavigationEnd event:', event);
        if (!this.isLoggedIn) {
          this.showLoginButton = !event.urlAfterRedirects.includes('/login');
          this.showRegisterButton = !event.urlAfterRedirects.includes('/register');
        }
      });
      this.cartService.getItemsObservable().subscribe(items => {
        this.cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0)
      })
  }

  toggleNavDropdown(): void {
    this.isNavDropdownOpen = !this.isNavDropdownOpen;
  }

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  onLoginClick(): void {
    this.showLoginButton = false;
    this.router.navigate(['/login']);
  }

  onRegisterClick(): void {
    this.showRegisterButton = false;
    this.router.navigate(['/register']);
  }

  navigateTo(route: string): void {
    this.isNavDropdownOpen = false;
    this.router.navigate([route]);
  }

  navigateToProfile(): void {
    this.isProfileDropdownOpen = false;
    this.router.navigate(['/profile']);
  }

  navigateToSettings(): void {
    this.isProfileDropdownOpen = false;
    this.router.navigate(['/settings']);
  }

  logout(): void {
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.showLoginButton = true;
    this.showRegisterButton = true;
    this.isProfileDropdownOpen = false;
    this.router.navigate(['/']);
  }

  // Métodos para el carrito


  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
    // Actualizamos la cuenta cada vez que se abre el popup
  }

  closeCart(): void {
    this.isCartOpen = false;
  }

  // Detecta clics fuera del componente para cerrar dropdowns y popup del carrito
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isNavDropdownOpen = false;
      this.isProfileDropdownOpen = false;
      // Opcional: si se hace clic fuera del popup, se cierra
      this.isCartOpen = false;
    }
  }
}
