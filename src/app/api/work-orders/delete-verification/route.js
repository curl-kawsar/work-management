import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';
import { sendDeletionConfirmationEmail, generateVerificationCode } from '@/lib/emailService-simple';

// Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

// POST - Send deletion verification email
export async function POST(request) {
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

    const { workOrderId } = await request.json();

    if (!workOrderId) {
      return NextResponse.json({ message: 'Work order ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the work order
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return NextResponse.json({ message: 'Work order not found' }, { status: 404 });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store verification code with expiration (10 minutes)
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes
    verificationCodes.set(workOrderId, {
      code: verificationCode,
      expires: expirationTime,
      userId: session.user.id,
    });

    // Send email
    const emailSent = await sendDeletionConfirmationEmail(
      session.user.email,
      workOrder.workOrderNumber,
      verificationCode
    );

    if (!emailSent) {
      return NextResponse.json(
        { message: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email sent successfully',
      workOrderNumber: workOrder.workOrderNumber,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { message: 'Error sending verification email' },
      { status: 500 }
    );
  }
}

// PATCH - Verify code and delete work order
export async function PATCH(request) {
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

    const { workOrderId, verificationCode } = await request.json();

    if (!workOrderId || !verificationCode) {
      return NextResponse.json(
        { message: 'Work order ID and verification code are required' },
        { status: 400 }
      );
    }

    // Check verification code
    const storedData = verificationCodes.get(workOrderId);
    if (!storedData) {
      return NextResponse.json(
        { message: 'Verification code not found or expired' },
        { status: 400 }
      );
    }

    if (Date.now() > storedData.expires) {
      verificationCodes.delete(workOrderId);
      return NextResponse.json(
        { message: 'Verification code has expired' },
        { status: 400 }
      );
    }

    if (storedData.code !== verificationCode) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    if (storedData.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Verification code was not issued to this user' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get the work order for logging
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
      return NextResponse.json({ message: 'Work order not found' }, { status: 404 });
    }

    // Delete the work order (the existing DELETE route logic can be used)
    await WorkOrder.findByIdAndDelete(workOrderId);

    // Clean up verification code
    verificationCodes.delete(workOrderId);

    // Log the deletion activity
    const { logActivity } = await import('@/lib/activityLogger');
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'WorkOrder',
      entityId: workOrderId,
      description: `Deleted work order ${workOrder.workOrderNumber} with email verification`,
      oldValues: {
        workOrderNumber: workOrder.workOrderNumber,
        clientName: workOrder.clientName,
        status: workOrder.status,
      },
    });

    return NextResponse.json({
      message: 'Work order deleted successfully',
      workOrderNumber: workOrder.workOrderNumber,
    });
  } catch (error) {
    console.error('Error verifying and deleting work order:', error);
    return NextResponse.json(
      { message: 'Error deleting work order' },
      { status: 500 }
    );
  }
}