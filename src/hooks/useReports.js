import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Reports API functions
const reportsApi = {
  // Get reports data
  getReport: async ({ type, filters = {} }) => {
    const params = new URLSearchParams({
      type,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value != null && value !== '')
      ),
    });

    const response = await fetch(`/api/reports?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch report data');
    }
    return response.json();
  },

  // Get companies for filtering
  getCompanies: async () => {
    const response = await fetch('/api/companies');
    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }
    return response.json();
  },

  // Get dashboard metrics
  getDashboardMetrics: async () => {
    const response = await fetch('/api/dashboard');
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard metrics');
    }
    return response.json();
  },
};

// Report types enum
export const REPORT_TYPES = {
  OVERVIEW: 'overview',
  FINANCIAL: 'financial',
  STAFF_PERFORMANCE: 'staff-performance',
  WORK_ORDERS: 'work-orders',
};

// Custom hooks for reports
export const useOverviewReport = (filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['reports', 'overview', filters],
    queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.OVERVIEW, filters }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useFinancialReport = (filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['reports', 'financial', filters],
    queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.FINANCIAL, filters }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useStaffPerformanceReport = (filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['reports', 'staff-performance', filters],
    queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.STAFF_PERFORMANCE, filters }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useWorkOrdersReport = (filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['reports', 'work-orders', filters],
    queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.WORK_ORDERS, filters }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Generic report hook
export const useReport = (type, filters = {}, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['reports', type, filters],
    queryFn: () => reportsApi.getReport({ type, filters }),
    enabled: enabled && !!type,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Companies hook for report filtering
export const useCompanies = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: reportsApi.getCompanies,
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes - companies don't change often
    select: (data) => data.companies || [],
  });
};

// Dashboard metrics hook
export const useDashboardMetrics = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: reportsApi.getDashboardMetrics,
    enabled,
    staleTime: 1000 * 60 * 1, // 1 minute for dashboard
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 minutes
  });
};

// Combined hook for all report types (useful for caching)
export const useAllReports = (filters = {}, { enabled = true } = {}) => {
  const overview = useOverviewReport(filters, { enabled });
  const financial = useFinancialReport(filters, { enabled });
  const staffPerformance = useStaffPerformanceReport(filters, { enabled });
  const workOrders = useWorkOrdersReport(filters, { enabled });

  return {
    overview,
    financial,
    staffPerformance,
    workOrders,
    isLoading: overview.isLoading || financial.isLoading || staffPerformance.isLoading || workOrders.isLoading,
    isError: overview.isError || financial.isError || staffPerformance.isError || workOrders.isError,
    error: overview.error || financial.error || staffPerformance.error || workOrders.error,
  };
};

// Prefetch hooks for better performance
export const usePrefetchReports = () => {
  const queryClient = useQueryClient();

  return {
    prefetchOverview: (filters = {}) => {
      queryClient.prefetchQuery({
        queryKey: ['reports', 'overview', filters],
        queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.OVERVIEW, filters }),
        staleTime: 1000 * 60 * 2,
      });
    },
    prefetchFinancial: (filters = {}) => {
      queryClient.prefetchQuery({
        queryKey: ['reports', 'financial', filters],
        queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.FINANCIAL, filters }),
        staleTime: 1000 * 60 * 2,
      });
    },
    prefetchStaffPerformance: (filters = {}) => {
      queryClient.prefetchQuery({
        queryKey: ['reports', 'staff-performance', filters],
        queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.STAFF_PERFORMANCE, filters }),
        staleTime: 1000 * 60 * 2,
      });
    },
    prefetchWorkOrders: (filters = {}) => {
      queryClient.prefetchQuery({
        queryKey: ['reports', 'work-orders', filters],
        queryFn: () => reportsApi.getReport({ type: REPORT_TYPES.WORK_ORDERS, filters }),
        staleTime: 1000 * 60 * 2,
      });
    },
  };
};

// Export utility hook
export const useExportReport = () => {
  return useMutation({
    mutationFn: async ({ reportData, reportType, filters, format = 'pdf' }) => {
      // This would typically call a server endpoint for export
      // For now, we'll use the client-side export utilities
      const { exportToPDF, exportToExcel } = await import('@/components/reports/ExportUtils');
      
      if (format === 'pdf') {
        exportToPDF(reportData, reportType, filters);
      } else if (format === 'excel') {
        exportToExcel(reportData, reportType, filters);
      }
      
      return { success: true, format, reportType };
    },
    onSuccess: (data) => {
      console.log(`${data.format.toUpperCase()} export completed for ${data.reportType} report`);
    },
    onError: (error) => {
      console.error('Export failed:', error);
    },
  });
};

// Invalidation helpers
export const useInvalidateReports = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    invalidateOverview: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'overview'] });
    },
    invalidateFinancial: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'financial'] });
    },
    invalidateStaffPerformance: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'staff-performance'] });
    },
    invalidateWorkOrders: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'work-orders'] });
    },
    invalidateDashboard: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  };
};