import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Activity Logs API functions
const activityLogsApi = {
  // Get activity logs with filters
  getActivityLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await fetch(`/api/activity-logs?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }
    return response.json();
  },

  // Get activity logs for specific entity
  getEntityActivityLogs: async ({ entityType, entityId }) => {
    const params = new URLSearchParams({
      entityType,
      entityId,
    });

    const response = await fetch(`/api/activity-logs?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch entity activity logs');
    }
    return response.json();
  },

  // Get activity logs for specific user
  getUserActivityLogs: async (userId, filters = {}) => {
    const params = new URLSearchParams({
      userId,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null && value !== '')
      ),
    });

    const response = await fetch(`/api/activity-logs?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user activity logs');
    }
    return response.json();
  },
};

// Action types enum
export const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  STATUS_CHANGE: 'status_change',
  ASSIGN: 'assign',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

// Entity types enum
export const ENTITY_TYPES = {
  WORK_ORDER: 'WorkOrder',
  INVOICE: 'Invoice',
  USER: 'User',
  FILE: 'File',
};

// Custom hooks
export const useActivityLogs = (filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', filters],
    queryFn: () => activityLogsApi.getActivityLogs(filters),
    enabled,
    staleTime: 1000 * 60 * 1, // 1 minute
    select: (data) => data.logs || [],
  });
};

export const useEntityActivityLogs = (entityType, entityId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'entity', entityType, entityId],
    queryFn: () => activityLogsApi.getEntityActivityLogs({ entityType, entityId }),
    enabled: enabled && !!entityType && !!entityId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (data) => data.logs || [],
  });
};

export const useUserActivityLogs = (userId, filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'user', userId, filters],
    queryFn: () => activityLogsApi.getUserActivityLogs(userId, filters),
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (data) => data.logs || [],
  });
};

// Specific entity hooks
export const useWorkOrderActivityLogs = (workOrderId, { enabled = true } = {}) => {
  return useEntityActivityLogs(ENTITY_TYPES.WORK_ORDER, workOrderId, { enabled });
};

export const useInvoiceActivityLogs = (invoiceId, { enabled = true } = {}) => {
  return useEntityActivityLogs(ENTITY_TYPES.INVOICE, invoiceId, { enabled });
};

export const useUserActivityHistory = (userId, { enabled = true } = {}) => {
  return useEntityActivityLogs(ENTITY_TYPES.USER, userId, { enabled });
};

// Filtered activity logs hooks
export const useActivityLogsByAction = (action, filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'action', action, filters],
    queryFn: () => activityLogsApi.getActivityLogs({ ...filters, action }),
    enabled: enabled && !!action,
    staleTime: 1000 * 60 * 2, // 2 minutes
    select: (data) => data.logs || [],
  });
};

export const useActivityLogsByDateRange = (startDate, endDate, filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'dateRange', startDate, endDate, filters],
    queryFn: () => activityLogsApi.getActivityLogs({ 
      ...filters, 
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0]
    }),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes for date range queries
    select: (data) => data.logs || [],
  });
};

// Recent activity hook
export const useRecentActivity = (limit = 10, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'recent', limit],
    queryFn: () => activityLogsApi.getActivityLogs({ limit }),
    enabled,
    staleTime: 1000 * 30, // 30 seconds for recent activity
    refetchInterval: 1000 * 60, // Auto-refresh every minute
    select: (data) => data.logs || [],
  });
};

// Activity statistics hook
export const useActivityStats = (filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'stats', filters],
    queryFn: () => activityLogsApi.getActivityLogs(filters),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => {
      const logs = data.logs || [];
      
      // Calculate statistics
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {});

      const entityCounts = logs.reduce((acc, log) => {
        acc[log.entityType] = (acc[log.entityType] || 0) + 1;
        return acc;
      }, {});

      const userCounts = logs.reduce((acc, log) => {
        const userId = log.user?._id || log.user;
        if (userId) {
          acc[userId] = (acc[userId] || 0) + 1;
        }
        return acc;
      }, {});

      // Get most active users
      const mostActiveUsers = Object.entries(userCounts)
        .map(([userId, count]) => {
          const userLog = logs.find(log => (log.user?._id || log.user) === userId);
          return {
            userId,
            userName: userLog?.user?.name || 'Unknown',
            activityCount: count,
          };
        })
        .sort((a, b) => b.activityCount - a.activityCount)
        .slice(0, 10);

      return {
        totalLogs: logs.length,
        actionCounts,
        entityCounts,
        userCounts,
        mostActiveUsers,
        dateRange: logs.length > 0 ? {
          earliest: new Date(Math.min(...logs.map(log => new Date(log.timestamp)))),
          latest: new Date(Math.max(...logs.map(log => new Date(log.timestamp)))),
        } : null,
      };
    },
  });
};

// Real-time activity hook (for admin dashboard)
export const useRealTimeActivity = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'realtime'],
    queryFn: () => activityLogsApi.getActivityLogs({ limit: 20 }),
    enabled,
    staleTime: 0, // Always fresh
    refetchInterval: 1000 * 30, // Refresh every 30 seconds
    select: (data) => data.logs || [],
  });
};

// Security audit hook
export const useSecurityAudit = (filters = {}, { enabled = true } = {}) => {
  const securityActions = [ACTION_TYPES.LOGIN, ACTION_TYPES.LOGOUT, ACTION_TYPES.DELETE];
  
  return useQuery({
    queryKey: ['activityLogs', 'security', filters],
    queryFn: () => activityLogsApi.getActivityLogs(filters),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => {
      const logs = data.logs || [];
      return logs.filter(log => securityActions.includes(log.action));
    },
  });
};

// Invalidation helpers
export const useInvalidateActivityLogs = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] });
    },
    invalidateEntity: (entityType, entityId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['activityLogs', 'entity', entityType, entityId] 
      });
    },
    invalidateUser: (userId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['activityLogs', 'user', userId] 
      });
    },
    invalidateRecent: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['activityLogs', 'recent'] 
      });
    },
    invalidateRealTime: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['activityLogs', 'realtime'] 
      });
    },
  };
};

// Pagination hook for large datasets
export const usePaginatedActivityLogs = (filters = {}, { enabled = true, pageSize = 50 } = {}) => {
  return useQuery({
    queryKey: ['activityLogs', 'paginated', filters, pageSize],
    queryFn: () => activityLogsApi.getActivityLogs({ ...filters, limit: pageSize }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    keepPreviousData: true, // Keep previous data while fetching new data
    select: (data) => ({
      logs: data.logs || [],
      total: data.total || 0,
      hasMore: (data.logs || []).length === pageSize,
    }),
  });
};