import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

// GET - Single invoice
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
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

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }

    const data = await request.json();
    
    await connectDB();

    // Get the existing invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

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

    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'Invoice ID is required' }, { status: 400 });
    }

    await connectDB();

    // Delete the invoice
    const result = await Invoice.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { message: 'Error deleting invoice' },
      { status: 500 }
    );
  }
} 