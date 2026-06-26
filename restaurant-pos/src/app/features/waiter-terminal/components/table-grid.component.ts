import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableService } from '../../../core/services/table.service';
import { WebSocketService } from '../../../core/websocket/websocket.service';
import { ToastService } from '../../../core/services/toast.service';
import { RestaurantTable } from '../../../shared/models';

@Component({
  selector: 'app-table-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Table Overview</h1>
          <p>{{ tables.length }} tables · tap to manage</p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="load()">↻ Refresh</button>
      </div>

      <!-- Notification banner -->
      @if (readyNotifications.length) {
        <div class="ready-banner">
          🔔 Items ready at {{ readyNotifications.length === 1 ? 'Table ' + readyNotifications[0] : readyNotifications.length + ' tables' }}
          <button class="btn btn-sm btn-outline" (click)="readyNotifications = []">Dismiss</button>
        </div>
      }

      @if (loading) {
        <div class="loading">Loading tables…</div>
      } @else if (error) {
        <div class="error-banner">{{ error }}</div>
      } @else if (!tables.length) {
        <div class="empty-state">
          <div class="icon">🪑</div>
          <h3>No Tables</h3>
          <p>Ask an Admin to create tables first.</p>
        </div>
      } @else {
        <div class="table-grid">
          @for (table of tables; track table.id) {
            <div
              class="table-card status-{{ table.status | lowercase }}"
              (click)="openTable(table)"
            >
              <div class="table-number">T{{ table.tableNumber }}</div>
              <div class="table-cap">{{ table.capacity }} seats</div>
              <div class="badge badge-{{ table.status | lowercase }}">{{ table.status }}</div>
              @if (isReady(table.id)) {
                <div class="ready-dot">🟢 Item ready!</div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .table-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }
    .table-card {
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
      position: relative;
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
      &.status-available { border-color: var(--available); }
      &.status-occupied  { border-color: var(--occupied); }
      &.status-billed    { border-color: var(--billed); }
    }
    .table-number { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .table-cap    { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
    .ready-dot    { font-size: 11px; margin-top: 8px; color: var(--available); font-weight: 600; }
    .ready-banner {
      background: rgba(15,155,88,0.1);
      border: 1px solid rgba(15,155,88,0.3);
      border-radius: var(--radius);
      padding: 12px 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: var(--available);
      font-weight: 600;
    }
  `]
})
export class TableGridComponent implements OnInit, OnDestroy {
  private tableSvc = inject(TableService);
  private wsSvc    = inject(WebSocketService);
  private toast    = inject(ToastService);
  private router   = inject(Router);

  tables: RestaurantTable[] = [];
  loading = false;
  error   = '';
  readyNotifications: number[] = [];   // tableIds with ready items
  private sub?: Subscription;

  ngOnInit(): void {
    this.load();
    this.wsSvc.connect();
    this.sub = this.wsSvc.waiter$.subscribe(event => {
      if (event.status === 'READY' && !this.readyNotifications.includes(event.tableId)) {
        this.readyNotifications.push(event.tableId);
        this.toast.info(`🍽 ${event.itemNameSnapshot} is READY at Table ${event.tableId}`);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    this.loading = true;
    this.error   = '';
    this.tableSvc.getAll().subscribe({
      next: t => { this.tables = t; this.loading = false; },
      error: e => { this.error = e?.error?.message ?? 'Failed to load tables.'; this.loading = false; }
    });
  }

  openTable(table: RestaurantTable): void {
    this.router.navigate(['/waiter/table', table.id]);
  }

  isReady(tableId: number): boolean {
    return this.readyNotifications.includes(tableId);
  }
}
