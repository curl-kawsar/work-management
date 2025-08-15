import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';
import { logActivity } from '@/lib/activityLogger';
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

    const { id } = await params;
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

    const { id } = await params;
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
    
    // Store old values for logging
    const oldValues = {
      status: workOrder.status,
      assignedStaff: workOrder.assignedStaff,
      details: workOrder.details,
      address: workOrder.address,
      workType: workOrder.workType,
      scheduleDate: workOrder.scheduleDate,
      dueDate: workOrder.dueDate,
      nte: workOrder.nte,
    };
    
    // If it's a staff user, they can't change certain fields
    if (session.user.role === 'staff') {
      // Staff can't change assignment or work order number
      delete data.assignedStaff;
      delete data.workOrderNumber;
    }

    // Validate notes structure if present
    if (data.notes) {
      if (typeof data.notes === 'string') {
        // Convert string to proper note object
        data.notes = [
          ...(workOrder.notes || []),
          {
            message: data.notes,
            type: 'note',
            priority: 'normal',
            timestamp: new Date(),
            user: session.user.id
          }
        ];
      } else if (Array.isArray(data.notes)) {
        // Ensure all notes have proper structure
        data.notes = data.notes.map(note => {
          if (typeof note === 'string') {
            return {
              message: note,
              type: 'note',
              priority: 'normal',
              timestamp: new Date(),
              user: session.user.id
            };
          }
          return {
            ...note,
            timestamp: note.timestamp || new Date(),
            user: note.user || session.user.id
          };
        });
      }
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

    // Log the update activity
    const changedFields = [];
    Object.keys(data).forEach(key => {
      if (oldValues[key] !== data[key]) {
        changedFields.push(key);
      }
    });

    if (changedFields.length > 0) {
      await logActivity({
        userId: session.user.id,
        action: data.status !== oldValues.status ? 'status_change' : 'update',
        entityType: 'WorkOrder',
        entityId: id,
        description: `Updated work order ${workOrder.workOrderNumber}: ${changedFields.join(', ')}`,
        oldValues: Object.fromEntries(changedFields.map(field => [field, oldValues[field]])),
        newValues: Object.fromEntries(changedFields.map(field => [field, data[field]])),
      });
    }

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

    const { id } = await params;
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

    // Log the deletion activity before deleting
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      description: `Deleted work order ${workOrder.workOrderNumber} for ${workOrder.clientName}`,
      oldValues: {
        workOrderNumber: workOrder.workOrderNumber,
        clientName: workOrder.clientName,
        companyName: workOrder.companyName,
        workType: workOrder.workType,
        status: workOrder.status,
        assignedStaff: workOrder.assignedStaff,
      },
    });

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