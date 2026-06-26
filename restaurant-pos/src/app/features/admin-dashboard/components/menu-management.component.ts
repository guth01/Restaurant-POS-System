import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../../core/services/menu.service';
import { ToastService } from '../../../core/services/toast.service';
import { MenuItem, CreateMenuItemRequest } from '../../../shared/models';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="page-header">
        <div>
          <h1>Menu Management</h1>
          <p>{{ items.length }} items</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">+ Add Item</button>
      </div>

      <!-- Category filter -->
      <div class="chip-row">
        <span class="chip" [class.active]="!filterCat" (click)="filterCat = ''">All</span>
        @for (cat of categories; track cat) {
          <span class="chip" [class.active]="filterCat === cat" (click)="filterCat = cat">{{ cat }}</span>
        }
      </div>

      @if (loading) { <div class="loading">Loading…</div> }
      @else if (error) { <div class="error-banner">{{ error }}</div> }
      @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Price</th><th>Tax</th><th>Available</th><th>Prep</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered; track item.id) {
                <tr>
                  <td>
                    <div>{{ item.name }}</div>
                    <div class="text-muted text-sm">{{ item.description }}</div>
                  </td>
                  <td>{{ item.category }}</td>
                  <td>₹{{ item.price }}</td>
                  <td>{{ item.taxRate }}%</td>
                  <td>
                    <span class="badge" [class]="item.isAvailable ? 'badge-available' : 'badge-cancelled'">
                      {{ item.isAvailable ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td>{{ item.prepTimeMinutes ? item.prepTimeMinutes + 'm' : '—' }}</td>
                  <td>
                    <div style="display:flex;gap:8px;justify-content:flex-end">
                      <button class="btn btn-sm btn-outline" (click)="openEdit(item)">Edit</button>
                      <button class="btn btn-sm btn-danger" (click)="deleteItem(item)">Del</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>{{ editingId ? 'Edit' : 'Add' }} Menu Item</h2>

          <div class="grid-2">
            <div class="form-group">
              <label>Name *</label>
              <input [(ngModel)]="form.name" placeholder="Margherita Pizza" />
            </div>
            <div class="form-group">
              <label>Category *</label>
              <input [(ngModel)]="form.category" placeholder="Pizza, Drinks…" />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="form.description" rows="2"></textarea>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Price (₹) *</label>
              <input type="number" [(ngModel)]="form.price" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>Tax Rate (%)</label>
              <input type="number" [(ngModel)]="form.taxRate" placeholder="5" />
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Prep Time (min)</label>
              <input type="number" [(ngModel)]="form.prepTimeMinutes" placeholder="15" />
            </div>
            <div class="form-group">
              <label>Available</label>
              <select [(ngModel)]="form.isAvailable">
                <option [ngValue]="true">Yes</option>
                <option [ngValue]="false">No</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`.chip-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }`]
})
export class MenuManagementComponent implements OnInit {
  private menuSvc = inject(MenuService);
  private toast   = inject(ToastService);

  items: MenuItem[] = [];
  loading    = false;
  error      = '';
  filterCat  = '';
  showModal  = false;
  saving     = false;
  editingId: number | null = null;

  form: Partial<CreateMenuItemRequest> & { isAvailable: boolean } = this.emptyForm();

  get categories(): string[] {
    return [...new Set(this.items.map(i => i.category))];
  }

  get filtered(): MenuItem[] {
    return this.filterCat ? this.items.filter(i => i.category === this.filterCat) : this.items;
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.menuSvc.getAll().subscribe({
      next: data => { this.items = data; this.loading = false; },
      error: e => { this.error = e?.error?.message ?? 'Failed to load.'; this.loading = false; }
    });
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.editingId = null;
    this.showModal = true;
  }

  openEdit(item: MenuItem): void {
    this.form = { ...item };
    this.editingId = item.id;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  save(): void {
    if (!this.form.name || !this.form.category || this.form.price == null) {
      this.toast.error('Name, category and price are required.');
      return;
    }
    this.saving = true;
    const req = this.form as CreateMenuItemRequest;
    const obs = this.editingId
      ? this.menuSvc.update(this.editingId, req)
      : this.menuSvc.create(req);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Item updated.' : 'Item created.');
        this.saving = false;
        this.closeModal();
        this.load();
      },
      error: e => {
        this.toast.error(e?.error?.message ?? 'Save failed.');
        this.saving = false;
      }
    });
  }

  deleteItem(item: MenuItem): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.menuSvc.delete(item.id).subscribe({
      next: () => { this.toast.success('Deleted.'); this.load(); },
      error: e => this.toast.error(e?.error?.message ?? 'Delete failed.')
    });
  }

  private emptyForm() {
    return { name: '', description: '', price: 0, category: '', taxRate: 0, isAvailable: true, prepTimeMinutes: undefined as number | undefined };
  }
}
