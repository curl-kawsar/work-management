"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Edit, ArrowLeft, FileText } from 'lucide-react';

export default function InvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setInvoice(data.invoice);
        } else {
          throw new Error('Failed to fetch invoice');
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        setError('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Get payment status badge color
  const getStatusColor = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };
  
  // Get expense status badge color
  const getExpenseStatusColor = (status) => {
    return status === 'paid' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };
  
  // Format payment method
  const formatPaymentMethod = (method) => {
    const methods = {
      cash: 'Cash',
      check: 'Check',
      credit_card: 'Credit Card',
      bank_transfer: 'Bank Transfer',
      other: 'Other',
    };
    return methods[method] || method;
  };
  
  // Format expense type
  const formatExpenseType = (type) => {
    const types = {
      material: 'Material',
      labor: 'Labor',
      utility: 'Utility',
    };
    return types[type] || type;
  };
  
  if (loading) {
    return (
      <DashboardLayout title="Invoice Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout title="Invoice Details">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push('/invoices')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!invoice) {
    return (
      <DashboardLayout title="Invoice Details">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Invoice not found.
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push('/invoices')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Invoices
          </button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={`Invoice ${invoice.invoiceNumber}`}>
      <div className="space-y-6">
        {/* Invoice Header */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <button
              onClick={() => router.push('/invoices')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Invoices
            </button>
            
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
              <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Issue Date: {formatDate(invoice.issueDate)}
              {invoice.dueDate && ` | Due Date: ${formatDate(invoice.dueDate)}`}
            </p>
          </div>
          
          <div className="flex gap-2">
            {session?.user?.role && ['staff', 'admin'].includes(session.user.role) && (
              <Link
                href={`/invoices/${invoice._id}/edit`}
                className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded"
              >
                <Edit size={16} className="mr-2" />
                Edit Invoice
              </Link>
            )}
            <Link
              href={`/api/invoices/${invoice._id}/pdf`}
              target="_blank"
              className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            >
              <FileText size={16} className="mr-2" />
              Download PDF
            </Link>
          </div>
        </div>
        
        {/* Work Order Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Work Order Details</h2>
          {invoice.workOrder ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500">Work Order Number</p>
                <p className="font-medium">
                  <Link 
                    href={`/work-orders/${invoice.workOrder._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {invoice.workOrder.workOrderNumber}
                  </Link>
                </p>
              </div>
              <div>
                <p className="text-gray-500">Client Name</p>
                <p className="font-medium">{invoice.workOrder.clientName}</p>
              </div>
              <div>
                <p className="text-gray-500">Company</p>
                <p className="font-medium">{invoice.workOrder.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{invoice.workOrder.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Work Type</p>
                <p className="font-medium">{invoice.workOrder.workType || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-600">Work order information not available</p>
          )}
        </div>
        
        {/* Financial Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Income */}
            <div>
              <h3 className="text-lg font-medium mb-3 pb-2 border-b">Income</h3>
              <div className="space-y-1">
                <p className="font-semibold text-lg text-green-600">
                  Total Client Payments: {formatCurrency(invoice.totalClientPayment)}
                </p>
              </div>
            </div>
            
            {/* Expenses */}
            <div>
              <h3 className="text-lg font-medium mb-3 pb-2 border-b">Expenses</h3>
              <div className="space-y-1">
                <p>Material Costs: {formatCurrency(invoice.totalMaterialCost)}</p>
                <p>Labor Costs: {formatCurrency(invoice.totalLaborCost)}</p>
                <p>Utility Costs: {formatCurrency(invoice.totalUtilityCost)}</p>
                <p className="font-medium mt-2 pt-2 border-t">
                  Total Expenses: {formatCurrency(invoice.totalMaterialCost + invoice.totalLaborCost + invoice.totalUtilityCost)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Revenue */}
          <div className="mt-6 pt-4 border-t">
            <p className={`text-xl font-bold ${invoice.revenue < 0 ? 'text-red-600' : 'text-green-600'}`}>
              Revenue: {formatCurrency(invoice.revenue)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Client Payments - (Material + Labor + Utility)
            </p>
          </div>
        </div>
        
        {/* Client Payments */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Client Payments</h2>
          {invoice.clientPayments && invoice.clientPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.clientPayments.map((payment, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPaymentMethod(payment.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {payment.description || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No client payments recorded</p>
          )}
        </div>
        
        {/* Expenses */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Expenses</h2>
          {invoice.expenses && invoice.expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.expenses.map((expense, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatExpenseType(expense.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {expense.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getExpenseStatusColor(expense.status)}`}>
                          {expense.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No expenses recorded</p>
          )}
        </div>
        
        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 