import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from '../profile/profile.component';
import { CartService } from '../services/cart.service';
import { CartComponent } from '../cart/cart.component';
import { DataService, Article } from '../services/data.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, ProfileComponent, CartComponent, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.sass'],
  standalone: true
})
export class HeaderComponent implements OnInit {
  isNavDropdownOpen: boolean = false;
  isProfileDropdownOpen: boolean = false;
  
  isLoggedIn: boolean = false;
  showLoginButton: boolean = true;
  showRegisterButton: boolean = true;

  // Propiedad para determinar si estamos en móvil
  isMobile: boolean = false;

  // Propiedades para el carrito
  isCartOpen: boolean = false;
  cartItemCount: number = 0;

  searchText: string = '';

  // Propiedad para almacenar artículos filtrados
  filteredArticles: Article[] = [];

  constructor(
    private router: Router, 
    private elementRef: ElementRef,
    private cartService: CartService,
    private dataService: DataService  // Inyección de DataService
  ) {}

  ngOnInit(): void {
    this.updateIsMobile(window.innerWidth);
    const user = localStorage.getItem('user');
    this.isLoggedIn = !!user;
    if (this.isLoggedIn) {
      this.showLoginButton = false;
      this.showRegisterButton = false;
    }
    this.router.events
      .pipe(filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (!this.isLoggedIn) {
          this.showLoginButton = !event.urlAfterRedirects.includes('/login');
          this.showRegisterButton = !event.urlAfterRedirects.includes('/register');
        }
      });
    this.cartService.getItemsObservable().subscribe(items => {
      this.cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const target = event.target as Window;
    this.updateIsMobile(target.innerWidth);
  }

  private updateIsMobile(width: number): void {
    this.isMobile = width <= 576;
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

  // Método para móviles: redirige o abre modal para login/registro
  onMobileLoginClick(): void {
    this.router.navigate(['/login']); 
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

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  closeCart(): void {
    this.isCartOpen = false;
  }

  onSearch(): void {
    const query = this.searchText.trim();
    if (query) {
      // Navega a la ruta '/articulos' con el query parameter 'query'
      console.log("funciona")
      this.router.navigate(['/articulos'], { queryParams: { query } });
    }
  }
  
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isNavDropdownOpen = false;
      this.isProfileDropdownOpen = false;
      this.isCartOpen = false;
    }
  }
}
