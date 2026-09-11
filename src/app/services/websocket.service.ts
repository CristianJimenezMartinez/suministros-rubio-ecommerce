// src/app/services/websocket.service.ts
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  constructor(private socket: Socket) {}

  joinOrderRoom(orderId: string) {
    this.socket.emit('joinRoom', orderId);
  }

  onPaymentFeedback(): Observable<{ orderId: string; message: string }> {
    return this.socket.fromEvent('paymentFeedback');
  }
}
