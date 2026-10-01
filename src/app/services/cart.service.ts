import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'rubio_cart';
  private items: any[] = [];
  private itemsSubject = new BehaviorSubject<any[]>([]);

  constructor() {
    this.items = this.loadFromStorage();
    this.itemsSubject.next(this.items);
  }

  private loadFromStorage(): any[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch {
      // Ignora silenciosamente si el almacenamiento en navegador está restringido
    }
    return [];
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (this.items.length === 0) {
          localStorage.removeItem(this.STORAGE_KEY);
        } else {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        }
      }
    } catch {
      // Ignora silenciosamente errores de cuota o permisos restringidos
    }
  }

  // Retorna el array actual de items (no reactivo)
  getItems(): any[] {
    return this.items;
  }

  // Retorna el observable para suscribirse a los cambios
  getItemsObservable(): Observable<any[]> {
    return this.itemsSubject.asObservable();
  }

  addItem(item: any): void {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      this.items.push({ ...item, quantity: item.quantity || 1 });
    }
    this.saveToStorage();
    this.itemsSubject.next(this.items);
  }

  removeItem(itemId: any): void {
    this.items = this.items.filter(item => item.id !== itemId);
    this.saveToStorage();
    this.itemsSubject.next(this.items);
  }

  updateItemQuantity(itemId: any, quantity: number): void {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.quantity = Number(quantity);
    }
    this.saveToStorage();
    this.itemsSubject.next(this.items);
  }

  clearCart(): void {
    this.items = [];
    this.saveToStorage();
    this.itemsSubject.next(this.items);
  }
}
