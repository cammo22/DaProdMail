
export interface Customer {
  id: string;
  name: string;
  email: string;
  categoryIds: string[];
}

export interface Category {
  id: string;
  name: string;
}

export interface EmailSettings {
  email: string;
  appPassword?: string; // Sensitive: In a real app, never store this in localStorage.
  googleApiKey?: string; // Sensitive: Manage securely, ideally via server env variables.
}

export interface AppState {
  customers: Customer[];
  categories: Category[];
  emailSettings: EmailSettings | null;
}

export interface AppStateContextType extends AppState {
  addCustomer: (customer: Omit<Customer, 'id' | 'categoryIds'> & { categoryIds?: string[] }) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  saveEmailSettings: (settings: EmailSettings) => void;
  getCustomerById: (customerId: string) => Customer | undefined;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCustomersByCategory: (categoryId: string) => Customer[];
  importCustomers: (newCustomers: Array<Omit<Customer, 'id' | 'categoryIds'>>) => void;
}
