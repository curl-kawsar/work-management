"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { exportToPDF, exportToExcel } from '@/components/reports/ExportUtils';
import { 
  useReport, 
  useCompanies, 
  useExportReport,
  REPORT_TYPES 
} from '@/hooks/useReports';
import { useStaffUsers } from '@/hooks/useUsers';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    staffId: 'all',
    companyName: 'all'
  });

  // Tanstack Query hooks
  const { 
    data: reportData, 
    isLoading: loading, 
    error: queryError,
    refetch: fetchReportData
  } = useReport(activeTab, filters, {
    enabled: session?.user?.role === 'admin'
  });
  
  const { data: staffList = [] } = useStaffUsers({
    enabled: session?.user?.role === 'admin'
  });
  
  const { data: companiesList = [] } = useCompanies({
    enabled: session?.user?.role === 'admin'
  });

  const exportMutation = useExportReport();
  
  const error = queryError?.message;

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Data is now handled by Tanstack Query hooks

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleExport = (format) => {
    if (!reportData) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    exportMutation.mutate({
      reportData,
      reportType: activeTab,
      filters,
      format
    });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'financial', name: 'Financial', icon: DollarSign },
    { id: 'staff-performance', name: 'Staff Performance', icon: Users },
    { id: 'work-orders', name: 'Work Orders', icon: FileText }
  ];

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout title="Reports">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
              <button
                onClick={() => fetchReportData()}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-gray-500" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={filters.staffId}
                  onChange={(e) => handleFilterChange('staffId', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Staff</option>
                  {staffList.map(staff => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={filters.companyName}
                  onChange={(e) => handleFilterChange('companyName', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Companies</option>
                  {companiesList.map(company => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => document.getElementById('export-dropdown').classList.toggle('hidden')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>
                <div id="export-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleExport('pdf');
                        document.getElementById('export-dropdown').classList.add('hidden');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => {
                        handleExport('excel');
                        document.getElementById('export-dropdown').classList.add('hidden');
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {reportData && (
              <>
                {activeTab === 'overview' && <OverviewReport data={reportData} formatCurrency={formatCurrency} />}
                {activeTab === 'financial' && <FinancialReport data={reportData} formatCurrency={formatCurrency} />}
                {activeTab === 'staff-performance' && <StaffPerformanceReport data={reportData} />}
                {activeTab === 'work-orders' && <WorkOrdersReport data={reportData} />}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Overview Report Component
function OverviewReport({ data, formatCurrency }) {
  if (!data || !data.overview) {
    return <div className="text-center py-8">No overview data available</div>;
  }

  const { overview, statusDistribution = [], monthlyTrends = [] } = data;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-100 text-sm">Total Work Orders</p>
              <h3 className="text-3xl font-bold">{overview.totalWorkOrders || 0}</h3>
            </div>
            <FileText size={24} className="text-blue-200" />
          </div>
          <div className="mt-2 text-sm text-blue-100">
            {overview.completionRate || 0}% completion rate
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <h3 className="text-3xl font-bold">{formatCurrency(overview.totalRevenue || 0)}</h3>
            </div>
            <DollarSign size={24} className="text-green-200" />
          </div>
          <div className="mt-2 text-sm text-green-100">
            From {overview.totalInvoices || 0} invoices
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-100 text-sm">Active Staff</p>
              <h3 className="text-3xl font-bold">{overview.staffCount || 0}</h3>
            </div>
            <Users size={24} className="text-purple-200" />
          </div>
          <div className="mt-2 text-sm text-purple-100">
            Total users: {overview.totalUsers || 0}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-orange-100 text-sm">Completed</p>
              <h3 className="text-3xl font-bold">{overview.completedWorkOrders || 0}</h3>
            </div>
            <TrendingUp size={24} className="text-orange-200" />
          </div>
          <div className="mt-2 text-sm text-orange-100">
            Ongoing: {overview.ongoingWorkOrders || 0}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Work Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="workOrders" stroke="#3B82F6" name="Work Orders" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Financial Report Component
function FinancialReport({ data, formatCurrency }) {
  if (!data || !data.financial) {
    return <div className="text-center py-8">No financial data available</div>;
  }

  const { financial, revenueByMonth = [], expenseBreakdown = [], topClients = [] } = data;

  return (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(financial.totalRevenue || 0)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Client Payments</p>
              <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(financial.totalClientPayments || 0)}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Expenses</p>
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(financial.totalExpenses || 0)}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingUp size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Profit Margin</p>
              <h3 className="text-2xl font-bold text-purple-600">{financial.profitMargin || 0}%</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trends (12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Top Clients by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topClients.map((client, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(client.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Staff Performance Report Component
function StaffPerformanceReport({ data }) {
  if (!data || !data.staffPerformance) {
    return <div className="text-center py-8">No staff performance data available</div>;
  }

  const { staffPerformance } = data;

  return (
    <div className="space-y-6">
      {/* Staff Performance Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Staff Performance Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ongoing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Completion Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffPerformance.map((staff) => (
                <tr key={staff._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                      <div className="text-sm text-gray-500">{staff.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staff.totalAssigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {staff.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                    {staff.ongoing}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(staff.completionRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{staff.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staff.avgCompletionTime} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Completion Rate Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={staffPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completionRate" fill="#3B82F6" name="Completion Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Work Orders Report Component
function WorkOrdersReport({ data }) {
  if (!data || !data.workOrders) {
    return <div className="text-center py-8">No work orders data available</div>;
  }

  const { workOrders, workTypeDistribution = [], overdueWorkOrders = [], recentWorkOrders = [] } = data;

  const statusColors = {
    Created: 'bg-blue-100 text-blue-800',
    Ongoing: 'bg-amber-100 text-amber-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Work Order Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Work Orders</p>
              <h3 className="text-2xl font-bold text-blue-600">{workOrders.total}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText size={20} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Completed</p>
              <h3 className="text-2xl font-bold text-green-600">{workOrders.statusCounts?.Completed || 0}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Ongoing</p>
              <h3 className="text-2xl font-bold text-yellow-600">{workOrders.statusCounts?.Ongoing || 0}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <BarChart3 size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Overdue</p>
              <h3 className="text-2xl font-bold text-red-600">{workOrders.overdue}</h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Calendar size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Type Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Work Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workTypeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Work Orders */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Work Orders</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentWorkOrders.map((wo) => (
              <div key={wo._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{wo.workOrderNumber}</div>
                  <div className="text-xs text-gray-500">{wo.clientName}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[wo.status]}`}>
                  {wo.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Work Orders */}
      {overdueWorkOrders.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800">Overdue Work Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Work Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Staff
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overdueWorkOrders.map((wo) => (
                  <tr key={wo._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {wo.workOrderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {wo.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {format(new Date(wo.dueDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[wo.status]}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {wo.assignedStaff?.name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
