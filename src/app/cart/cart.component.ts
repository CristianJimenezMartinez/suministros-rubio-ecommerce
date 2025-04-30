import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PaymentComponent } from '../payment/payment.component';
import { CheckoutComponent } from '../checkout/checkout.component';
import { PopupComponent } from '../popup/popup.component';

import { FeedbackService } from '../services/feedback.service';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.sass'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaymentComponent,
    CheckoutComponent,
    PopupComponent
  ]
})
export class CartComponent implements OnInit {
  items: any[] = [];
  subtotal = 0;
  shippingCost = 10;
  total = 0;

  checkoutData: any;
  currentStep: 'cart' | 'checkout' | 'payment' | 'none' = 'cart';

  popupMessage = '';
  showPopup = false;

  cartItemsForPayment: any[] = [];
  orderToPay: any;

  @Output() close = new EventEmitter<void>();

  constructor(
    private cartService: CartService,
    private router: Router,
    private feedbackService: FeedbackService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.loadCart();

    // 1) Suscripción para recibir feedback del webhook
    this.feedbackService.onPaymentFeedback()
      .subscribe(data => {
        console.log('Received payment feedback:', data);
        if (data?.message) {
          this.popupMessage = data.message;
          this.showPopup = true;
        }
      });
  }

  loadCart(): void {
    this.items = this.cartService.getItems();
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.subtotal = parseFloat(
      this.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
        .toFixed(2)
    );
    this.total = parseFloat(
      (this.subtotal + this.shippingCost).toFixed(2)
    );
  }

  removeItem(item: any): void {
    this.cartService.removeItem(item.id);
    this.loadCart();
  }

  updateQuantity(item: any, quantity: number): void {
    if (quantity < 1) return;
    this.cartService.updateItemQuantity(item.id, quantity);
    this.loadCart();
  }

  continueCheckout(): void {
    this.onStepChange('checkout');
  }

  onStepChange(step: 'cart' | 'checkout' | 'payment' | 'none'): void {
    this.currentStep = step;
  }

  // 2) Tras el checkout: guardamos datos y nos unimos a la sala Socket.IO
  handleCheckoutCompleted(checkoutData: any): void {
    const items = checkoutData.cartItems as any[];
    this.checkoutData = checkoutData;
    this.cartItemsForPayment = items;
  
    // 1) Sumar netos, IVAs y brutos con fallback a 0 si no existe
    const netSum   = items.reduce((sum, i) =>
      sum + (parseFloat(i.netPrice ?? '0') || 0) * i.quantity
    , 0);
    const vatSum   = items.reduce((sum, i) =>
      sum + (parseFloat(i.vatAmount ?? '0') || 0) * i.quantity
    , 0);
    const grossSum = items.reduce((sum, i) =>
      sum + (parseFloat(i.price ?? '0')    || 0) * i.quantity
    , 0);
  
    // 2) Tipo de IVA del primer artículo (0,1,2,4, etc.)
    const ivaType = items[0]?.tivart ?? '0';
  
    // 3) Construir el pedido, convirtiendo a número con dos decimales
    this.orderToPay = {
      cabecera: {
        tippcl:   'O',
        codpcl:   0,
        refpcl:   String(Date.now()).substring(0, 12),
        fecpcl:   new Date().toISOString().split('T')[0],
        agepcl:   '',
        clipcl:   '',
  
        cempcl:   checkoutData.shippingData.email,     // <--- nuevo
        cpapcl:   checkoutData.shippingData.country,   // <--- nuevo
  
        tivpcl:   items[0]?.vatType ?? '0',
        reqpcl:   '0',
        almpcl:   '',
        cnopcl:   checkoutData.shippingData.fullName,
        cdopcl:   checkoutData.shippingData.address,
        cpopcl:   checkoutData.shippingData.province,
        ccppcl:   checkoutData.shippingData.postalCode,
        cprpcl:   checkoutData.shippingData.country,
        telpcl:   checkoutData.shippingData.phone,
  
        net1pcl:  parseFloat(netSum.toFixed(2)),
        iiva1pcl: parseFloat(vatSum.toFixed(2)),
        totpcl:   parseFloat(grossSum.toFixed(2))
      },
      lineas: items.map((item: any, idx: number) => ({
        tiplpc: '1',
        poslpc: idx + 1,
        artlpc: item.id,
        deslpc: item.name,
        canlpc: item.quantity,
        dt1lpc: 0,
        prelpc: parseFloat(item.netPrice ?? '0'),
        ivaplc: item.vatType,
        totlpc: parseFloat(item.price ?? '0') * item.quantity
      }))
    };
  
    this.onStepChange('payment');
  }
  
  
  
  
  

  // 3) Cuando el pago se confirma (desde PaymentComponent)
  handlePaymentConfirmed(paymentData: any): void {
    console.log('Pago confirmado:', paymentData);

    const payload = {
      order: this.orderToPay,
      lineas: this.cartItemsForPayment,       // opcional, si tu backend lo necesita
      shippingData: this.checkoutData.shippingData,
      shippingMethod: this.checkoutData.shippingMethod,
      shippingCost: this.checkoutData.shippingCost,
      paymentMethodId: paymentData.paymentMethod.id
    };

    this.paymentService.processOrder(payload).subscribe({
      next:(response: any) => {
        console.log('processOrder response:', response);
        // 1) Únete a la sala para recibir feedback del webhook
        if (response.pedidoId) {
          this.feedbackService.joinRoom(response.pedidoId);
        }
        // 2) Limpia carrito y vuelve al estado inicial
        this.cartService.clearCart();
        this.currentStep = 'none';
        // 3) Muestra el popup de “gracias”
        this.popupMessage = '¡Tu compra se ha realizado con éxito!';
        this.showPopup = true;
      },
      error: err => {
        console.error('Error en processOrder:', err);
        this.popupMessage = 'Error al procesar la orden. Revisa la consola.';
        this.showPopup = true;
      }
    });
  }

  handlePaymentError(errorMessage: string): void {
    console.error('Error en el pago:', errorMessage);
    this.popupMessage = `Error al procesar el pago: ${errorMessage}`;
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
    if (this.currentStep === 'none') {
      this.onStepChange('cart');
    }
  }

  closeCart(): void {
    this.close.emit();
  }
}
