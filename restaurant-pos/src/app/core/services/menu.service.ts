import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MenuItem, CreateMenuItemRequest } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private base = `${environment.gatewayUrl}/menu-items`;

  constructor(private http: HttpClient) {}

  getAll(category?: string, availableOnly?: boolean): Observable<MenuItem[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (availableOnly != null) params = params.set('availableOnly', String(availableOnly));
    return this.http.get<MenuItem[]>(this.base, { params });
  }

  create(req: CreateMenuItemRequest): Observable<MenuItem> {
    return this.http.post<MenuItem>(this.base, req);
  }

  update(id: number, req: Partial<CreateMenuItemRequest>): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
