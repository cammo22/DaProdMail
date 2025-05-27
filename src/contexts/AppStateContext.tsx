
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppState, AppStateContextType, Customer, Category, EmailSettings } from '@/types';

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

const initialAppState: AppState = {
  customers: [],
  categories: [],
  emailSettings: null,
};

const LOCAL_STORAGE_KEY = 'daProdMailAppState';

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        setAppState(JSON.parse(storedState));
      }
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
      } catch (error) {
        console.error("Failed to save state to localStorage:", error);
      }
    }
  }, [appState, isInitialized]);

  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'categoryIds'> & { categoryIds?: string[] }) => {
    setAppState(prevState => ({
      ...prevState,
      customers: [...prevState.customers, { ...customerData, id: crypto.randomUUID(), categoryIds: customerData.categoryIds || [] }],
    }));
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setAppState(prevState => ({
      ...prevState,
      customers: prevState.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c),
    }));
  }, []);

  const deleteCustomer = useCallback((customerId: string) => {
    setAppState(prevState => ({
      ...prevState,
      customers: prevState.customers.filter(c => c.id !== customerId),
    }));
  }, []);
  
  const getCustomerById = useCallback((customerId: string): Customer | undefined => {
    return appState.customers.find(c => c.id === customerId);
  }, [appState.customers]);

  const addCategory = useCallback((categoryData: Omit<Category, 'id'>) => {
    setAppState(prevState => ({
      ...prevState,
      categories: [...prevState.categories, { ...categoryData, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateCategory = useCallback((updatedCategory: Category) => {
    setAppState(prevState => ({
      ...prevState,
      categories: prevState.categories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat),
    }));
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setAppState(prevState => ({
      ...prevState,
      categories: prevState.categories.filter(cat => cat.id !== categoryId),
      customers: prevState.customers.map(c => ({
        ...c,
        categoryIds: c.categoryIds.filter(id => id !== categoryId),
      })),
    }));
  }, []);

  const getCategoryById = useCallback((categoryId: string): Category | undefined => {
    return appState.categories.find(cat => cat.id === categoryId);
  }, [appState.categories]);

  const getCustomersByCategory = useCallback((categoryId: string): Customer[] => {
    return appState.customers.filter(customer => customer.categoryIds.includes(categoryId));
  }, [appState.customers]);


  const saveEmailSettings = useCallback((settings: EmailSettings) => {
    setAppState(prevState => ({
      ...prevState,
      emailSettings: settings,
    }));
  }, []);

  const importCustomers = useCallback((newCustomersData: Array<Omit<Customer, 'id' | 'categoryIds'>>) => {
    setAppState(prevState => {
      const customersToAdd = newCustomersData.map(custData => ({
        ...custData,
        id: crypto.randomUUID(),
        categoryIds: [], // Imported customers start with no categories
      }));
      // Simple addition, no advanced duplicate checking for now
      return {
        ...prevState,
        customers: [...prevState.customers, ...customersToAdd],
      };
    });
  }, []);

  const value = {
    ...appState,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCustomersByCategory,
    saveEmailSettings,
    importCustomers,
  };

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
