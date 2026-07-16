import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  dashboard: ['dashboard'],
  vehicles: ['vehicles'],
  vehicle: (id) => ['vehicles', id],
  vehicleMileage: (id) => ['vehicles', id, 'mileage'],
  vehicleMaintenance: (id) => ['vehicles', id, 'maintenance'],
  brands: ['brands'],
  documents: (type) => ['documents', type || 'all'],
  expenses: (category) => ['expenses', category || 'all'],
  expenseStats: ['expenses', 'stats'],
};
