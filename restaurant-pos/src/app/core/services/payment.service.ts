import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePaymentOrderRequest, CreatePaymentOrderResponse,
  VerifyPaymentRequest, PaymentResponse
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = `${environment.gatewayUrl}/payments`;

  constructor(private http: HttpClient) {}

  createOrder(req: CreatePaymentOrderRequest): Observable<CreatePaymentOrderResponse> {
    return this.http.post<CreatePaymentOrderResponse>(`${this.base}/create-order`, req);
  }

  verify(req: VerifyPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.base}/verify`, req);
  }

  getById(id: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.base}/${id}`);
  }
}
