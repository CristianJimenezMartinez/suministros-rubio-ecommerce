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

import {
  ProcessOrderPayload,
  ProcessOrderResponse,
  PaymentMethodType,
  PaymentService
} from '../services/payment.service';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../enviroments/environment';

declare global {
  interface Window {
    paypal?: any;
    getInSiteForm?: (
      containerId: string,
      estiloBoton: string,
      estiloBody: string,
      estiloCaja: string,
      estiloInputs: string,
      textoBoton: string,
      fuc: string,
      terminal: string,
      merchantOrder: string,
      idioma: string,
      logo: boolean
    ) => void;
  }
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

  @Output() paymentConfirmed = new EventEmitter<{ paymentMethodId: string; raw?: any; paymentMethodType: PaymentMethodType }>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  private lastMerchantParameters: string | null = null;
  private lastSignatureVersion: string | null = null;
  private redsysLoaded = false;
  private merchantParams: string | null = null;

  selectedMethod: 'stripe' | 'paypal' | 'redsys' | null = null;
  processing = false;
  errorMessage = '';

  cardOptions: StripeCardElementOptions = { style: { base: { color: '#000' } } };
  elementsOptions: StripeElementsOptions = { locale: 'es' };


  constructor(
    private stripeService: StripeService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {}

  selectMethod(method: 'stripe'|'paypal'|'redsys') {
    this.selectedMethod = method;
    if (method === 'paypal') this.loadPayPalSdk();
    if (method === 'redsys') setTimeout(() => this.loadRedsysSdk(), 0);
  }
  onClickConfirmRedsys() {
    if (!this.merchantParams) {
      this.paymentError.emit('Redsys: parámetros no disponibles');
      return;
    }
    this.processing = true;
    console.log('🔧 validando merchantParams', this.merchantParams);
    fetch(`${environment.apiUrl}/pasarelaGlobal/redsys/validate`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({Ds_MerchantParameters: this.merchantParams})
    })
      .then(r=>r.json())
      .then(j=>{
        console.log('🔑 firma', j.Ds_Signature);
        window.postMessage({event:'merchantValidation',Ds_Signature:j.Ds_Signature},'https://sis-t.redsys.es:25443');
      })
      .catch(err=>{
        console.error(err);
        this.processing=false;
      });
  }

  private async validateMerchantAndLaunch() {
    try {
      console.log('🔍 Redsys: validando merchantParameters…', this.lastMerchantParameters);
      const res = await fetch(
        `${environment.apiUrl}/pasarelaGlobal/redsys/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Ds_MerchantParameters: this.lastMerchantParameters
          })
        }
      );
      const { Ds_Signature } = await res.json();
      console.log('🔑 Redsys: firma recibida:', Ds_Signature);

      // 2) Envía respuesta al iframe para que éste invoque al proveedor
      window.postMessage(
        {
          event: 'merchantValidation',
          Ds_Signature,
          Ds_SignatureVersion: this.lastSignatureVersion
        },
        'https://sis-t.redsys.es:25443'
      );
    } catch (err) {
      console.error('⚠️ Redsys validation failed', err);
      this.processing = false;
      this.paymentError.emit('Error validando Redsys');
    }
  }

  // ─── REDSYS INTEGRATION ───────────────────────────────
private loadRedsysSdk() {
    if (this.redsysLoaded) return;
    this.redsysLoaded = true;
    if (typeof window.getInSiteForm === 'function') {
      this.renderRedsysForm();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sis-t.redsys.es:25443/sis/NC/sandbox/redsysV3.js';
    script.onload = () => this.renderRedsysForm();
    document.body.appendChild(script);
  }

  private renderRedsysForm() {
    if (!this.order) {
      console.error('Redsys: order undefined');
      return;
    }
    if (typeof window.getInSiteForm !== 'function') {
      console.error('Redsys: getInSiteForm no está definido');
      return;
    }

    console.log('▶️ getInSiteForm', this.order.refpcl);
    window.getInSiteForm(
      'redsys-card-form',
      '', '', '', '',
      'Pagar con Redsys',
      environment.redsysFuc,
      environment.redsysTerminal,
      String(this.order.refpcl),
      'ES',
      true
    );

    const listener = async (e: MessageEvent) => {
      console.group('📥 Redsys iframe');
      console.log('Origin', e.origin);
      console.log('Data', e.data);
      console.groupEnd();

      const data = e.data;
      // merchantValidation puede venir como string o objeto
      if (data === 'merchantValidation' || data.event === 'merchantValidation') {
        console.log('🔍 merchantValidation');
        // extraer params
        this.merchantParams = typeof data === 'string' ? null : data.merchantParameters;
        return;
      }
      if (data?.event === 'merchantResponse') {
        console.log('✅ merchantResponse');
        const params = JSON.parse(atob(data.merchantParameters));
        const id = params.Ds_IdOper;
        this.submitRedsysToken(id);
        return;
      }
      if (data?.event === 'merchantError') {
        console.error('❌ merchantError', data.errorCode);
        this.paymentError.emit(`Redsys error ${data.errorCode}`);
        this.processing = false;
        return;
      }
    };

    window.removeEventListener('message', listener);
    window.addEventListener('message', listener);
  }

/** 
 * 3) Este método guarda el idOper y llama al envío al backend
 */
private submitRedsysToken(id: string) {
    console.log('🚀 submitRedsysToken', id);
    this.processing = true;
    const payload: ProcessOrderPayload = {
      order: this.order,
      paymentMethodId: id,
      shippingData: this.shippingData,
      shippingMethod: this.shippingMethod,
      shippingCost: this.shippingCost,
      paymentMethodType: 'redsys'
    };
    this.paymentService.processGlobal(payload).subscribe({
      next: resp => this.emitSuccess(id, resp.rawResult, 'redsys'),
      error: e => { this.processing=false; this.paymentError.emit('Error Redsys'); }
    });
  }

/** 
 * 4) Envío al backend
 */
private payRedsys(idOper: string) {
  console.log('🚀 payRedsys', idOper);
  const payload: ProcessOrderPayload = {
    order: this.order,
    paymentMethodId: idOper,
    shippingData: this.shippingData,
    shippingMethod: this.shippingMethod,
    shippingCost: this.shippingCost,
    paymentMethodType: 'redsys'
  };
  this.paymentService.processGlobal(payload).subscribe({
    next: resp => {
      console.log('✅ Redsys pago ok', resp);
      this.emitSuccess(idOper, resp.rawResult, 'redsys');
    },
    error: err => {
      console.error('❌ Redsys pago error', err);
      this.processing = false;
      this.paymentError.emit(err.error?.message || 'Error backend Redsys');
    }
  });
}

 private sendRedsysPayment(idOper: string) {
    console.log('🚀 Redsys: enviando token al backend', idOper);
    const payload: ProcessOrderPayload = {
      order: this.order,
      paymentMethodId: idOper,
      shippingData: this.shippingData,
      shippingMethod: this.shippingMethod,
      shippingCost: this.shippingCost,
      paymentMethodType: 'redsys'
    };
    this.paymentService.processGlobal(payload).subscribe({
      next: resp => {
        console.log('✅ Redsys pago ok', resp);
        this.emitSuccess(idOper, resp.rawResult, 'redsys');
      },
      error: err => {
        console.error('❌ Redsys pago error', err);
        this.processing = false;
        this.paymentError.emit(err.error?.message || 'Error backend Redsys');
      }
    });
  }


  // ─── STRIPE FLOW ──────────────────────────────────────
  async payStripe(e: Event) {
    e.preventDefault();
    this.processing = true;
    this.errorMessage = '';

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
        if (resp.requiresAction && resp.clientSecret) {
          try {
            const con = await lastValueFrom(this.stripeService.confirmCardPayment(resp.clientSecret));
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

  // ─── PAYPAL FLOW (sin cambios) ───────────────────────
  private loadPayPalSdk() {
    if (window.paypal) {
      return this.renderPayPalButtons();
    }
    const scr = document.createElement('script');
    scr.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=EUR`;
    scr.onload = () => this.renderPayPalButtons();
    document.body.appendChild(scr);
  }

  private renderPayPalButtons() {
    window.paypal.Buttons({
      createOrder: (_data: unknown, actions: any) => {
        const amount = (this.order.cabecera.net1pcl + this.order.cabecera.iiva1pcl + this.shippingCost).toFixed(2);
        return actions.order.create({ purchase_units: [{ amount: { currency_code: 'EUR', value: amount } }] });
      },
      onApprove: async (_data: unknown, actions: any) => {
        this.processing = true;
        try {
          const capture = await actions.order.capture();
          const payload: ProcessOrderPayload = {
            order: this.order,
            paymentMethodId: capture.id,
            shippingData: this.shippingData,
            shippingMethod: this.shippingMethod,
            shippingCost: this.shippingCost,
            paymentMethodType: 'paypal'
          };
          this.paymentService.processOrder(payload).subscribe({
            next: () => this.emitSuccess(capture.id, capture, 'paypal'),
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
      onError: (err: { message?: string }) => {
        this.paymentError.emit(err.message || 'Error PayPal');
      }
    }).render('#paypal-button-container');
  }

  /** Emitir éxito */
  private emitSuccess(paymentMethodId: string, raw: any, method: PaymentMethodType) {
    this.processing = false;
    this.paymentConfirmed.emit({ paymentMethodId, raw, paymentMethodType: method });
  }

  onCancel() {
    this.cancel.emit();
  }
}
