import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly storageKey = 'rubio_cart_items';
  private items: any[] = [];
  private itemsSubject: BehaviorSubject<any[]>;

  constructor() {
    this.items = this.loadCartFromStorage();
    this.itemsSubject = new BehaviorSubject<any[]>(this.items);
  }

  // Carga los items desde localStorage al inicializar el servicio
  private loadCartFromStorage(): any[] {
    try {
      const storedItems = localStorage.getItem(this.storageKey);
      if (storedItems) {
        const parsed = JSON.parse(storedItems);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.error('Error al recuperar el carrito desde localStorage:', err);
    }
    return [];
  }

  // Guarda el estado actual de los items en localStorage
  private saveCartToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (err) {
      console.error('Error al guardar el carrito en localStorage:', err);
    }
  }

  // Retorna el array actual de items (no reactivo)
  getItems(): any[] {
    return this.items;
  }

  // Retorna el observable para suscribirse a los cambios
  getItemsObservable() {
    return this.itemsSubject.asObservable();
  }

  addItem(item: any): void {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      this.items.push({ ...item, quantity: item.quantity || 1 });
    }
    this.saveCartToStorage();
    this.itemsSubject.next(this.items);
  }

  removeItem(itemId: any): void {
    this.items = this.items.filter(item => item.id !== itemId);
    this.saveCartToStorage();
    this.itemsSubject.next(this.items);
  }

  updateItemQuantity(itemId: any, quantity: number): void {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = Number(quantity);
    }
    this.saveCartToStorage();
    this.itemsSubject.next(this.items);
  }

  clearCart(): void {
    this.items = [];
    try {
      localStorage.removeItem(this.storageKey);
    } catch (err) {
      console.error('Error al eliminar el carrito de localStorage:', err);
    }
    this.itemsSubject.next(this.items);
  }
}
