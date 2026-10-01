import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private socket: Socket | null = null;
  private readonly SERVER_URL = environment.apiUrl;

  constructor() {
    this.initSocket();
  }

  private initSocket(): void {
    try {
      this.socket = io(this.SERVER_URL, {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: false,
        reconnectionAttempts: 0,
        timeout: 3000
      });

      // Manejadores silenciosos: en servidores Plesk/PHP tradicionales no corre daemon Socket.IO
      this.socket.on('connect_error', () => {
        // Silencioso sin arrojar errores rojos no controlados en la consola
      });

      this.socket.on('error', () => {
        // Silencioso
      });

      this.socket.on('disconnect', () => {
        // Desconexión silenciosa
      });
    } catch {
      this.socket = null;
    }
  }

  // Únete a una sala usando el orderId para recibir feedback solo para ese usuario/pedido
  joinRoom(orderId: string): void {
    try {
      if (this.socket) {
        if (!this.socket.connected) {
          this.socket.connect();
        }
        this.socket.emit('joinRoom', orderId);
      }
    } catch {
      // Silencioso
    }
  }

  // Retorna un observable para suscribirse al evento "paymentFeedback"
  onPaymentFeedback(): Observable<any> {
    return new Observable((observer) => {
      if (!this.socket) {
        return;
      }
      const handler = (data: any) => {
        observer.next(data);
      };
      this.socket.on('paymentFeedback', handler);

      // Función de limpieza: se ejecuta al darse de baja del observable
      return () => {
        if (this.socket) {
          this.socket.off('paymentFeedback', handler);
        }
      };
    });
  }

  // Desconecta el socket de manera segura
  disconnect(): void {
    try {
      if (this.socket && this.socket.connected) {
        this.socket.disconnect();
      }
    } catch {
      // Silencioso
    }
  }
}
