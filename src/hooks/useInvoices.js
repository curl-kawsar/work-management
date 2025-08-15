import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Invoices API functions
const invoicesApi = {
  // Get all invoices
  getInvoices: async () => {
    const response = await fetch('/api/invoices');
    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }
    return response.json();
  },

  // Get single invoice
  getInvoice: async (id) => {
    const response = await fetch(`/api/invoices/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }
    return response.json();
  },

  // Create invoice
  createInvoice: async (invoiceData) => {
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create invoice');
    }

    return response.json();
  },

  // Update invoice
  updateInvoice: async ({ id, data }) => {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update invoice');
    }

    return response.json();
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete invoice');
    }

    return response.json();
  },
};

// Custom hooks
export const useInvoices = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: invoicesApi.getInvoices,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (data) => data?.invoices || [],
  });
};

export const useInvoice = (id, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.invoice,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.createInvoice,
    onSuccess: (data) => {
      // Invalidate and refetch invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      
      // Add the new invoice to the cache
      if (data.invoice) {
        queryClient.setQueryData(['invoice', data.invoice._id], data);
      }
    },
    onError: (error) => {
      console.error('Create invoice failed:', error);
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.updateInvoice,
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['invoice', id] });

      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData(['invoice', id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['invoice', id], (old) => ({
        ...old,
        invoice: { ...old?.invoice, ...data }
      }));

      return { previousInvoice };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInvoice) {
        queryClient.setQueryData(['invoice', id], context.previousInvoice);
      }
    },
    onSuccess: (data, { id }) => {
      // Update the specific invoice in cache
      queryClient.setQueryData(['invoice', id], data);
      
      // Invalidate invoices list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoicesApi.deleteInvoice,
    onSuccess: (data, id) => {
      // Remove the invoice from cache
      queryClient.removeQueries({ queryKey: ['invoice', id] });
      
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      console.error('Delete invoice failed:', error);
    },
  });
};

// Utility hooks for filtered and aggregated data
export const useInvoicesByStatus = (status, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['invoices', 'status', status],
    queryFn: invoicesApi.getInvoices,
    enabled,
    select: (data) => {
      const invoices = data.invoices || [];
      return status ? invoices.filter(inv => inv.status === status) : invoices;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useInvoicesByWorkOrder = (workOrderId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['invoices', 'workOrder', workOrderId],
    queryFn: invoicesApi.getInvoices,
    enabled: enabled && !!workOrderId,
    select: (data) => {
      const invoices = data.invoices || [];
      return invoices.filter(inv => inv.workOrder === workOrderId || inv.workOrder?._id === workOrderId);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useInvoicesMetrics = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['invoices', 'metrics'],
    queryFn: invoicesApi.getInvoices,
    enabled,
    select: (data) => {
      const invoices = data.invoices || [];
      
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.revenue || 0), 0);
      const totalClientPayments = invoices.reduce((sum, inv) => sum + (inv.totalClientPayment || 0), 0);
      const totalExpenses = invoices.reduce((sum, inv) => 
        sum + (inv.totalMaterialCost || 0) + (inv.totalLaborCost || 0) + (inv.totalUtilityCost || 0), 0);

      return {
        total: invoices.length,
        draft: invoices.filter(inv => inv.status === 'draft').length,
        sent: invoices.filter(inv => inv.status === 'sent').length,
        paid: invoices.filter(inv => inv.status === 'paid').length,
        overdue: invoices.filter(inv => inv.status === 'overdue').length,
        totalRevenue,
        totalClientPayments,
        totalExpenses,
        profitMargin: totalClientPayments > 0 ? ((totalRevenue / totalClientPayments) * 100).toFixed(1) : 0,
      };
    },
    staleTime: 1000 * 60 * 1, // 1 minute for metrics
  });
};

export const useRevenueByMonth = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['invoices', 'revenueByMonth'],
    queryFn: invoicesApi.getInvoices,
    enabled,
    select: (data) => {
      const invoices = data.invoices || [];
      const now = new Date();
      const monthlyData = {};

      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          expenses: 0,
          clientPayments: 0,
          count: 0,
        };
      }

      // Aggregate data by month
      invoices.forEach(invoice => {
        if (invoice.issueDate) {
          const issueDate = new Date(invoice.issueDate);
          const monthKey = issueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].revenue += invoice.revenue || 0;
            monthlyData[monthKey].expenses += (invoice.totalMaterialCost || 0) + 
                                            (invoice.totalLaborCost || 0) + 
                                            (invoice.totalUtilityCost || 0);
            monthlyData[monthKey].clientPayments += invoice.totalClientPayment || 0;
            monthlyData[monthKey].count += 1;
          }
        }
      });

      return Object.values(monthlyData);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};