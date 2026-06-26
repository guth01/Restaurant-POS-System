import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { TableService } from '../../../core/services/table.service';
import { OrderService } from '../../../core/services/order.service';
import { MenuService } from '../../../core/services/menu.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  RestaurantTable, Order, MenuItem, OrderItem, TableStatus
} from '../../../shared/models';

declare const Razorpay: new (opts: unknown) => { open(): void };

@Component({
  selector: 'app-order-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Back -->
      <div class="back-row">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/waiter'])">
          ← Back to Tables
        </button>
      </div>

      @if (loading) {
        <div class="loading">Loading…</div>
      } @else if (error) {
        <div class="error-banner">{{ error }}</div>
      } @else if (table) {
        <div class="order-layout">
          <!-- LEFT: Menu -->
          <div class="menu-panel">
            <div class="panel-header">
              <h2>Table {{ table.tableNumber }}</h2>
              <span class="badge badge-{{ table.status | lowercase }}">{{ table.status }}</span>
            </div>

            <!-- Category filter -->
            <div class="category-chips">
              <span class="chip" [class.active]="!activeCategory" (click)="activeCategory = ''">All</span>
              @for (cat of categories; track cat) {
                <span class="chip" [class.active]="activeCategory === cat" (click)="activeCategory = cat">{{ cat }}</span>
              }
            </div>

            <!-- Menu items -->
            <div class="menu-items">
              @for (item of filteredMenu; track item.id) {
                <div class="menu-item" [class.unavailable]="!isItemAvailable(item)">
                  <div class="item-info">
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-meta">
                      <span class="item-price">₹{{ item.price }}</span>
                      <span class="item-cat">{{ item.category }}</span>
                      @if (item.prepTimeMinutes) {
                        <span class="text-muted text-sm">{{ item.prepTimeMinutes }}m</span>
                      }
                    </div>
                  </div>
                  <button
                    class="btn btn-sm btn-primary"
                    [disabled]="!isItemAvailable(item) || !order || addingItemId === item.id"
                    (click)="addItem(item)"
                  >
                    @if (addingItemId === item.id) { … } @else { + Add }
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- RIGHT: Current Order -->
          <div class="order-panel">
            <div class="panel-header">
              <h2>Current Order</h2>
              @if (order) {
                <span class="badge badge-{{ order.status | lowercase }}">{{ order.status }}</span>
              }
            </div>

            @if (!order) {
              <div class="no-order">
                @if (table.status === 'AVAILABLE') {
                  <p class="text-muted">Table is available.</p>
                  <button class="btn btn-primary" (click)="openTableAndOrder()">Open Table & Start Order</button>
                } @else {
                  <p class="text-muted">No open order found.</p>
                  <button class="btn btn-primary" (click)="createOrder()">Create Order</button>
                }
              </div>
            } @else {
              <!-- Order items -->
              <div class="order-items">
                @if (!order.items?.length) {
                  <p class="text-muted" style="padding:20px;text-align:center;">No items yet</p>
                }
                @for (item of (order.items ?? []); track item.id) {
                  <div class="order-item">
                    <div class="oi-info">
                      <div class="oi-name">{{ item.itemNameSnapshot }} × {{ item.quantity }}</div>
                      <div class="oi-price">₹{{ (item.priceAtOrderTime * item.quantity).toFixed(2) }}</div>
                    </div>
                    <span class="badge badge-{{ item.status | lowercase }}">{{ item.status }}</span>
                  </div>
                }
              </div>

              <!-- Totals -->
              <div class="order-totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>₹{{ subtotal().toFixed(2) }}</span>
                </div>
                <div class="total-row">
                  <span>Tax</span>
                  <span>₹{{ tax().toFixed(2) }}</span>
                </div>
                <div class="total-row grand">
                  <span>Total</span>
                  <span>₹{{ total().toFixed(2) }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="order-actions">
                @if (table.status === 'OCCUPIED' && order.status !== 'CLOSED') {
                  <button class="btn btn-warning btn-block" (click)="billTable()" [disabled]="actionLoading">
                    {{ actionLoading ? '…' : '📋 Request Bill' }}
                  </button>
                }
                @if (table.status === 'BILLED') {
                  <button class="btn btn-primary btn-block" (click)="pay()" [disabled]="actionLoading">
                    {{ actionLoading ? 'Opening payment…' : '💳 Pay with Razorpay' }}
                  </button>
                }
                @if (order.status === 'CLOSED') {
                  <div class="success-banner">✅ Order closed. Table is now available.</div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .back-row { margin-bottom: 20px; }
    .order-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; h2 { font-size: 18px; font-weight: 600; } }

    /* Menu panel */
    .menu-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
    .category-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .menu-items { display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 260px); overflow-y: auto; }
    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: var(--surface2);
      border-radius: 8px;
      border: 1px solid var(--border);
      &.unavailable { opacity: 0.4; }
    }
    .item-name { font-weight: 500; margin-bottom: 4px; }
    .item-meta { display: flex; gap: 10px; align-items: center; }
    .item-price { color: var(--accent); font-weight: 600; }
    .item-cat { font-size: 11px; background: var(--surface); border: 1px solid var(--border); padding: 2px 8px; border-radius: 12px; color: var(--text-muted); }

    /* Order panel */
    .order-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .no-order { text-align: center; padding: 40px 20px; display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .order-items { flex: 1; display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
    .order-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: var(--surface2);
      border-radius: 8px;
    }
    .oi-name { font-size: 13px; margin-bottom: 2px; }
    .oi-price { font-weight: 600; color: var(--text-muted); font-size: 12px; }
    .order-totals { border-top: 1px solid var(--border); padding-top: 14px; display: flex; flex-direction: column; gap: 8px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); }
    .total-row.grand { font-size: 16px; font-weight: 700; color: var(--text); }
    .order-actions { display: flex; flex-direction: column; gap: 10px; }

    @media (max-width: 768px) {
      .order-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class OrderScreenComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  router             = inject(Router);
  private tableSvc   = inject(TableService);
  private orderSvc   = inject(OrderService);
  private menuSvc    = inject(MenuService);
  private paymentSvc = inject(PaymentService);
  private toast      = inject(ToastService);

  table?: RestaurantTable;
  order?: Order;
  menuItems: MenuItem[] = [];
  activeCategory = '';
  loading       = false;
  error         = '';
  actionLoading = false;
  addingItemId: number | null = null;

  get tableId(): number { return +this.route.snapshot.params['id']; }

  get categories(): string[] {
    return [...new Set(this.menuItems.map(m => m.category))];
  }

  get filteredMenu(): MenuItem[] {
    return this.activeCategory
      ? this.menuItems.filter(m => m.category === this.activeCategory)
      : this.menuItems;
  }

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      table: this.tableSvc.getById(this.tableId),
      menu:  this.menuSvc.getAll(undefined, true),
    }).pipe(
      switchMap(({ table, menu }) => {
        this.table     = table;
        this.menuItems = menu;
        // If table is occupied/billed, also load the active order before revealing UI
        if (table.status !== 'AVAILABLE') {
          return this.orderSvc.getByTable(this.tableId).pipe(
            catchError(() => of(null))  // 404 = no active order yet, treat as null
          );
        }
        return of(null);
      })
    ).subscribe({
      next: order => {
        if (order) this.order = order;
        this.loading = false;
        // Log first menu item to see actual field names from backend
        if (this.menuItems.length) console.log('[DEBUG] menu item sample:', this.menuItems[0]);
        console.log('[DEBUG] order:', this.order);
      },
      error: e => { this.error = e?.error?.message ?? 'Failed to load.'; this.loading = false; }
    });
  }

  loadOrder(): void {
    this.orderSvc.getByTable(this.tableId).subscribe({
      next: o => this.order = o,
      error: () => {}  // 404 = no active order, that's fine
    });
  }

  openTableAndOrder(): void {
    this.actionLoading = true;
    this.tableSvc.open(this.tableId).subscribe({
      next: t => {
        this.table = t;
        this.createOrder();
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Failed to open table.');
        this.actionLoading = false;
      }
    });
  }

  createOrder(): void {
    this.actionLoading = true;
    this.orderSvc.create({ tableId: this.tableId }).subscribe({
      next: o => {
        this.order = o;
        this.actionLoading = false;
        this.toast.success('Order created!');
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Failed to create order.');
        this.actionLoading = false;
      }
    });
  }

  /** Handles both 'isAvailable' (TS model) and 'available' (Java Jackson strips 'is' prefix) */
  isItemAvailable(item: MenuItem): boolean {
    // Java Jackson strips 'is' prefix from boolean getters → backend may send 'available' not 'isAvailable'
    const val = (item as any).isAvailable ?? (item as any).available ?? true;
    return Boolean(val);
  }

  addItem(item: MenuItem): void {
    if (!this.order) return;
    const orderId = this.order.id;
    this.addingItemId = item.id;
    this.orderSvc.addItem(orderId, { menuItemId: item.id, quantity: 1 }).subscribe({
      next: () => {
        this.addingItemId = null;
        this.toast.success(`Added ${item.name}`);
        // POST returns an OrderItem, not the full Order — reload the full order
        this.orderSvc.getByTable(this.tableId).subscribe({
          next: o => { if (o) this.order = o; },
          error: () => {}
        });
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Failed to add item.');
        this.addingItemId = null;
      }
    });
  }

  billTable(): void {
    this.actionLoading = true;
    this.tableSvc.bill(this.tableId).subscribe({
      next: t => {
        this.table = t;
        this.actionLoading = false;
        this.toast.success('Bill requested. Ready for payment.');
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Failed to bill table.');
        this.actionLoading = false;
      }
    });
  }

  pay(): void {
    if (!this.order) return;
    this.actionLoading = true;

    this.paymentSvc.createOrder({ orderId: this.order.id }).subscribe({
      next: resp => {
        this.actionLoading = false;
        const options = {
          key:      resp.razorpayKeyId,
          amount:   resp.amountInPaise,
          currency: resp.currency,
          order_id: resp.razorpayOrderId,
          name:     'RestoPOS',
          description: `Order #${this.order!.id} — Table ${this.table!.tableNumber}`,
          handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            this.verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
          },
          theme: { color: '#e94560' }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Failed to create payment.');
        this.actionLoading = false;
      }
    });
  }

  private verifyPayment(orderId: string, paymentId: string, sig: string): void {
    this.actionLoading = true;
    this.paymentSvc.verify({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: sig
    }).subscribe({
      next: () => {
        this.toast.success('Payment successful! Table is now available.');
        this.actionLoading = false;
        // Reload table + order state
        this.loadAll();
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Payment verification failed.');
        this.actionLoading = false;
      }
    });
  }

  subtotal(): number {
    return this.order?.items?.reduce((s, i) => s + i.priceAtOrderTime * i.quantity, 0) ?? 0;
  }

  tax(): number {
    return this.order?.items?.reduce((s, i) => s + (i.priceAtOrderTime * i.quantity * i.taxRateAtOrderTime / 100), 0) ?? 0;
  }

  total(): number { return this.subtotal() + this.tax(); }
}
