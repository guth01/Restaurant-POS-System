// ── Auth ──────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'WAITER' | 'KITCHEN';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  [key: string]: unknown;
}

export interface CurrentUser {
  userId: number;
  email: string;
  name?: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;       // email
  userId: number;
  role: Role;
  exp: number;
  iat: number;
}

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  taxRate: number;
  isAvailable: boolean;
  prepTimeMinutes?: number;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  category: string;
  taxRate: number;
  isAvailable: boolean;
  prepTimeMinutes?: number;
}

// ── Table ─────────────────────────────────────────────────────────────────────
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILLED';

export interface RestaurantTable {
  id: number;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  waiterId?: number;
}

export interface CreateTableRequest {
  tableNumber: number;
  capacity: number;
}

// ── Order ─────────────────────────────────────────────────────────────────────
export type OrderStatus = 'OPEN' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'CLOSED' | 'CANCELLED';
export type ItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  menuItemId: number;
  itemNameSnapshot: string;
  priceAtOrderTime: number;
  taxRateAtOrderTime: number;
  quantity: number;
  status: ItemStatus;
}

export interface Order {
  id: number;
  tableId: number;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  tableId: number;
}

export interface AddOrderItemRequest {
  menuItemId: number;
  quantity: number;
}

export interface UpdateItemStatusRequest {
  status: ItemStatus;
}

// ── Payment ───────────────────────────────────────────────────────────────────
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface CreatePaymentOrderRequest {
  orderId: number;
}

export interface CreatePaymentOrderResponse {
  paymentId: number;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amountInPaise: number;
  totalAmount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentResponse {
  id: number;
  orderId: number;
  status: PaymentStatus;
  totalAmount?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
export interface ItemStatusEvent {
  orderId: number;
  tableId: number;
  itemId: number;
  menuItemId: number;
  itemNameSnapshot: string;
  quantity: number;
  status: ItemStatus;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
