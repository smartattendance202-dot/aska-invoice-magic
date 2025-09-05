// ASKA Invoice LocalStorage Data Management

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  taxNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description_ar: string;
  description_en: string;
  qty: number;
  unit_price: number;
  line_total: number;
  notes?: string;
}

export type InvoiceType = 'cash' | 'quote' | 'credit';

export interface Invoice {
  id: string;
  number: string;
  type: InvoiceType;
  customerId: string;
  issueDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxPercent: number;
  discountPercent: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  lastInvoiceNumber: number;
  defaultTaxPercent: number;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
}

// Storage Keys
const STORAGE_KEYS = {
  customers: 'aska.customers',
  invoices: 'aska.invoices',
  settings: 'aska.settings'
} as const;

// UUID Generator
const generateId = (): string => {
  return crypto.randomUUID();
};

// Generic Storage Operations
class Storage<T> {
  constructor(private key: string) {}

  getAll(): T[] {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  get(id: string): T | undefined {
    const items = this.getAll();
    return items.find((item: any) => item.id === id);
  }

  create(data: Omit<T, 'id' | 'createdAt'>): T {
    const newItem = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    } as T;

    const items = this.getAll();
    items.push(newItem);
    localStorage.setItem(this.key, JSON.stringify(items));
    return newItem;
  }

  update(id: string, data: Partial<T>): T | null {
    const items = this.getAll();
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index === -1) return null;

    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    } as T;

    items[index] = updatedItem;
    localStorage.setItem(this.key, JSON.stringify(items));
    return updatedItem;
  }

  delete(id: string): boolean {
    const items = this.getAll();
    const newItems = items.filter((item: any) => item.id !== id);
    
    if (newItems.length === items.length) return false;
    
    localStorage.setItem(this.key, JSON.stringify(newItems));
    return true;
  }
}

// Storage Instances
export const customersStorage = new Storage<Customer>(STORAGE_KEYS.customers);
export const invoicesStorage = new Storage<Invoice>(STORAGE_KEYS.invoices);

// Settings Storage
export const settingsStorage = {
  get(): Settings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.settings);
      return data ? JSON.parse(data) : {
        lastInvoiceNumber: 0,
        defaultTaxPercent: 15,
        companyName: 'أسكا المغربي للتجارة والديكور',
        companyAddress: 'تعز، اليمن',
        companyPhone: '+967 777 777 777'
      };
    } catch {
      return {
        lastInvoiceNumber: 0,
        defaultTaxPercent: 15,
        companyName: 'أسكا المغربي للتجارة والديكور',
        companyAddress: 'تعز، اليمن',
        companyPhone: '+967 777 777 777'
      };
    }
  },

  update(data: Partial<Settings>): Settings {
    const current = this.get();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated));
    return updated;
  }
};

// Initialize Sample Data
export const initializeSampleData = () => {
  if (customersStorage.getAll().length === 0) {
    customersStorage.create({
      name: 'شركة المثال',
      phone: '777777777',
      address: 'تعز',
      taxNumber: '123456789',
      notes: 'عميل مهم'
    });
  }

  if (invoicesStorage.getAll().length === 0) {
    const customers = customersStorage.getAll();
    if (customers.length > 0) {
      invoicesStorage.create({
        number: 'INV-2025-0001',
        type: 'cash',
        customerId: customers[0].id,
        issueDate: new Date().toISOString().split('T')[0],
        items: [{
          id: generateId(),
          description_ar: 'دهان داخلي',
          description_en: 'Interior Paint',
          qty: 3,
          unit_price: 50,
          line_total: 150,
        }],
        subtotal: 150,
        taxPercent: 15,
        discountPercent: 0,
        taxAmount: 22.5,
        discountAmount: 0,
        total: 172.5,
        notes: 'شكراً لتعاملكم معنا',
        updatedAt: new Date().toISOString(),
      });
    }
  }
};

// Invoice Number Generation
export const generateInvoiceNumber = (): string => {
  const settings = settingsStorage.get();
  const nextNumber = settings.lastInvoiceNumber + 1;
  const year = new Date().getFullYear();
  const number = `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
  
  settingsStorage.update({ lastInvoiceNumber: nextNumber });
  return number;
};

// Calculate Invoice Totals
export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  taxPercent: number,
  discountPercent: number
) => {
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};