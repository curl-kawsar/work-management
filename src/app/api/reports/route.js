import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';
import Invoice from '@/models/Invoice';
import User from '@/models/User';

export async function GET(request) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied. Admin role required.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const staffId = searchParams.get('staffId');

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Build staff filter
    let staffFilter = {};
    if (staffId && staffId !== 'all') {
      staffFilter = { assignedStaff: staffId };
    }

    const combinedFilter = { ...dateFilter, ...staffFilter };

    switch (reportType) {
      case 'overview':
        return await getOverviewReport(combinedFilter);
      
      case 'financial':
        return await getFinancialReport(combinedFilter);
      
      case 'staff-performance':
        return await getStaffPerformanceReport(combinedFilter);
      
      case 'work-orders':
        return await getWorkOrdersReport(combinedFilter);
      
      default:
        return NextResponse.json({ message: 'Invalid report type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { message: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function getOverviewReport(filter) {
  // Get work orders data
  const workOrders = await WorkOrder.find(filter)
    .populate('assignedStaff', 'name')
    .populate('createdBy', 'name');

  // Get invoices data
  const invoices = await Invoice.find(filter)
    .populate('workOrder', 'workOrderNumber clientName');

  // Get users data
  const users = await User.find({});

  // Calculate metrics
  const totalWorkOrders = workOrders.length;
  const completedWorkOrders = workOrders.filter(wo => wo.status === 'Completed').length;
  const ongoingWorkOrders = workOrders.filter(wo => wo.status === 'Ongoing').length;
  const createdWorkOrders = workOrders.filter(wo => wo.status === 'Created').length;
  const cancelledWorkOrders = workOrders.filter(wo => wo.status === 'Cancelled').length;

  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.revenue, 0);
  const totalClientPayments = invoices.reduce((sum, inv) => sum + inv.totalClientPayment, 0);
  const totalExpenses = invoices.reduce((sum, inv) => 
    sum + inv.totalMaterialCost + inv.totalLaborCost + inv.totalUtilityCost, 0);

  // Status distribution
  const statusDistribution = [
    { name: 'Completed', value: completedWorkOrders, color: '#10B981' },
    { name: 'Ongoing', value: ongoingWorkOrders, color: '#F59E0B' },
    { name: 'Created', value: createdWorkOrders, color: '#3B82F6' },
    { name: 'Cancelled', value: cancelledWorkOrders, color: '#EF4444' }
  ];

  // Monthly trends (last 6 months)
  const monthlyTrends = await getMonthlyTrends(filter);

  return NextResponse.json({
    overview: {
      totalWorkOrders,
      completedWorkOrders,
      ongoingWorkOrders,
      createdWorkOrders,
      cancelledWorkOrders,
      totalInvoices,
      totalRevenue,
      totalClientPayments,
      totalExpenses,
      totalUsers: users.length,
      staffCount: users.filter(u => u.role === 'staff').length,
      completionRate: totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders * 100).toFixed(1) : 0
    },
    statusDistribution,
    monthlyTrends
  });
}

async function getFinancialReport(filter) {
  const invoices = await Invoice.find(filter)
    .populate('workOrder', 'workOrderNumber clientName companyName')
    .sort({ issueDate: -1 });

  // Calculate financial metrics
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.revenue, 0);
  const totalClientPayments = invoices.reduce((sum, inv) => sum + inv.totalClientPayment, 0);
  const totalMaterialCosts = invoices.reduce((sum, inv) => sum + inv.totalMaterialCost, 0);
  const totalLaborCosts = invoices.reduce((sum, inv) => sum + inv.totalLaborCost, 0);
  const totalUtilityCosts = invoices.reduce((sum, inv) => sum + inv.totalUtilityCost, 0);
  const totalExpenses = totalMaterialCosts + totalLaborCosts + totalUtilityCosts;

  // Profit margin
  const profitMargin = totalClientPayments > 0 ? (totalRevenue / totalClientPayments * 100).toFixed(1) : 0;

  // Revenue by month
  const revenueByMonth = await getRevenueByMonth(filter);

  // Expense breakdown
  const expenseBreakdown = [
    { name: 'Material', value: totalMaterialCosts, color: '#3B82F6' },
    { name: 'Labor', value: totalLaborCosts, color: '#10B981' },
    { name: 'Utility', value: totalUtilityCosts, color: '#F59E0B' }
  ];

  // Top clients by revenue
  const clientRevenue = {};
  invoices.forEach(inv => {
    const clientName = inv.workOrder?.clientName || 'Unknown';
    clientRevenue[clientName] = (clientRevenue[clientName] || 0) + inv.revenue;
  });

  const topClients = Object.entries(clientRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return NextResponse.json({
    financial: {
      totalRevenue,
      totalClientPayments,
      totalExpenses,
      totalMaterialCosts,
      totalLaborCosts,
      totalUtilityCosts,
      profitMargin,
      invoiceCount: invoices.length
    },
    revenueByMonth,
    expenseBreakdown,
    topClients,
    recentInvoices: invoices.slice(0, 10)
  });
}

async function getStaffPerformanceReport(filter) {
  const workOrders = await WorkOrder.find(filter)
    .populate('assignedStaff', 'name email')
    .populate('createdBy', 'name');

  const staff = await User.find({ role: 'staff' });

  const staffPerformance = staff.map(staffMember => {
    const assignedWorkOrders = workOrders.filter(wo =>
      wo.assignedStaff && wo.assignedStaff._id.toString() === staffMember._id.toString()
    );

    const completedWorkOrders = assignedWorkOrders.filter(wo => wo.status === 'Completed');
    const ongoingWorkOrders = assignedWorkOrders.filter(wo => wo.status === 'Ongoing');

    const completionRate = assignedWorkOrders.length > 0
      ? (completedWorkOrders.length / assignedWorkOrders.length * 100).toFixed(1)
      : 0;

    // Calculate average completion time for completed work orders
    const completionTimes = completedWorkOrders
      .filter(wo => wo.scheduleDate && wo.updatedAt)
      .map(wo => {
        const scheduled = new Date(wo.scheduleDate);
        const completed = new Date(wo.updatedAt);
        return Math.ceil((completed - scheduled) / (1000 * 60 * 60 * 24)); // days
      });

    const avgCompletionTime = completionTimes.length > 0
      ? (completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length).toFixed(1)
      : 0;

    return {
      _id: staffMember._id,
      name: staffMember.name,
      email: staffMember.email,
      totalAssigned: assignedWorkOrders.length,
      completed: completedWorkOrders.length,
      ongoing: ongoingWorkOrders.length,
      completionRate: parseFloat(completionRate),
      avgCompletionTime: parseFloat(avgCompletionTime)
    };
  });

  return NextResponse.json({
    staffPerformance: staffPerformance.sort((a, b) => b.completionRate - a.completionRate)
  });
}

async function getWorkOrdersReport(filter) {
  const workOrders = await WorkOrder.find(filter)
    .populate('assignedStaff', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  // Work orders by status
  const statusCounts = {
    Created: workOrders.filter(wo => wo.status === 'Created').length,
    Ongoing: workOrders.filter(wo => wo.status === 'Ongoing').length,
    Completed: workOrders.filter(wo => wo.status === 'Completed').length,
    Cancelled: workOrders.filter(wo => wo.status === 'Cancelled').length
  };

  // Work orders by work type
  const workTypeCounts = {};
  workOrders.forEach(wo => {
    workTypeCounts[wo.workType] = (workTypeCounts[wo.workType] || 0) + 1;
  });

  const workTypeDistribution = Object.entries(workTypeCounts)
    .map(([type, count]) => ({ name: type, value: count }))
    .sort((a, b) => b.value - a.value);

  // Overdue work orders
  const now = new Date();
  const overdueWorkOrders = workOrders.filter(wo =>
    wo.status !== 'Completed' && wo.status !== 'Cancelled' && new Date(wo.dueDate) < now
  );

  return NextResponse.json({
    workOrders: {
      total: workOrders.length,
      statusCounts,
      overdue: overdueWorkOrders.length
    },
    workTypeDistribution,
    overdueWorkOrders: overdueWorkOrders.slice(0, 10),
    recentWorkOrders: workOrders.slice(0, 10)
  });
}

async function getMonthlyTrends(filter) {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthFilter = {
      ...filter,
      createdAt: {
        $gte: date,
        $lt: nextMonth
      }
    };

    const workOrders = await WorkOrder.find(monthFilter);
    const invoices = await Invoice.find(monthFilter);

    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      workOrders: workOrders.length,
      completed: workOrders.filter(wo => wo.status === 'Completed').length,
      revenue: invoices.reduce((sum, inv) => sum + inv.revenue, 0)
    });
  }

  return months;
}

async function getRevenueByMonth(filter) {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthFilter = {
      ...filter,
      issueDate: {
        $gte: date,
        $lt: nextMonth
      }
    };

    const invoices = await Invoice.find(monthFilter);

    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: invoices.reduce((sum, inv) => sum + inv.revenue, 0),
      expenses: invoices.reduce((sum, inv) =>
        sum + inv.totalMaterialCost + inv.totalLaborCost + inv.totalUtilityCost, 0),
      clientPayments: invoices.reduce((sum, inv) => sum + inv.totalClientPayment, 0)
    });
  }

  return months;
}
