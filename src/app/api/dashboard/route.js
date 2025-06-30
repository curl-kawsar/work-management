import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';
import Invoice from '@/models/Invoice';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get work order statistics
    const totalWorkOrders = await WorkOrder.countDocuments();
    const pendingWorkOrders = await WorkOrder.countDocuments({ 
      status: { $in: ['Created', 'Ongoing'] } 
    });
    const completedWorkOrders = await WorkOrder.countDocuments({ 
      status: 'Completed' 
    });

    // Get revenue
    const invoiceData = await Invoice.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$revenue' } } }
    ]);
    const revenue = invoiceData.length > 0 ? invoiceData[0].totalRevenue : 0;

    // Get chart data (simplified - in a real app, would query by month/date)
    // For a staff member, show only their assigned work orders
    let workOrdersQuery = {};
    if (session.user.role === 'staff') {
      workOrdersQuery.assignedStaff = session.user.id;
    }

    // Get monthly data for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    // Aggregate work orders by month
    const workOrdersByMonth = await WorkOrder.aggregate([
      { 
        $match: { 
          ...workOrdersQuery,
          createdAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Aggregate revenue by month
    const revenueByMonth = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$revenue" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const chartData = [];
    
    // Create data for the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      
      // Find work order count for this month
      const workOrderData = workOrdersByMonth.find(
        wo => wo._id.year === year && wo._id.month === month
      );
      
      // Find revenue for this month
      const revenueData = revenueByMonth.find(
        rev => rev._id.year === year && rev._id.month === month
      );
      
      chartData.push({
        name: months[month - 1],
        workOrders: workOrderData ? workOrderData.count : 0,
        revenue: revenueData ? revenueData.revenue : 0
      });
    }

    return NextResponse.json({
      totalWorkOrders,
      pendingWorkOrders,
      completedWorkOrders,
      revenue,
      chartData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { message: 'Error fetching dashboard data' },
      { status: 500 }
    );
  }
} 