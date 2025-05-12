// src/app/payment/payment.component.ts
import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { StripeService, StripeCardComponent, NgxStripeModule } from 'ngx-stripe';
import {
  StripeCardElementOptions,
  StripeElementsOptions,
  CreatePaymentMethodCardData
} from '@stripe/stripe-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProcessOrderPayload, ProcessOrderResponse, PaymentService } from '../services/payment.service';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../enviroments/environment';

declare global {
  interface Window { paypal: any; }
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxStripeModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.sass'],
})
export class PaymentComponent implements OnInit {
  @ViewChild(StripeCardComponent) card!: StripeCardComponent;

  @Input() cartItems: any[] = [];
  @Input() order!: any;
  @Input() shippingData!: any;
  @Input() shippingMethod!: string;
  @Input() shippingCost!: number;

  @Output() paymentConfirmed = new EventEmitter<{
    paymentMethodId: string;
    raw?: any;
    paymentMethodType: 'stripe' | 'paypal';
  }>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  /** 1) Control de método seleccionado */
  selectedMethod: 'stripe' | 'paypal' | null = null;

  processing = false;
  errorMessage = '';

  cardOptions: StripeCardElementOptions = {
    style: { base: { color: '#000' } }
  };
  elementsOptions: StripeElementsOptions = { locale: 'es' };

  constructor(
    private stripeService: StripeService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    // No cargamos nada aquí, esperaremos a que el usuario seleccione PayPal
  }

  /** 2) Cuando el usuario elige método */
  selectMethod(method: 'stripe' | 'paypal') {
    this.selectedMethod = method;
    if (method === 'paypal') {
      this.loadPayPalSdk();
    }
  }

  // —————— Stripe flow ——————
  async payStripe(e: Event) {
    e.preventDefault();
    this.processing = true;
    this.errorMessage = '';

    // 1) Crear PaymentMethod
    const pmData = {
      type: 'card',
      card: this.card.element,
      billing_details: {
        name: this.shippingData.fullName,
        email: this.shippingData.email,
        phone: this.shippingData.phone
      }
    } as CreatePaymentMethodCardData;

    const pmResult = await lastValueFrom(this.stripeService.createPaymentMethod(pmData));
    if (pmResult.error) {
      this.processing = false;
      return this.paymentError.emit(pmResult.error.message || 'Error creando PaymentMethod');
    }
    const pm = pmResult.paymentMethod!.id;

    // 2) Llamada al backend
    const payload: ProcessOrderPayload = {
      order: this.order,
      paymentMethodId: pm,
      shippingData: this.shippingData,
      shippingMethod: this.shippingMethod,
      shippingCost: this.shippingCost,
      paymentMethodType: 'stripe'
    };

    this.paymentService.processOrder(payload).subscribe({
      next: async (resp: ProcessOrderResponse) => {
        // 3DS?
        if (resp.requiresAction && resp.clientSecret) {
          try {
            const con = await lastValueFrom(
              this.stripeService.confirmCardPayment(resp.clientSecret)
            );
            if (con.error) throw con.error;
            if (con.paymentIntent?.status !== 'succeeded') {
              throw new Error('3D Secure no completado');
            }
            this.emitSuccess(pm, con.paymentIntent, 'stripe');
          } catch (err: any) {
            this.processing = false;
            this.paymentError.emit(err.message || 'Error 3D Secure');
          }
        } else {
          this.emitSuccess(pm, resp.paymentIntent, 'stripe');
        }
      },
      error: err => {
        this.processing = false;
        this.paymentError.emit(err.error?.message || 'Error procesando orden');
      }
    });
  }

  // —————— PayPal flow ——————
  private loadPayPalSdk() {
    if ((<any>window).paypal) {
      return this.renderPayPalButtons();
    }
    const scr = document.createElement('script');
    scr.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=EUR`;
    scr.onload = () => this.renderPayPalButtons();
    document.body.appendChild(scr);
  }

  private renderPayPalButtons() {
    window.paypal.Buttons({
      createOrder: (_data: any, actions: any) => {
        const amount = (
          this.order.cabecera.net1pcl +
          this.order.cabecera.iiva1pcl +
          this.shippingCost
        ).toFixed(2);
        return actions.order.create({
          purchase_units: [{ amount: { currency_code: 'EUR', value: amount } }]
        });
      },
      onApprove: async (_data: any, actions: any) => {
        this.processing = true;
        try {
          const capture = await actions.order.capture();
          // payload para backend
          const payload: ProcessOrderPayload = {
            order: this.order,
            paymentMethodId: capture.id,
            shippingData: this.shippingData,
            shippingMethod: this.shippingMethod,
            shippingCost: this.shippingCost,
            paymentMethodType: 'paypal'
          };
          this.paymentService.processOrder(payload).subscribe({
            next: () => {
              this.emitSuccess(capture.id, capture, 'paypal');
              this.processing = false;
            },
            error: err => {
              this.processing = false;
              this.paymentError.emit(err.error?.message || 'Error backend PayPal');
            }
          });
        } catch (err: any) {
          this.processing = false;
          this.paymentError.emit(err.message || 'Error capturando PayPal');
        }
      },
      onError: (err: any) => {
        this.paymentError.emit(err.message || 'Error PayPal');
      }
    }).render('#paypal-button-container');
  }

  /** 4) Emitir éxito con tipo de método */
  private emitSuccess(
    paymentMethodId: string,
    raw: any,
    method: 'stripe' | 'paypal'
  ) {
    this.processing = false;
    this.paymentConfirmed.emit({ paymentMethodId, raw, paymentMethodType: method });
  }

  onCancel() {
    this.cancel.emit();
  }
}
