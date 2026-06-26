import { Injectable, signal } from '@angular/core';
import { Toast } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(msg: string)         { this.show(msg, 'success'); }
  error(msg: string)           { this.show(msg, 'error'); }
  info(msg: string)            { this.show(msg, 'info'); }

  remove(id: string): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
