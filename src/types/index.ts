
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
  appPassword?: string;
  googleApiKey?: string;
}

export interface CompanyInfo {
  companyName?: string;
  companyDetails?: string;
  // toneOfVoice rimosso
  website?: string;
}

export interface AppState {
  customers: Customer[];
  categories: Category[];
  emailSettings: EmailSettings | null;
  companyInfo: CompanyInfo | null;
}

export interface AppStateContextType extends AppState {
  addCustomer: (customer: Omit<Customer, 'id' | 'categoryIds'> & { categoryIds?: string[] }) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;
  deleteAllCustomers: () => void;
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  saveEmailSettings: (settings: EmailSettings) => void;
  getCustomerById: (customerId: string) => Customer | undefined;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCustomersByCategory: (categoryId: string) => Customer[];
  importCustomers: (newCustomers: Array<Omit<Customer, 'id' | 'categoryIds'> & { categoryIds?: string[] }>) => void;
  saveCompanyInfo: (info: CompanyInfo) => void;
}
