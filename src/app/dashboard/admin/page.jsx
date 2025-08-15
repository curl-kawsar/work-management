"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BackupManager from '@/components/admin/BackupManager';
import { 
  BarChart, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  Wrench,
  User,
  Calendar,
  Search,
  ArrowUpDown,
  ChevronRight
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { useWorkOrdersMetrics } from '@/hooks/useWorkOrders';
import { useInvoicesMetrics } from '@/hooks/useInvoices';
import { useUsersMetrics, useStaffPerformance } from '@/hooks/useUsers';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  // Tanstack Query hooks
  const { data: workOrderMetrics = {}, isLoading: loadingWorkOrders } = useWorkOrdersMetrics();
  const { data: invoiceMetrics = {}, isLoading: loadingInvoices } = useInvoicesMetrics();
  const { data: userMetrics = {}, isLoading: loadingUsers } = useUsersMetrics();
  const { data: staffPerformanceData = { staffPerformance: [], summary: {} }, isLoading: loadingStaffPerformance } = useStaffPerformance();

  const loading = loadingWorkOrders || loadingInvoices || loadingUsers || loadingStaffPerformance;

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user && session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Get staff performance data from the API
  const staffPerformance = staffPerformanceData.staffPerformance || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">
            Here's an overview of your system's performance and activity.
          </p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Work Orders */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Work Orders</p>
                <h3 className="text-3xl font-bold">{workOrderMetrics.total || 0}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Wrench size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <span className="text-green-600 flex items-center">
                  <CheckCircle size={14} className="mr-1" />
                  {workOrderMetrics.completed || 0} Completed
                </span>
              </div>
              <div>
                <span className="text-yellow-600 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {(workOrderMetrics.created || 0) + (workOrderMetrics.ongoing || 0)} Pending
                </span>
              </div>
            </div>
          </div>
          
          {/* Invoices */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Invoices</p>
                <h3 className="text-3xl font-bold">{invoiceMetrics.total || 0}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FileText size={24} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm">
                Revenue: <span className="font-semibold">{formatCurrency(invoiceMetrics.totalRevenue || 0)}</span>
              </p>
            </div>
          </div>
          
          {/* Users */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <h3 className="text-3xl font-bold">{userMetrics.total || 0}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm">
                Staff Members: <span className="font-semibold">{userMetrics.staff || 0}</span>
              </p>
            </div>
          </div>
          
          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">System Status</p>
                <h3 className="text-xl font-bold">All Systems Operational</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BarChart size={24} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm">
                Last checked: <span className="font-semibold">{format(new Date(), 'MMM dd, HH:mm')}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Staff Performance */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Staff Performance</h3>
                {staffPerformanceData.summary && (
                  <p className="text-sm text-gray-600 mt-1">
                    {staffPerformanceData.summary.totalStaff} staff members • 
                    {staffPerformanceData.summary.averageCompletionRate}% avg completion rate • 
                    {staffPerformanceData.summary.totalCompleted}/{staffPerformanceData.summary.totalWorkOrdersAssigned} completed
                  </p>
                )}
              </div>
              <Link 
                href="/users" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search staff..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        <User size={14} className="mr-1" />
                        Staff Name
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('totalAssigned')}
                    >
                      <div className="flex items-center">
                        Total
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('completed')}
                    >
                      <div className="flex items-center">
                        Completed
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('ongoing')}
                    >
                      <div className="flex items-center">
                        Ongoing
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('completionRate')}
                    >
                      <div className="flex items-center">
                        Completion Rate
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recent Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffPerformance
                    .filter(staff => 
                      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      staff.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .sort((a, b) => {
                      if (a[sortConfig.key] < b[sortConfig.key]) {
                        return sortConfig.direction === 'asc' ? -1 : 1;
                      }
                      if (a[sortConfig.key] > b[sortConfig.key]) {
                        return sortConfig.direction === 'asc' ? 1 : -1;
                      }
                      return 0;
                    })
                    .map((staff) => (
                      <tr key={staff._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{staff.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{staff.totalAssigned || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{staff.completed || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{staff.ongoing || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  (staff.completionRate || 0) >= 80 ? 'bg-green-500' :
                                  (staff.completionRate || 0) >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${staff.completionRate || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{staff.completionRate || 0}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {staff.recentActivity?.totalRecent || 0} recent
                          </div>
                          <div className="text-xs text-gray-500">
                            {staff.recentActivity?.recentCompleted || 0} completed
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              {staffPerformance.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No staff data available.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/work-orders/new"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <Wrench size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Create Work Order</h3>
              <p className="text-sm text-gray-500">Add a new work order to the system</p>
            </div>
          </Link>
          
          <Link
            href="/users/new"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <div className="bg-purple-100 p-3 rounded-full">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium">Add User</h3>
              <p className="text-sm text-gray-500">Create a new user account</p>
            </div>
          </Link>
          
          <Link
            href="/reports"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-medium">View Reports</h3>
              <p className="text-sm text-gray-500">Access system reports and analytics</p>
            </div>
          </Link>
                </div>
      </div>

      {/* Backup Management */}
      <BackupManager />
    </DashboardLayout>
  );
} 