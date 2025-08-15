import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WorkOrder from '@/models/WorkOrder';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access staff performance data
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    // Get all work orders with populated assignedStaff
    const workOrders = await WorkOrder.find({})
      .populate('assignedStaff', 'name email')
      .populate('createdBy', 'name');

    // Get all staff members
    const staff = await User.find({ role: 'staff' });

    // Calculate performance for each staff member
    const staffPerformance = staff.map(staffMember => {
      const assignedWorkOrders = workOrders.filter(wo =>
        wo.assignedStaff && wo.assignedStaff._id.toString() === staffMember._id.toString()
      );

      const completedWorkOrders = assignedWorkOrders.filter(wo => wo.status === 'Completed');
      const ongoingWorkOrders = assignedWorkOrders.filter(wo => wo.status === 'Ongoing');
      const createdWorkOrders = assignedWorkOrders.filter(wo => wo.status === 'Created');
      const cancelledWorkOrders = assignedWorkOrders.filter(wo => wo.status === 'Cancelled');

      const completionRate = assignedWorkOrders.length > 0
        ? Math.round((completedWorkOrders.length / assignedWorkOrders.length) * 100)
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
        ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
        : 0;

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentWorkOrders = assignedWorkOrders.filter(wo =>
        new Date(wo.createdAt) >= thirtyDaysAgo
      );

      const recentCompleted = recentWorkOrders.filter(wo => wo.status === 'Completed').length;

      return {
        _id: staffMember._id,
        name: staffMember.name,
        email: staffMember.email,
        totalAssigned: assignedWorkOrders.length,
        completed: completedWorkOrders.length,
        ongoing: ongoingWorkOrders.length,
        created: createdWorkOrders.length,
        cancelled: cancelledWorkOrders.length,
        completionRate,
        avgCompletionTime,
        recentActivity: {
          totalRecent: recentWorkOrders.length,
          recentCompleted
        },
        lastActivity: assignedWorkOrders.length > 0 
          ? assignedWorkOrders
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
              .updatedAt
          : staffMember.createdAt
      };
    });

    // Sort by completion rate (highest first), then by total assigned
    const sortedPerformance = staffPerformance.sort((a, b) => {
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate;
      }
      return b.totalAssigned - a.totalAssigned;
    });

    return NextResponse.json({
      success: true,
      staffPerformance: sortedPerformance,
      summary: {
        totalStaff: staff.length,
        averageCompletionRate: staffPerformance.length > 0
          ? Math.round(staffPerformance.reduce((sum, staff) => sum + staff.completionRate, 0) / staffPerformance.length)
          : 0,
        totalWorkOrdersAssigned: staffPerformance.reduce((sum, staff) => sum + staff.totalAssigned, 0),
        totalCompleted: staffPerformance.reduce((sum, staff) => sum + staff.completed, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching staff performance:', error);
    return NextResponse.json(
      { message: 'Error fetching staff performance' },
      { status: 500 }
    );
  }
}