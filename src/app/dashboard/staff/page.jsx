"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuickAddProgress from '@/components/work-orders/QuickAddProgress';
import { 
  BarChart, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Wrench,
  Plus,
  Eye,
  Edit,
  Upload,
  AlertCircle,
  Calendar,
  Target,
  Activity,
  Zap,
  Bell,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import { useWorkOrders, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { useInvoices } from '@/hooks/useInvoices';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import React from 'react';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS = {
  'Created': 'bg-blue-100 text-blue-800',
  'Ongoing': 'bg-yellow-100 text-yellow-800',
  'Completed': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeQuickAdd, setActiveQuickAdd] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);

  // Tanstack Query hooks - API already filters for staff users
  const { 
    data: staffWorkOrders = [], 
    isLoading: loadingWorkOrders,
    refetch: refetchWorkOrders
  } = useWorkOrders({
    enabled: !!session?.user?.id && session?.user?.role === 'staff'
  });

  const { data: allInvoices = [] } = useInvoices();
  const { data: recentActivity = [] } = useActivityLogs({
    limit: 10,
    userId: session?.user?.id
  });

  // Debug logging for staff dashboard
  useEffect(() => {
    if (session?.user?.role === 'staff') {
      console.log('Staff Dashboard Debug:', {
        userId: session.user.id,
        userName: session.user.name,
        workOrdersCount: staffWorkOrders?.length || 0,
        workOrders: staffWorkOrders,
        loading: loadingWorkOrders
      });
    }
  }, [session, staffWorkOrders, loadingWorkOrders]);

  const updateWorkOrderMutation = useUpdateWorkOrder();

  useEffect(() => {
    // Redirect if not authenticated or not staff
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user && session.user.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Enhanced metrics calculation
  const metrics = React.useMemo(() => {
    if (!staffWorkOrders.length) {
      return {
        totalWorkOrders: 0,
        completedWorkOrders: 0,
        ongoingWorkOrders: 0,
        todayWorkOrders: 0,
        overdueWorkOrders: 0,
        thisWeekCompleted: 0,
        avgCompletionTime: 0,
        totalRevenue: 0,
      };
    }

    const today = startOfDay(new Date());
    const completed = staffWorkOrders.filter(wo => wo.status === 'Completed');
    const ongoing = staffWorkOrders.filter(wo => wo.status === 'Ongoing');
    const todayOrders = staffWorkOrders.filter(wo => {
      const scheduleDate = new Date(wo.scheduleDate);
      return isToday(scheduleDate);
    });
    const overdue = staffWorkOrders.filter(wo => {
      const dueDate = new Date(wo.dueDate);
      return isPast(dueDate) && wo.status !== 'Completed';
    });

    // Calculate revenue from invoices for this staff's work orders
    const staffWorkOrderIds = staffWorkOrders.map(wo => wo._id);
    const staffInvoices = allInvoices.filter(invoice => 
      staffWorkOrderIds.includes(invoice.workOrder?._id)
    );
    const totalRevenue = staffInvoices.reduce((sum, invoice) => sum + (invoice.revenue || 0), 0);

    return {
      totalWorkOrders: staffWorkOrders.length,
      completedWorkOrders: completed.length,
      ongoingWorkOrders: ongoing.length,
      todayWorkOrders: todayOrders.length,
      overdueWorkOrders: overdue.length,
      thisWeekCompleted: completed.filter(wo => {
        const completedDate = new Date(wo.updatedAt);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return completedDate >= weekAgo;
      }).length,
      totalRevenue,
    };
  }, [staffWorkOrders, allInvoices]);

  // Filter work orders
  const filteredWorkOrders = React.useMemo(() => {
    let filtered = [...staffWorkOrders];
    
    switch (filter) {
      case 'today':
        filtered = filtered.filter(wo => isToday(new Date(wo.scheduleDate)));
        break;
      case 'ongoing':
        filtered = filtered.filter(wo => wo.status === 'Ongoing');
        break;
      case 'overdue':
        filtered = filtered.filter(wo => 
          isPast(new Date(wo.dueDate)) && wo.status !== 'Completed'
        );
        break;
      case 'completed':
        filtered = filtered.filter(wo => wo.status === 'Completed');
        break;
      default:
        break;
    }

    // Sort by priority and due date
    return filtered.sort((a, b) => {
      // First by status priority
      const statusPriority = { 'Ongoing': 1, 'Created': 2, 'Completed': 3, 'Cancelled': 4 };
      const aPriority = statusPriority[a.status] || 5;
      const bPriority = statusPriority[b.status] || 5;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by due date
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [staffWorkOrders, filter]);

  // Quick status update
  const handleQuickStatusUpdate = async (workOrderId, newStatus) => {
    try {
      await updateWorkOrderMutation.mutateAsync({
        id: workOrderId,
        data: { status: newStatus }
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle quick progress update
  const handleQuickProgress = async (workOrderId, progressData) => {
    try {
      const workOrder = staffWorkOrders.find(wo => wo._id === workOrderId);
      const updatedNotes = [
        ...(workOrder.notes || []),
        {
          ...progressData,
          user: session.user.id,
          timestamp: new Date(),
        }
      ];

      await updateWorkOrderMutation.mutateAsync({
        id: workOrderId,
        data: { notes: updatedNotes }
      });
      
      setActiveQuickAdd(null);
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  // Get work order priority based on due date and status
  const getWorkOrderPriority = (workOrder) => {
    const dueDate = new Date(workOrder.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (workOrder.status === 'Completed') return 'low';
    if (daysUntilDue < 0) return 'high'; // Overdue
    if (daysUntilDue <= 1) return 'high'; // Due today or tomorrow
    if (daysUntilDue <= 3) return 'medium'; // Due within 3 days
    return 'low';
  };

  if (status === 'loading' || loadingWorkOrders) {
    return (
      <DashboardLayout title="Staff Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Staff Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name}!</h1>
              <p className="text-blue-100 mt-1">
                {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-blue-700 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Bell size={20} />
                {metrics.overdueWorkOrders > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {metrics.overdueWorkOrders}
                  </span>
                )}
              </button>
              <button
                onClick={() => refetchWorkOrders()}
                className="p-2 bg-blue-700 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Work Orders</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalWorkOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ongoing</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.ongoingWorkOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.completedWorkOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overdueWorkOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/work-orders/create"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">New Work Order</span>
            </Link>
            
            <Link
              href="/invoices/create"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Create Invoice</span>
            </Link>

            <Link
              href="/work-orders"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">View All Orders</span>
            </Link>

            <Link
              href="/activity-logs"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Activity Logs</span>
            </Link>
          </div>
        </div>

        {/* Today's Priorities */}
        {metrics.todayWorkOrders > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
              <h2 className="text-lg font-medium text-yellow-800">Today's Priorities</h2>
            </div>
            <div className="space-y-3">
              {staffWorkOrders
                .filter(wo => isToday(new Date(wo.scheduleDate)))
                .slice(0, 3)
                .map(workOrder => (
                  <div key={workOrder._id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{workOrder.workOrderNumber}</h3>
                      <p className="text-sm text-gray-600">{workOrder.clientName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[workOrder.status]}`}>
                        {workOrder.status}
                      </span>
                      <Link
                        href={`/work-orders/${workOrder._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Work Orders Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">My Work Orders</h2>
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Orders</option>
                  <option value="today">Today</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredWorkOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No work orders found for the selected filter.</p>
              </div>
            ) : (
              filteredWorkOrders.slice(0, 10).map(workOrder => {
                const priority = getWorkOrderPriority(workOrder);
                const isOverdue = isPast(new Date(workOrder.dueDate)) && workOrder.status !== 'Completed';
                
                return (
                  <div key={workOrder._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{workOrder.workOrderNumber}</h3>
                          <span className={`px-2 py-1 text-xs rounded border ${PRIORITY_COLORS[priority]}`}>
                            {priority} priority
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{workOrder.clientName} • {workOrder.workType}</p>
                        <p className="text-xs text-gray-500">
                          Due: {format(new Date(workOrder.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[workOrder.status]}`}>
                          {workOrder.status}
                        </span>
                        
                        {workOrder.status !== 'Completed' && (
                          <div className="flex items-center space-x-1">
                            {workOrder.status === 'Created' && (
                              <button
                                onClick={() => handleQuickStatusUpdate(workOrder._id, 'Ongoing')}
                                className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                disabled={updateWorkOrderMutation.isPending}
                              >
                                Start
                              </button>
                            )}
                            
                            {workOrder.status === 'Ongoing' && (
                              <button
                                onClick={() => handleQuickStatusUpdate(workOrder._id, 'Completed')}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                disabled={updateWorkOrderMutation.isPending}
                              >
                                Complete
                              </button>
                            )}
                            
                            <button
                              onClick={() => setActiveQuickAdd(activeQuickAdd === workOrder._id ? null : workOrder._id)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Quick Progress Update"
                            >
                              <Zap size={14} />
                            </button>
                          </div>
                        )}
                        
                        <Link
                          href={`/work-orders/${workOrder._id}`}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <Eye size={16} />
                        </Link>
                      </div>
                    </div>
                    
                    {activeQuickAdd === workOrder._id && (
                      <div className="mt-3">
                        <QuickAddProgress
                          onAddNote={(progressData) => handleQuickProgress(workOrder._id, progressData)}
                          onCancel={() => setActiveQuickAdd(null)}
                          isSubmitting={updateWorkOrderMutation.isPending}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {filteredWorkOrders.length > 10 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <Link
                href="/work-orders"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All {filteredWorkOrders.length} Work Orders →
              </Link>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">This Week's Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Work Orders</span>
                <span className="text-lg font-bold text-green-600">{metrics.thisWeekCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue Generated</span>
                <span className="text-lg font-bold text-green-600">
                  ${metrics.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Projects</span>
                <span className="text-lg font-bold text-blue-600">{metrics.ongoingWorkOrders}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
              ) : (
                recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}