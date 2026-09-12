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
    customerType: 'particular', // 'particular' | 'empresa'
    companyName: '',
    nif: '',
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
    this.loadUserDataIfAvailable();
    this.calculateSubtotal();
    this.onShippingMethodChange();
  }

  loadUserDataIfAvailable(): void {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        let user = JSON.parse(userJson);
        if (user.user) user = user.user;
        const fullName = [user.name || user.NAME || '', user.surname || user.SURNAME || ''].filter(Boolean).join(' ');
        if (fullName) this.shippingData.fullName = fullName;
        const nif = user.dni || user.DNI || user.nif || user.NIF || '';
        if (nif) this.shippingData.nif = nif;
        if (user.address || user.ADDRESS) this.shippingData.address = user.address || user.ADDRESS;
        if (user.pob || user.POB) this.shippingData.city = user.pob || user.POB;
        if (user.prov || user.PROV) this.shippingData.province = user.prov || user.PROV;
        if (user.cp || user.CP) this.shippingData.postalCode = user.cp || user.CP;
        if (user.telf || user.TELF) this.shippingData.phone = user.telf || user.TELF;
        if (user.email || user.EMAIL) this.shippingData.email = user.email || user.EMAIL;
        if (user.pais || user.PAIS) this.shippingData.country = user.pais || user.PAIS;
      }
    } catch (_) {}
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
    this.total = parseFloat((this.subtotal + this.shippingCost).toFixed(2));
  }

  onShippingMethodChange(): void {
    this.calculateShippingCost();
    this.updateTotal();
  }

  submitCheckout(): void {
    // Validación obligatoria de NIF/CIF
    if (!this.shippingData.nif || !this.shippingData.nif.trim()) {
      this.errorMessage = 'El NIF/CIF es obligatorio para la factura y tramitación del pedido.';
      return;
    }

    // Validación de país
    if (this.shippingData.country !== 'España') {
      this.errorMessage = 'Solo realizamos envíos dentro de España.';
      return;
    }
    this.errorMessage = '';

    const checkoutInfo = {
      shippingData: {
        ...this.shippingData,
        nif: this.shippingData.nif.trim()
      },
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
