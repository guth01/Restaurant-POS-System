import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Order, CreateOrderRequest, AddOrderItemRequest, UpdateItemStatusRequest
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = `${environment.gatewayUrl}/orders`;

  constructor(private http: HttpClient) {}

  create(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.base, req);
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  getByTable(tableId: number): Observable<Order> {
    // Backend returns an array; take the newest order by sorting ID descending
    return this.http.get<Order[]>(`${this.base}/table/${tableId}`).pipe(
      map(orders => {
        if (!orders || orders.length === 0) return null as any;
        return [...orders].sort((a, b) => b.id - a.id)[0];
      })
    );
  }

  addItem(orderId: number, req: AddOrderItemRequest): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${orderId}/items`, req);
  }

  updateItemStatus(itemId: number, req: UpdateItemStatusRequest): Observable<Order> {
    return this.http.put<Order>(`${this.base}/items/${itemId}/status`, req);
  }

  closeOrder(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${this.base}/${orderId}/close`, {});
  }
}
