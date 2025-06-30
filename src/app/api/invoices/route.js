import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import WorkOrder from '@/models/WorkOrder';

// GET - List all invoices
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    // Get all invoices
    const invoices = await Invoice.find()
      .sort({ issueDate: -1 })
      .populate('workOrder', 'workOrderNumber clientName companyName')
      .populate('createdBy', 'name email');
      
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error getting invoices:', error);
    return NextResponse.json(
      { message: 'Error getting invoices' },
      { status: 500 }
    );
  }
}

// POST - Create new invoice
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only staff and admin can create invoices
    if (!['staff', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.workOrderId || !data.invoiceNumber || !data.clientPayments || !data.clientPayments.length) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ invoiceNumber: data.invoiceNumber });
    if (existingInvoice) {
      return NextResponse.json(
        { message: 'Invoice number already exists' },
        { status: 409 }
      );
    }
    
    // Check if work order exists
    const workOrder = await WorkOrder.findById(data.workOrderId);
    if (!workOrder) {
      console.error(`Work order with ID ${data.workOrderId} not found`);
      return NextResponse.json(
        { message: `Work order with ID ${data.workOrderId} not found` },
        { status: 404 }
      );
    }
    
    // Create invoice with calculated totals
    const invoice = await Invoice.create({
      invoiceNumber: data.invoiceNumber,
      workOrder: data.workOrderId,
      clientPayments: data.clientPayments,
      expenses: data.expenses,
      totalClientPayment: data.totalClientPayment || 0,
      totalMaterialCost: data.totalMaterialCost || 0,
      totalLaborCost: data.totalLaborCost || 0,
      totalUtilityCost: data.totalUtilityCost || 0,
      revenue: data.revenue,
      issueDate: data.issueDate || new Date(),
      dueDate: data.dueDate || null,
      status: data.status || 'draft',
      notes: data.notes || '',
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });
    
    return NextResponse.json(
      { message: 'Invoice created successfully', invoice },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { message: 'Error creating invoice' },
      { status: 500 }
    );
  }
} 