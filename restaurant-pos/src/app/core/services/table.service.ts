import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantTable, CreateTableRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class TableService {
  private base = `${environment.gatewayUrl}/tables`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(this.base);
  }

  getById(id: number): Observable<RestaurantTable> {
    return this.http.get<RestaurantTable>(`${this.base}/${id}`);
  }

  create(req: CreateTableRequest): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>(this.base, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  open(id: number): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`${this.base}/${id}/open`, {});
  }

  bill(id: number): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`${this.base}/${id}/bill`, {});
  }

  close(id: number): Observable<RestaurantTable> {
    return this.http.put<RestaurantTable>(`${this.base}/${id}/close`, {});
  }
}
