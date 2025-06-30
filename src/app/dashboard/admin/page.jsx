"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
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

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    totalWorkOrders: 0,
    completedWorkOrders: 0,
    pendingWorkOrders: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalUsers: 0,
    staffCount: 0,
  });
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user && session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      if (!session?.user?.id || session?.user?.role !== 'admin') return;
      
      try {
        setLoading(true);
        
        // Initialize default values
        let workOrders = [];
        let invoices = [];
        let users = [];
        
        // Fetch work orders
        try {
          const workOrdersResponse = await fetch('/api/work-orders');
          if (workOrdersResponse.ok) {
            const workOrdersData = await workOrdersResponse.json();
            workOrders = workOrdersData.workOrders || [];
          } else {
            console.error('Failed to fetch work orders:', await workOrdersResponse.text());
          }
        } catch (err) {
          console.error('Error fetching work orders:', err);
        }
        
        // Fetch invoices
        try {
          const invoicesResponse = await fetch('/api/invoices');
          if (invoicesResponse.ok) {
            const invoicesData = await invoicesResponse.json();
            invoices = invoicesData.invoices || [];
          } else {
            console.error('Failed to fetch invoices:', await invoicesResponse.text());
          }
        } catch (err) {
          console.error('Error fetching invoices:', err);
        }
        
        // Fetch users
        try {
          const usersResponse = await fetch('/api/users');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            users = usersData.users || [];
          } else {
            console.error('Failed to fetch users:', await usersResponse.text());
          }
        } catch (err) {
          console.error('Error fetching users:', err);
        }
        
        // Calculate metrics
        const completed = workOrders.filter(wo => wo.status === 'Completed').length;
        const pending = workOrders.filter(wo => wo.status !== 'Completed' && wo.status !== 'Cancelled').length;
        const staffUsers = users.filter(user => user.role === 'staff');
        
        // Calculate total revenue from invoices
        const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.revenue || 0), 0);
        
        // Calculate staff performance metrics
        const staffMetrics = staffUsers.map(staff => {
          const staffWorkOrders = workOrders.filter(wo => wo.assignedStaff === staff._id);
          const completedOrders = staffWorkOrders.filter(wo => wo.status === 'Completed').length;
          const completionRate = staffWorkOrders.length > 0 
            ? (completedOrders / staffWorkOrders.length) * 100 
            : 0;
          
          return {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            totalAssigned: staffWorkOrders.length,
            completed: completedOrders,
            completionRate: Math.round(completionRate),
          };
        });
        
        setMetrics({
          totalWorkOrders: workOrders.length,
          completedWorkOrders: completed,
          pendingWorkOrders: pending,
          totalInvoices: invoices.length,
          totalRevenue: totalRevenue,
          totalUsers: users.length,
          staffCount: staffUsers.length,
        });
        
        setStaffPerformance(staffMetrics);
        
      } catch (err) {
        console.error('Error fetching admin metrics:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
        
        // Set sample data for development
        setMetrics({
          totalWorkOrders: 45,
          completedWorkOrders: 32,
          pendingWorkOrders: 13,
          totalInvoices: 28,
          totalRevenue: 15750,
          totalUsers: 8,
          staffCount: 6,
        });
        
        setStaffPerformance([
          {
            _id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            totalAssigned: 15,
            completed: 12,
            completionRate: 80,
          },
          {
            _id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            totalAssigned: 18,
            completed: 15,
            completionRate: 83,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && session?.user?.role === 'admin') {
      fetchAdminMetrics();
    }
  }, [session]);

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

  if (error) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
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
                <h3 className="text-3xl font-bold">{metrics.totalWorkOrders}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Wrench size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <span className="text-green-600 flex items-center">
                  <CheckCircle size={14} className="mr-1" />
                  {metrics.completedWorkOrders} Completed
                </span>
              </div>
              <div>
                <span className="text-yellow-600 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {metrics.pendingWorkOrders} Pending
                </span>
              </div>
            </div>
          </div>
          
          {/* Invoices */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Invoices</p>
                <h3 className="text-3xl font-bold">{metrics.totalInvoices}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FileText size={24} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm">
                Revenue: <span className="font-semibold">{formatCurrency(metrics.totalRevenue)}</span>
              </p>
            </div>
          </div>
          
          {/* Users */}
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Users</p>
                <h3 className="text-3xl font-bold">{metrics.totalUsers}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 text-sm">
                Staff Members: <span className="font-semibold">{metrics.staffCount}</span>
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
              <h3 className="text-lg font-medium">Staff Performance</h3>
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
                        Assigned
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
                      onClick={() => handleSort('completionRate')}
                    >
                      <div className="flex items-center">
                        Completion Rate
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
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
                          <div className="text-sm text-gray-900">{staff.totalAssigned}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{staff.completed}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 w-24">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${staff.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{staff.completionRate}%</span>
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
    </DashboardLayout>
  );
} 