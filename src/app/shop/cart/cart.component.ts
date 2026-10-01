import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethodType, ProcessOrderPayload } from '../../services/payment.service';

import { PaymentComponent } from '../payment/payment.component';
import { CheckoutComponent } from '../checkout/checkout.component';
import { PopupComponent } from '../../popup/popup.component';

import { FeedbackService } from '../../services/feedback.service';
import { PaymentService } from '../../services/payment.service';
import { OrderService } from '../../services/order.service';
import { LoadingService } from '../../services/loading.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { Observable } from 'rxjs';

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
    PopupComponent,
    LoadingComponent
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
  
  loading$: Observable<boolean>;
  constructor(
    private cartService: CartService,
    private router: Router,
    private feedbackService: FeedbackService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private loading: LoadingService 
  ) {
    this.loading$ = this.loading.isLoading;
  }
  
  ngOnInit(): void {
    this.loadCart();

    this.cartService.getItemsObservable().subscribe(items => {
      this.items = items;
      this.calculateTotal();
    });

    // 1) Suscripción para recibir feedback del webhook
    this.feedbackService.onPaymentFeedback()
      .subscribe({
        next: (data) => {
          /* console.log('Received payment feedback:', data); */
          if (data?.message) {
            this.popupMessage = data.message;
            this.showPopup = true;
          }
        },
        error: () => {
          // Desconexión silenciosa: en servidores Plesk/PHP tradicionales no hay daemon Socket.IO
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

    let clientId = 0;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const usr = JSON.parse(stored);
        const resolvedUser = usr.user || usr;
        clientId = resolvedUser.id ?? resolvedUser.CODCLI ?? 0;
      }
    } catch {
      clientId = 0;
    }
  
    // 3) Construir el pedido, convirtiendo a número con dos decimales
    this.orderToPay = {
      cabecera: {
        tippcl:   '3',
        codpcl:   0,
        refpcl:   String(Date.now()).substring(0, 12),
        fecpcl:   new Date().toISOString().split('T')[0],
        agepcl:   '',
        clipcl:   clientId.toString(),
  
        cempcl:   checkoutData.shippingData.email,
        cpapcl:   checkoutData.shippingData.country,
        nifpcl:   checkoutData.shippingData.nif || '',
  
        tivpcl:   items[0]?.vatType ?? '0',
        reqpcl:   '0',
        almpcl:   'GEN',
        cnopcl:   checkoutData.shippingData.fullName,
        cdopcl:   checkoutData.shippingData.address,
        cpopcl:   checkoutData.shippingData.city,
        ccppcl:   checkoutData.shippingData.postalCode,
        cprpcl:   checkoutData.shippingData.province,
        telpcl:   checkoutData.shippingData.phone,
        
        net1pcl:  parseFloat(netSum.toFixed(2)),
        iiva1pcl: parseFloat(vatSum.toFixed(2)),
        totpcl:   parseFloat(grossSum.toFixed(2))
      },
      lineas: items.map((item: any, idx: number) => ({
        tiplpc: '3',
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
  handlePaymentConfirmed(paymentData: {
    paymentMethodId: string;
    raw?: any;
    paymentMethodType: PaymentMethodType;
    orderResponse?: any;
  }): void {
    const onSuccess = (resp: any) => {
      if (resp?.pedidoId != null) {
        try {
          this.feedbackService.joinRoom(resp.pedidoId.toString());
        } catch {
          // Desconexión silenciosa: en servidores Plesk/PHP tradicionales no hay daemon Socket.IO
        }
      }
      this.cartService.clearCart();
      this.currentStep = 'none';
      this.popupMessage = '¡Tu compra con PayPal se ha realizado con éxito!';
      this.loading.hide();
      this.showPopup = true;
    };

    const onError = (err: any) => {
      this.loading.hide();
      this.popupMessage = `Error al procesar la orden: ${err?.error?.message || err?.message || 'Error al registrar pedido'}`;
      this.showPopup = true;
    };

    // Si PaymentComponent ya completó la creación de orden contra el endpoint:
    if (paymentData.orderResponse) {
      onSuccess(paymentData.orderResponse);
      return;
    }

    // Fallback: registrar mediante orderService.createOrder
    const payload = {
      order:             this.orderToPay,
      lines:             this.orderToPay?.lineas || this.orderToPay?.lines || [],
      subtotal:          this.subtotal,
      taxTotal:          this.orderToPay?.cabecera?.iiva1pcl ?? 0,
      total:             this.total,
      shippingData:      this.checkoutData?.shippingData,
      shippingMethod:    this.checkoutData?.shippingMethod,
      shippingCost:      this.checkoutData?.shippingCost,
      paymentMethod:     'paypal',
      paymentMethodType: 'paypal',
      paymentStatus:     'COMPLETED',
      paymentMethodId:   paymentData.paymentMethodId,
      paymentReference:  paymentData.paymentMethodId,
      raw:               paymentData.raw
    };

    this.orderService.createOrder(payload).subscribe({ next: onSuccess, error: onError });
  }

  /**
   * 4) Cuando el usuario cierra el popup, ocultamos spinner y volvemos a 'cart'
   */
  closePopup(): void {
    this.showPopup = false;
    this.loading.hide();      // ← aquí apagamos el spinner global
    if (this.currentStep === 'none') {
      this.onStepChange('cart');
    }
  }

  handlePaymentError(errorMessage: string): void {
    /* console.error('Error en el pago:', errorMessage); */
    this.popupMessage = `Error al procesar el pago: ${errorMessage}`;
    this.showPopup = true;
  }

  closeCart(): void {
    this.close.emit();
  }
}
