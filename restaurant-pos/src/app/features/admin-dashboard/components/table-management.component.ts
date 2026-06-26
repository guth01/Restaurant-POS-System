import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService } from '../../../core/services/table.service';
import { ToastService } from '../../../core/services/toast.service';
import { RestaurantTable } from '../../../shared/models';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1>Table Management</h1>
          <p>{{ tables.length }} tables</p>
        </div>
        <button class="btn btn-primary" (click)="showModal = true">+ Add Table</button>
      </div>

      @if (loading) { <div class="loading">Loading…</div> }
      @else if (error) { <div class="error-banner">{{ error }}</div> }
      @else if (!tables.length) {
        <div class="empty-state">
          <div class="icon">🪑</div>
          <h3>No Tables Yet</h3>
          <p>Add your first table to get started.</p>
        </div>
      } @else {
        <div class="table-cards">
          @for (t of tables; track t.id) {
            <div class="table-card status-{{ t.status | lowercase }}">
              <div class="tc-number">T{{ t.tableNumber }}</div>
              <div class="tc-info">
                <span class="badge badge-{{ t.status | lowercase }}">{{ t.status }}</span>
                <span class="text-muted text-sm">{{ t.capacity }} seats</span>
              </div>
              <button
                class="btn btn-sm btn-danger"
                [disabled]="t.status !== 'AVAILABLE'"
                (click)="deleteTable(t)"
                title="{{ t.status !== 'AVAILABLE' ? 'Cannot delete occupied table' : '' }}"
              >
                ✕
              </button>
            </div>
          }
        </div>
      }
    </div>

    @if (showModal) {
      <div class="modal-overlay" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Add Table</h2>
          <div class="grid-2">
            <div class="form-group">
              <label>Table Number *</label>
              <input type="number" [(ngModel)]="form.tableNumber" placeholder="1" min="1" />
            </div>
            <div class="form-group">
              <label>Capacity *</label>
              <input type="number" [(ngModel)]="form.capacity" placeholder="4" min="1" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="addTable()" [disabled]="saving">
              {{ saving ? 'Adding…' : 'Add Table' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .table-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .table-card {
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      &.status-available { border-color: var(--available); }
      &.status-occupied  { border-color: var(--occupied); }
      &.status-billed    { border-color: var(--billed); }
    }
    .tc-number { font-size: 32px; font-weight: 700; }
    .tc-info { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  `]
})
export class TableManagementComponent implements OnInit {
  private tableSvc = inject(TableService);
  private toast    = inject(ToastService);

  tables: RestaurantTable[] = [];
  loading   = false;
  error     = '';
  showModal = false;
  saving    = false;
  form      = { tableNumber: null as number | null, capacity: null as number | null };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.tableSvc.getAll().subscribe({
      next: t => { this.tables = t; this.loading = false; },
      error: e => { this.error = e?.error?.message ?? 'Failed to load.'; this.loading = false; }
    });
  }

  addTable(): void {
    if (!this.form.tableNumber || !this.form.capacity) {
      this.toast.error('Table number and capacity are required.');
      return;
    }
    this.saving = true;
    this.tableSvc.create({ tableNumber: this.form.tableNumber, capacity: this.form.capacity }).subscribe({
      next: () => {
        this.toast.success('Table added!');
        this.saving = false;
        this.showModal = false;
        this.form = { tableNumber: null, capacity: null };
        this.load();
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Failed to add table.');
        this.saving = false;
      }
    });
  }

  deleteTable(t: RestaurantTable): void {
    if (!confirm(`Delete Table ${t.tableNumber}?`)) return;
    this.tableSvc.delete(t.id).subscribe({
      next: () => { this.toast.success('Table deleted.'); this.load(); },
      error: e => this.toast.error(e?.error?.message ?? 'Failed to delete.')
    });
  }
}
