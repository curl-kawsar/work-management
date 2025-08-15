import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Work Orders API functions
const workOrdersApi = {
  // Get all work orders
  getWorkOrders: async () => {
    const response = await fetch('/api/work-orders');
    if (!response.ok) {
      throw new Error('Failed to fetch work orders');
    }
    return response.json();
  },

  // Get single work order
  getWorkOrder: async (id) => {
    const response = await fetch(`/api/work-orders/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch work order');
    }
    return response.json();
  },

  // Create work order
  createWorkOrder: async (workOrderData) => {
    const response = await fetch('/api/work-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workOrderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create work order');
    }

    return response.json();
  },

  // Update work order
  updateWorkOrder: async ({ id, data }) => {
    const response = await fetch(`/api/work-orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update work order');
    }

    return response.json();
  },

  // Delete work order
  deleteWorkOrder: async (id) => {
    const response = await fetch(`/api/work-orders/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete work order');
    }

    return response.json();
  },

  // Send deletion verification email
  sendDeletionVerification: async (workOrderId) => {
    const response = await fetch('/api/work-orders/delete-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workOrderId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send verification email');
    }

    return response.json();
  },

  // Verify deletion code and delete
  verifyAndDelete: async ({ workOrderId, verificationCode }) => {
    const response = await fetch('/api/work-orders/delete-verification', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workOrderId, verificationCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to verify and delete work order');
    }

    return response.json();
  },
};

// Custom hooks
export const useWorkOrders = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['workOrders'],
    queryFn: workOrdersApi.getWorkOrders,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (data) => data.workOrders || [],
  });
};

export const useWorkOrder = (id, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => workOrdersApi.getWorkOrder(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.workOrder,
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrdersApi.createWorkOrder,
    onSuccess: (data) => {
      // Invalidate and refetch work orders list
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      
      // Add the new work order to the cache
      if (data.workOrder) {
        queryClient.setQueryData(['workOrder', data.workOrder._id], data);
      }
    },
    onError: (error) => {
      console.error('Create work order failed:', error);
    },
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrdersApi.updateWorkOrder,
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workOrder', id] });

      // Snapshot the previous value
      const previousWorkOrder = queryClient.getQueryData(['workOrder', id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['workOrder', id], (old) => ({
        ...old,
        workOrder: { ...old?.workOrder, ...data }
      }));

      return { previousWorkOrder };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousWorkOrder) {
        queryClient.setQueryData(['workOrder', id], context.previousWorkOrder);
      }
    },
    onSuccess: (data, { id }) => {
      // Update the specific work order in cache
      queryClient.setQueryData(['workOrder', id], data);
      
      // Invalidate work orders list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrdersApi.deleteWorkOrder,
    onSuccess: (data, id) => {
      // Remove the work order from cache
      queryClient.removeQueries({ queryKey: ['workOrder', id] });
      
      // Invalidate work orders list
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      
      // Also invalidate files for this work order
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error) => {
      console.error('Delete work order failed:', error);
    },
  });
};

export const useSendDeletionVerification = () => {
  return useMutation({
    mutationFn: workOrdersApi.sendDeletionVerification,
    onError: (error) => {
      console.error('Send deletion verification failed:', error);
    },
  });
};

export const useVerifyAndDeleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workOrdersApi.verifyAndDelete,
    onSuccess: (data, { workOrderId }) => {
      // Remove the work order from cache
      queryClient.removeQueries({ queryKey: ['workOrder', workOrderId] });
      
      // Invalidate work orders list
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      
      // Also invalidate files for this work order
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (error) => {
      console.error('Verify and delete work order failed:', error);
    },
  });
};

// Utility hooks for filtered data
export const useWorkOrdersByStatus = (status, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['workOrders', 'status', status],
    queryFn: workOrdersApi.getWorkOrders,
    enabled,
    select: (data) => {
      const workOrders = data.workOrders || [];
      return status ? workOrders.filter(wo => wo.status === status) : workOrders;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Legacy hook - kept for backward compatibility but API now handles filtering
export const useWorkOrdersByStaff = (staffId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['workOrders', 'staff', staffId],
    queryFn: workOrdersApi.getWorkOrders,
    enabled: enabled && !!staffId,
    select: (data) => {
      console.log('Staff work orders raw data:', data);
      // The API already filters work orders for staff users, so just return them
      return data.workOrders || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useWorkOrdersMetrics = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['workOrders', 'metrics'],
    queryFn: workOrdersApi.getWorkOrders,
    enabled,
    select: (data) => {
      const workOrders = data.workOrders || [];
      return {
        total: workOrders.length,
        created: workOrders.filter(wo => wo.status === 'Created').length,
        ongoing: workOrders.filter(wo => wo.status === 'Ongoing').length,
        completed: workOrders.filter(wo => wo.status === 'Completed').length,
        cancelled: workOrders.filter(wo => wo.status === 'Cancelled').length,
        overdue: workOrders.filter(wo => {
          const dueDate = new Date(wo.dueDate);
          const now = new Date();
          return wo.status !== 'Completed' && wo.status !== 'Cancelled' && dueDate < now;
        }).length,
      };
    },
    staleTime: 1000 * 60 * 1, // 1 minute for metrics
  });
};