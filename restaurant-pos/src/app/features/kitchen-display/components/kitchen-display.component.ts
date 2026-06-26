import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../../core/websocket/websocket.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { ItemStatusEvent, ItemStatus } from '../../../shared/models';

interface KitchenCard {
  itemId:   number;
  orderId:  number;
  tableId:  number;
  name:     string;
  quantity: number;
  status:   ItemStatus;
  time:     Date;
}

const STATUS_ORDER: ItemStatus[] = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Kitchen Display</h1>
          <p>{{ cards.length }} active items · live via WebSocket</p>
        </div>
        <div class="ws-indicator" [class.connected]="wsConnected">
          <span class="dot"></span>
          {{ wsConnected ? 'Live' : 'Connecting…' }}
        </div>
      </div>

      <!-- Column layout by status -->
      <div class="kitchen-columns">
        @for (col of columns; track col.status) {
          <div class="kitchen-col">
            <div class="col-header status-{{ col.status | lowercase }}">
              {{ col.label }}
              <span class="col-count">{{ col.items.length }}</span>
            </div>
            <div class="col-items">
              @if (!col.items.length) {
                <div class="col-empty">No items</div>
              }
              @for (card of col.items; track card.itemId) {
                <div class="kitchen-card status-{{ card.status | lowercase }}">
                  <div class="card-top">
                    <span class="table-tag">T{{ card.tableId }}</span>
                    <span class="order-tag">#{{ card.orderId }}</span>
                    <span class="time-tag">{{ ago(card.time) }}</span>
                  </div>
                  <div class="card-name">{{ card.name }}</div>
                  <div class="card-qty">× {{ card.quantity }}</div>
                  <div class="card-actions">
                    @for (next of nextStatuses(card.status); track next) {
                      <button class="btn btn-sm" [class]="btnClass(next)" (click)="updateStatus(card, next)">
                        {{ next }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .ws-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--danger); }
      &.connected { color: var(--available); .dot { background: var(--available); animation: pulse 2s infinite; } }
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .kitchen-columns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kitchen-col { display: flex; flex-direction: column; gap: 8px; }
    .col-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      &.status-pending   { background: rgba(144,144,176,0.2); color: var(--text-muted); }
      &.status-preparing { background: rgba(245,158,11,0.2);  color: var(--warning); }
      &.status-ready     { background: rgba(15,155,88,0.2);   color: var(--available); }
      &.status-served    { background: rgba(59,130,246,0.2);  color: var(--info); }
    }
    .col-count { background: rgba(255,255,255,0.1); border-radius: 20px; padding: 1px 8px; }
    .col-items { display: flex; flex-direction: column; gap: 8px; }
    .col-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; }
    .kitchen-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      border-left: 3px solid var(--border);
      &.status-pending   { border-left-color: var(--text-muted); }
      &.status-preparing { border-left-color: var(--warning); }
      &.status-ready     { border-left-color: var(--available); }
      &.status-served    { border-left-color: var(--info); }
    }
    .card-top { display: flex; gap: 6px; margin-bottom: 8px; align-items: center; }
    .table-tag { background: var(--accent); color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .order-tag { font-size: 11px; color: var(--text-muted); }
    .time-tag  { font-size: 10px; color: var(--text-muted); margin-left: auto; }
    .card-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
    .card-qty  { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
    .card-actions { display: flex; flex-wrap: wrap; gap: 6px; }

    @media (max-width: 1024px) { .kitchen-columns { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .kitchen-columns { grid-template-columns: 1fr; } }
  `]
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
  private wsSvc    = inject(WebSocketService);
  private orderSvc = inject(OrderService);
  private toast    = inject(ToastService);

  cards: KitchenCard[] = [];
  wsConnected = false;
  private sub?: Subscription;

  readonly columns = [
    { status: 'PENDING'   as ItemStatus, label: '🕐 Pending',   items: [] as KitchenCard[] },
    { status: 'PREPARING' as ItemStatus, label: '🔥 Preparing', items: [] as KitchenCard[] },
    { status: 'READY'     as ItemStatus, label: '✅ Ready',      items: [] as KitchenCard[] },
    { status: 'SERVED'    as ItemStatus, label: '🍽 Served',     items: [] as KitchenCard[] },
  ];

  ngOnInit(): void {
    this.wsSvc.connect();
    // Give the connection a moment, then check
    setTimeout(() => this.wsConnected = true, 1500);

    this.sub = this.wsSvc.kitchen$.subscribe(event => {
      this.wsConnected = true;
      this.upsertCard(event);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private upsertCard(event: ItemStatusEvent): void {
    const idx = this.cards.findIndex(c => c.itemId === event.itemId);
    const card: KitchenCard = {
      itemId:   event.itemId,
      orderId:  event.orderId,
      tableId:  event.tableId,
      name:     event.itemNameSnapshot,
      quantity: event.quantity,
      status:   event.status,
      time:     idx >= 0 ? this.cards[idx].time : new Date(),
    };
    if (idx >= 0) {
      this.cards[idx] = card;
    } else {
      this.cards.push(card);
    }
    this.rebuildColumns();
    if (event.status === 'READY') {
      this.toast.success(`🍽 ${event.itemNameSnapshot} is READY for Table ${event.tableId}`);
    }
  }

  private rebuildColumns(): void {
    for (const col of this.columns) {
      col.items = this.cards.filter(c => c.status === col.status);
    }
  }

  nextStatuses(current: ItemStatus): ItemStatus[] {
    const idx = STATUS_ORDER.indexOf(current);
    const nexts: ItemStatus[] = [];
    if (idx >= 0 && idx < STATUS_ORDER.length - 1) {
      nexts.push(STATUS_ORDER[idx + 1]);
    }
    if (current !== 'CANCELLED') nexts.push('CANCELLED');
    return nexts.filter(s => s !== current && s !== 'PENDING');
  }

  btnClass(status: ItemStatus): string {
    const map: Record<ItemStatus, string> = {
      PENDING:   'btn-secondary',
      PREPARING: 'btn-warning',
      READY:     'btn-success',
      SERVED:    'btn-info',
      CANCELLED: 'btn-danger',
    };
    return map[status] ?? 'btn-secondary';
  }

  updateStatus(card: KitchenCard, status: ItemStatus): void {
    this.orderSvc.updateItemStatus(card.itemId, { status }).subscribe({
      next: () => {
        card.status = status;
        this.rebuildColumns();
      },
      error: e => this.toast.error(e?.error?.message ?? 'Failed to update status.')
    });
  }

  ago(date: Date): string {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }
}
