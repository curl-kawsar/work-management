import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';
import path from 'path';
import fs from 'fs';

// GET - Single work order
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Work order ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the work order
    const workOrder = await WorkOrder.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('assignedStaff', 'name email')
      .populate('notes.user', 'name email');

    if (!workOrder) {
      return NextResponse.json({ message: 'Work order not found' }, { status: 404 });
    }

    // Staff can only view their assigned work orders
    if (session.user.role === 'staff' && 
        workOrder.assignedStaff?._id.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ workOrder });
  } catch (error) {
    console.error('Error getting work order:', error);
    return NextResponse.json(
      { message: 'Error getting work order' },
      { status: 500 }
    );
  }
}

// PATCH - Update work order
export async function PATCH(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Work order ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the existing work order
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return NextResponse.json({ message: 'Work order not found' }, { status: 404 });
    }

    // Check permissions: admin or assigned staff
    if (session.user.role !== 'admin' && 
        (workOrder.assignedStaff?.toString() !== session.user.id)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();
    
    // If it's a staff user, they can't change certain fields
    if (session.user.role === 'staff') {
      // Staff can't change assignment or work order number
      delete data.assignedStaff;
      delete data.workOrderNumber;
    }

    // Update the work order
    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      id,
      { 
        ...data, 
        updatedBy: session.user.id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('assignedStaff', 'name email');

    return NextResponse.json({
      message: 'Work order updated successfully',
      workOrder: updatedWorkOrder
    });
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { message: 'Error updating work order' },
      { status: 500 }
    );
  }
}

// DELETE - Delete work order
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete work orders
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Work order ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the work order for media files
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return NextResponse.json({ message: 'Work order not found' }, { status: 404 });
    }

    // Delete associated media files
    if (workOrder.media && workOrder.media.length > 0) {
      const mediaDir = path.join(process.cwd(), 'public', 'media', workOrder.workOrderNumber);
      
      // Check if directory exists before attempting to delete
      if (fs.existsSync(mediaDir)) {
        try {
          fs.rm(mediaDir, { recursive: true, force: true }, (err) => {
            if (err) {
              console.error('Error deleting media files:', err);
            }
          });
        } catch (error) {
          console.error('Error deleting media directory:', error);
        }
      }
    }

    // Delete the work order
    await WorkOrder.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json(
      { message: 'Error deleting work order' },
      { status: 500 }
    );
  }
} 