import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import { logActivity } from '@/lib/activityLogger';

// GET - Single invoice
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the invoice with all related data
    const invoice = await Invoice.findById(id)
      .populate('workOrder')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error getting invoice:', error);
    return NextResponse.json(
      { message: 'Error getting invoice' },
      { status: 500 }
    );
  }
}

// PATCH - Update invoice
export async function PATCH(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only staff and admin can update invoices
    if (!['staff', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }

    const data = await request.json();
    
    await connectDB();

    // Get the existing invoice
    const invoice = await Invoice.findById(id).populate('workOrder');
    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Store old values for logging
    const oldValues = {
      invoiceNumber: invoice.invoiceNumber,
      totalClientPayment: invoice.totalClientPayment,
      totalMaterialCost: invoice.totalMaterialCost,
      totalLaborCost: invoice.totalLaborCost,
      totalUtilityCost: invoice.totalUtilityCost,
      revenue: invoice.revenue,
      status: invoice.status,
    };

    // Calculate totals
    let totalClientPayment = 0;
    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let totalUtilityCost = 0;

    if (data.clientPayments && data.clientPayments.length > 0) {
      totalClientPayment = data.clientPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0), 
        0
      );
    }

    if (data.expenses && data.expenses.length > 0) {
      totalMaterialCost = data.expenses
        .filter(expense => expense.type === 'material')
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
        
      totalLaborCost = data.expenses
        .filter(expense => expense.type === 'labor')
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
        
      totalUtilityCost = data.expenses
        .filter(expense => expense.type === 'utility')
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    }

    const totalExpenses = totalMaterialCost + totalLaborCost + totalUtilityCost;
    const revenue = totalClientPayment - totalExpenses;

    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        ...data,
        totalClientPayment,
        totalMaterialCost,
        totalLaborCost,
        totalUtilityCost,
        revenue,
        updatedBy: session.user.id,
      },
      { new: true, runValidators: true }
    )
    .populate('workOrder')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    // Log the update activity
    const changedFields = [];
    const newValues = {};
    
    Object.keys(data).forEach(key => {
      if (oldValues[key] !== undefined && oldValues[key] !== data[key]) {
        changedFields.push(key);
        newValues[key] = data[key];
      }
    });

    // Also check calculated fields
    if (oldValues.totalClientPayment !== totalClientPayment) {
      changedFields.push('totalClientPayment');
      newValues.totalClientPayment = totalClientPayment;
    }
    if (oldValues.revenue !== revenue) {
      changedFields.push('revenue');
      newValues.revenue = revenue;
    }

    if (changedFields.length > 0) {
      await logActivity({
        userId: session.user.id,
        action: data.status !== oldValues.status ? 'status_change' : 'update',
        entityType: 'Invoice',
        entityId: id,
        description: `Updated invoice ${invoice.invoiceNumber}: ${changedFields.join(', ')}`,
        oldValues: Object.fromEntries(changedFields.map(field => [field, oldValues[field]])),
        newValues: Object.fromEntries(changedFields.map(field => [field, newValues[field] !== undefined ? newValues[field] : (field === 'totalClientPayment' ? totalClientPayment : revenue)])),
      });
    }

    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { message: 'Error updating invoice' },
      { status: 500 }
    );
  }
}

// DELETE - Delete invoice
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete invoices
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the invoice before deleting for logging
    const invoice = await Invoice.findById(id).populate('workOrder');
    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Log the deletion activity before deleting
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Deleted invoice ${invoice.invoiceNumber}${invoice.workOrder ? ` for work order ${invoice.workOrder.workOrderNumber}` : ''}`,
      oldValues: {
        invoiceNumber: invoice.invoiceNumber,
        workOrderNumber: invoice.workOrder?.workOrderNumber,
        totalClientPayment: invoice.totalClientPayment,
        revenue: invoice.revenue,
        status: invoice.status,
      },
    });

    // Delete the invoice
    const result = await Invoice.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { message: 'Error deleting invoice' },
      { status: 500 }
    );
  }
} 