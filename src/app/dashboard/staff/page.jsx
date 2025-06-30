"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  BarChart, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Wrench 
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    totalWorkOrders: 0,
    completedWorkOrders: 0,
    pendingWorkOrders: 0,
    totalInvoices: 0,
    thisMonthWorkOrders: 0,
    lastMonthWorkOrders: 0,
    averageCompletionTime: 0,
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not authenticated or not staff
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user && session.user.role !== 'staff') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchStaffMetrics = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch work orders assigned to this staff
        const workOrdersResponse = await fetch('/api/work-orders');
        if (!workOrdersResponse.ok) {
          throw new Error('Failed to fetch work orders');
        }
        
        const workOrdersData = await workOrdersResponse.json();
        const staffWorkOrders = workOrdersData.workOrders.filter(
          wo => wo.assignedStaff === session.user.id
        );
        
        // Fetch invoices created by this staff
        const invoicesResponse = await fetch('/api/invoices');
        if (!invoicesResponse.ok) {
          throw new Error('Failed to fetch invoices');
        }
        
        const invoicesData = await invoicesResponse.json();
        const staffInvoices = invoicesData.invoices.filter(
          inv => inv.createdBy === session.user.id
        );
        
        // Calculate metrics
        const completed = staffWorkOrders.filter(wo => wo.status === 'Completed').length;
        const pending = staffWorkOrders.filter(wo => wo.status !== 'Completed' && wo.status !== 'Cancelled').length;
        
        // Calculate this month and last month work orders
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        
        const thisMonthOrders = staffWorkOrders.filter(wo => {
          const date = parseISO(wo.createdAt);
          return date >= thisMonthStart && date <= thisMonthEnd;
        }).length;
        
        const lastMonthOrders = staffWorkOrders.filter(wo => {
          const date = parseISO(wo.createdAt);
          return date >= lastMonthStart && date <= lastMonthEnd;
        }).length;
        
        // Calculate average completion time (in days) for completed work orders
        let totalCompletionTime = 0;
        let completedCount = 0;
        
        staffWorkOrders.forEach(wo => {
          if (wo.status === 'Completed' && wo.createdAt && wo.updatedAt) {
            const createdDate = new Date(wo.createdAt);
            const completedDate = new Date(wo.updatedAt);
            const diffTime = Math.abs(completedDate - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalCompletionTime += diffDays;
            completedCount++;
          }
        });
        
        const avgCompletionTime = completedCount > 0 ? (totalCompletionTime / completedCount).toFixed(1) : 0;
        
        // Get recent work orders (last 5)
        const recent = [...staffWorkOrders]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 5);
        
        setMetrics({
          totalWorkOrders: staffWorkOrders.length,
          completedWorkOrders: completed,
          pendingWorkOrders: pending,
          totalInvoices: staffInvoices.length,
          thisMonthWorkOrders: thisMonthOrders,
          lastMonthWorkOrders: lastMonthOrders,
          averageCompletionTime: avgCompletionTime,
        });
        
        setRecentWorkOrders(recent);
      } catch (err) {
        console.error('Error fetching staff metrics:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
        
        // Set sample data for development
        setMetrics({
          totalWorkOrders: 24,
          completedWorkOrders: 18,
          pendingWorkOrders: 6,
          totalInvoices: 15,
          thisMonthWorkOrders: 8,
          lastMonthWorkOrders: 6,
          averageCompletionTime: 3.5,
        });
        
        setRecentWorkOrders([
          {
            _id: '1',
            workOrderNumber: 'WO-2023-001',
            clientName: 'ABC Company',
            status: 'Completed',
            updatedAt: '2023-06-15T00:00:00.000Z',
          },
          {
            _id: '2',
            workOrderNumber: 'WO-2023-002',
            clientName: 'XYZ Corporation',
            status: 'Ongoing',
            updatedAt: '2023-06-10T00:00:00.000Z',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchStaffMetrics();
    }
  }, [session]);

  // Status badge colors
  const statusColors = {
    Created: 'bg-blue-100 text-blue-800',
    Ongoing: 'bg-amber-100 text-amber-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Staff Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Staff Dashboard">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Staff Dashboard">
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {session?.user?.name}</h2>
          <p className="text-gray-600">
            Here's an overview of your work performance and assigned tasks.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Work Orders */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Work Orders</p>
                <h3 className="text-2xl font-bold">{metrics.totalWorkOrders}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Wrench size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Work Orders */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <h3 className="text-2xl font-bold">{metrics.completedWorkOrders}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Pending Work Orders */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending</p>
                <h3 className="text-2xl font-bold">{metrics.pendingWorkOrders}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock size={24} className="text-amber-600" />
              </div>
            </div>
          </div>

          {/* Invoices Created */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Invoices Created</p>
                <h3 className="text-2xl font-bold">{metrics.totalInvoices}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FileText size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monthly Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart size={20} className="mr-2 text-blue-600" />
              Monthly Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">This Month</span>
                  <span className="text-sm font-medium">{metrics.thisMonthWorkOrders} orders</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (metrics.thisMonthWorkOrders / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Last Month</span>
                  <span className="text-sm font-medium">{metrics.lastMonthWorkOrders} orders</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gray-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (metrics.lastMonthWorkOrders / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-gray-600">
                  {metrics.thisMonthWorkOrders > metrics.lastMonthWorkOrders ? (
                    <span className="text-green-600 font-medium flex items-center">
                      <TrendingUp size={16} className="mr-1" />
                      {Math.round(((metrics.thisMonthWorkOrders - metrics.lastMonthWorkOrders) / Math.max(1, metrics.lastMonthWorkOrders)) * 100)}% increase from last month
                    </span>
                  ) : metrics.thisMonthWorkOrders < metrics.lastMonthWorkOrders ? (
                    <span className="text-red-600 font-medium">
                      {Math.round(((metrics.lastMonthWorkOrders - metrics.thisMonthWorkOrders) / metrics.lastMonthWorkOrders) * 100)}% decrease from last month
                    </span>
                  ) : (
                    <span>Same as last month</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock size={20} className="mr-2 text-blue-600" />
              Efficiency Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Avg. Completion Time</p>
                  <p className="text-xl font-semibold">{metrics.averageCompletionTime} days</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Completion Rate</p>
                  <p className="text-xl font-semibold">
                    {metrics.totalWorkOrders > 0 
                      ? Math.round((metrics.completedWorkOrders / metrics.totalWorkOrders) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${metrics.totalWorkOrders > 0 ? (metrics.completedWorkOrders / metrics.totalWorkOrders) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Completed vs Total Work Orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Work Orders</h3>
          </div>
          <div className="overflow-x-auto">
            {recentWorkOrders.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentWorkOrders.map((workOrder) => (
                    <tr key={workOrder._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <a href={`/work-orders/${workOrder._id}`}>{workOrder.workOrderNumber}</a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {workOrder.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[workOrder.status]}`}>
                          {workOrder.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(workOrder.updatedAt || workOrder.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No recent work orders found.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 