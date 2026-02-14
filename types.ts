
export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: 'food_items' | 'general_goods' | 'luxury_items';
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  gstRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerId?: string;
  customerMobile?: string;
  items: InvoiceItem[];
  subTotal: number;
  gstTotal: number;
  grandTotal: number;
  date: string;
  paymentStatus: 'Paid' | 'Pending';
  paymentMode?: 'UPI' | 'Cash' | 'Card';
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  visitCount: number;
  totalSpent: number;
  lastVisit: string;
}

export interface Reminder {
  id: string;
  text: string;
  dueDate: string;
  status: 'Pending' | 'Completed';
}

export type AppView = 'dashboard' | 'chat' | 'invoices' | 'customers' | 'products' | 'reminders';

export interface AIResponse {
  intent: 'billing' | 'query' | 'payment' | 'reminder' | 'unknown';
  message: string;
  extractedData?: any;
}
