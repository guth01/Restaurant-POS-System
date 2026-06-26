import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemStatusEvent } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client;
  private connected = false;

  private kitchenSubject = new Subject<ItemStatusEvent>();
  private waiterSubject = new Subject<ItemStatusEvent>();

  kitchen$: Observable<ItemStatusEvent> = this.kitchenSubject.asObservable();
  waiter$:  Observable<ItemStatusEvent> = this.waiterSubject.asObservable();

  private kitchenSub?: StompSubscription;
  private waiterSub?: StompSubscription;

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as WebSocket,
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        this.subscribeTopics();
      },
      onDisconnect: () => {
        this.connected = false;
      },
    });
  }

  connect(): void {
    if (!this.client.active) {
      this.client.activate();
    }
  }

  disconnect(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  private subscribeTopics(): void {
    this.kitchenSub = this.client.subscribe('/topic/kitchen', (msg: IMessage) => {
      try {
        const event: ItemStatusEvent = JSON.parse(msg.body);
        this.kitchenSubject.next(event);
      } catch {}
    });

    this.waiterSub = this.client.subscribe('/topic/waiter', (msg: IMessage) => {
      try {
        const event: ItemStatusEvent = JSON.parse(msg.body);
        this.waiterSubject.next(event);
      } catch {}
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
