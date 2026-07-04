// src/app/payment/payment.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import {
  StripeService,
  StripeCardComponent,
  NgxStripeModule
} from 'ngx-stripe';
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
} from '../../services/payment.service';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { LoadingService } from '../../services/loading.service';

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
  imports: [CommonModule, FormsModule, NgxStripeModule, LoadingComponent],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.sass'],
})
export class PaymentComponent implements OnInit, OnDestroy {
  @ViewChild(StripeCardComponent) card!: StripeCardComponent;
  @Input() cartItems: any[] = [];

  @Input() order!: any;
  @Input() shippingData!: any;
  @Input() shippingMethod!: string;
  @Input() shippingCost!: number;

  @Output() paymentConfirmed = new EventEmitter<{
    paymentMethodId: string;
    raw?: any;
    paymentMethodType: PaymentMethodType;
  }>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  selectedMethod: 'stripe'|'paypal'|'redsys'|null = null;

  private paypalSdkLoaded = false;
  private paypalRendered  = false;
  private redsysLoaded    = false;
  private redsysListener!: (e: MessageEvent) => void;

  processing = false;
  errorMessage = '';

  cardOptions: StripeCardElementOptions = { style: { base: { color: '#000' } } };
  elementsOptions: StripeElementsOptions = { locale: 'es' };

  constructor(
    private stripeService: StripeService,
    private paymentService: PaymentService,
    private loading: LoadingService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.redsysListener) {
      window.removeEventListener('message', this.redsysListener);
    }
  }

  selectMethod(method: 'stripe'|'paypal'|'redsys') {
    this.selectedMethod = method;
    if (method === 'paypal') setTimeout(() => this.loadPayPalSdk(), 0);
    if (method === 'redsys') setTimeout(() => this.loadRedsysSdk(), 0);
  }

  // ─── REDSYS ─────────────────────────────────────────
  private loadRedsysSdk() {
    if (this.redsysLoaded) return;
    this.redsysLoaded = true;
    const script = document.createElement('script');
    script.src = environment.production 
      ? 'https://sis.redsys.es/sis/NC/redsysV3.js'
      : 'https://sis-t.redsys.es:25443/sis/NC/sandbox/redsysV3.js';
    script.onload = () => this.renderRedsysForm();
    document.body.appendChild(script);
  }

  private renderRedsysForm() {
    if (!this.order || typeof window.getInSiteForm !== 'function') return;
    window.getInSiteForm(
      'redsys-card-form','','','','',
      'Pagar con Redsys',
      environment.redsysFuc,
      environment.redsysTerminal,
      String(this.order.refpcl),
      'ES',
      true
    );
    this.redsysListener = (e: MessageEvent) => {
      if (e.origin !== 'https://sis-t.redsys.es:25443') return;
      const data = e.data;
      if (data.event === 'merchantValidation') {
        this.loading.show();
        fetch(`${environment.apiUrl}/pasarelaGlobal/redsys/validate`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ merchantParameters: data.merchantParameters })
        })
          .then(r => r.json())
          .then(j => {
            (e.source as Window).postMessage(
              { event:'merchantValidation', Ds_Signature: j.Ds_Signature },
              e.origin
            );
          })
          .catch(() => {
            this.loading.hide();
            this.paymentError.emit('Error validando Redsys');
          });
      }
      if (data.event === 'merchantResponse') {
        try {
          const decoded = JSON.parse(atob(data.merchantParameters));
          this.confirmRedsysPayment(decoded.Ds_IdOper);
        } catch {
          this.loading.hide();
          this.paymentError.emit('Error procesando Redsys');
        }
      }
      if (data.event === 'merchantError') {
        this.loading.hide();
        this.paymentError.emit(`Redsys error ${data.errorCode}`);
      }
    };
    window.addEventListener('message', this.redsysListener);
  }

  private confirmRedsysPayment(idOper: string) {
    this.loading.show();
    const payload: ProcessOrderPayload = {
      order: this.order,
      paymentMethodId: idOper,
      shippingData: this.shippingData,
      shippingMethod: this.shippingMethod,
      shippingCost: this.shippingCost,
      paymentMethodType: 'redsys'
    };
    this.paymentService.processOrder(payload).subscribe({
      next: ({ rawResult }) => this.onSuccess(idOper, rawResult),
      error: () => {
        this.loading.hide();
        this.paymentError.emit('Error backend Redsys');
      }
    });
  }

  // ─── STRIPE ─────────────────────────────────────────
  async payStripe(e: Event) {
    e.preventDefault();
    this.loading.show();
    this.errorMessage = '';

    const pmData = {
      type:'card',
      card: this.card.element,
      billing_details: {
        name: this.shippingData.fullName,
        email: this.shippingData.email,
        phone: this.shippingData.phone
      }
    } as CreatePaymentMethodCardData;

    const pmResult = await lastValueFrom(
      this.stripeService.createPaymentMethod(pmData)
    );
    if (pmResult.error) {
      this.loading.hide();
      return this.paymentError.emit(pmResult.error.message||'Error creando PM');
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
      next: resp => {
        if (resp.requiresAction && resp.clientSecret) {
          lastValueFrom(
            this.stripeService.confirmCardPayment(resp.clientSecret)
          )
          .then(con => {
            if (con.error || con.paymentIntent?.status!=='succeeded') {
              throw con.error||new Error('3D Secure no completado');
            }
            this.onSuccess(pm, con.paymentIntent);
          })
          .catch(err => {
            this.loading.hide();
            this.paymentError.emit(err.message||'Error 3D Secure');
          });
        } else {
          this.onSuccess(pm, resp.paymentIntent!);
        }
      },
      error: err => {
        this.loading.hide();
        this.paymentError.emit(err.error?.message||'Error procesando orden');
      }
    });
  }

  // ─── PAYPAL ─────────────────────────────────────────
  private loadPayPalSdk() {
    if (this.paypalSdkLoaded) {
      this.tryRenderPayPalButtons();
    } else {
      this.paypalSdkLoaded = true;
      const scr = document.createElement('script');
      scr.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=EUR`;
      scr.onload = () => this.tryRenderPayPalButtons();
      document.body.appendChild(scr);
    }
  }

  private tryRenderPayPalButtons() {
    if (this.paypalRendered) return;
    const container = document.getElementById('paypal-button-container');
    if (!container) {
      setTimeout(() => this.tryRenderPayPalButtons(), 0);
      return;
    }
    container.innerHTML = '';
    window.paypal.Buttons({
  onClick: (_data: unknown, _actions: any) => {
    this.loading.show();
    this.errorMessage = '';
  },

  createOrder: (_data: unknown, actions: any) => {
    const amount = (
      this.order.cabecera.net1pcl +
      this.order.cabecera.iiva1pcl +
      this.shippingCost
    ).toFixed(2);
    return actions.order.create({
      purchase_units: [{ amount: { currency_code: 'EUR', value: amount } }]
    });
  },

  onApprove: async (_data: unknown, actions: any) => {
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
        next: () => this.onSuccess(capture.id, capture),
        error: () => {
          this.loading.hide();
          this.paymentError.emit('Error backend PayPal');
        }
      });
    } catch (err: any) {
      this.loading.hide();
      this.paymentError.emit(err.message || 'Error capturando PayPal');
    }
  },

  onError: (err: any) => {
    this.loading.hide();
    this.paymentError.emit(err.message || 'Error PayPal');
  }
}).render('#paypal-button-container');

    this.paypalRendered = true;
  }

  private onSuccess(paymentMethodId: string, raw: any) {
    this.paymentConfirmed.emit({
      paymentMethodId,
      raw,
      paymentMethodType:
        raw.id?.startsWith('PAY-') ? 'paypal' : (this.selectedMethod as PaymentMethodType)
    });
  }

  onCancel() {
    this.loading.hide();
    this.cancel.emit();
  }
}
