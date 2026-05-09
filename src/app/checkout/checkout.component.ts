// checkout.component.ts
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.sass'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class CheckoutComponent implements OnInit {
  @Input() cartItems: any[] = [];
  @Output() checkoutCompleted = new EventEmitter<any>();
  @Output() cancelCheckout = new EventEmitter<void>();

  shippingData = {
    fullName: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    phone: '',
    email: ''
  };
  shippingMethod: string = 'standard';
  subtotal: number = 0;
  shippingCost: number = 0;
  total: number = 0;

  errorMessage: string = '';

  ngOnInit(): void {
    this.calculateSubtotal();
    this.onShippingMethodChange();
  }

  calculateSubtotal(): void {
    this.subtotal = this.cartItems.reduce((acc, item) =>
      acc + (item.price * item.quantity), 0);
  }

  calculateShippingCost(): void {
    switch (this.shippingMethod) {
      case 'standard':
        this.shippingCost = 10;
        break;
      case 'pickup':
        this.shippingCost = 0;
        break;
      default:
        this.shippingCost = 0;
    }
  }

  updateTotal(): void {
    this.total = this.subtotal + this.shippingCost;
  }

  onShippingMethodChange(): void {
    this.calculateShippingCost();
    this.updateTotal();
  }

  submitCheckout(): void {
    // Validación de país
    if (this.shippingData.country !== 'España') {
      this.errorMessage = 'Solo realizamos envíos dentro de España.';
      return;
    }
    this.errorMessage = '';

    const checkoutInfo = {
      shippingData: this.shippingData,
      shippingMethod: this.shippingMethod,
      subtotal: this.subtotal,
      shippingCost: this.shippingCost,
      total: this.total,
      cartItems: this.cartItems
    };
    this.checkoutCompleted.emit(checkoutInfo);
  }

  cancel(): void {
    this.cancelCheckout.emit();
  }
}
