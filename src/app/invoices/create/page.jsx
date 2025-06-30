"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Plus, Minus, DollarSign } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Form validation schema
const schema = yup.object().shape({
  workOrderId: yup.string().required('Work Order is required'),
  invoiceNumber: yup.string().required('Invoice number is required'),
  clientPayments: yup.array().of(
    yup.object().shape({
      amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
      paymentMethod: yup.string().required('Payment method is required'),
      description: yup.string(),
      paymentDate: yup.string().required('Payment date is required'),
    })
  ),
  expenses: yup.array().of(
    yup.object().shape({
      type: yup.string().required('Expense type is required'),
      amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
      description: yup.string(),
      status: yup.string().required('Status is required'),
    })
  ),
  dueDate: yup.string(),
  notes: yup.string(),
});

// Payment methods
const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

// Expense status options
const expenseStatusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
];

// Expense types
const expenseTypes = [
  { value: 'material', label: 'Material Cost' },
  { value: 'labor', label: 'Labor Cost' },
  { value: 'utility', label: 'Utility Cost' },
];

export default function CreateInvoice() {
  const router = useRouter();
  const { data: session } = useSession();
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [totals, setTotals] = useState({
    clientPayment: 0,
    materialCost: 0,
    laborCost: 0,
    utilityCost: 0,
    expenses: 0,
    revenue: 0,
  });
  
  // Set up form
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      clientPayments: [{ amount: 0, paymentMethod: '', description: '', paymentDate: format(new Date(), 'yyyy-MM-dd') }],
      expenses: [
        { type: 'material', amount: 0, description: 'Materials', status: 'unpaid' },
        { type: 'labor', amount: 0, description: 'Labor', status: 'unpaid' },
        { type: 'utility', amount: 0, description: 'Utilities', status: 'unpaid' },
      ],
      status: 'draft',
    }
  });
  
  // Set up field arrays for client payments and expenses
  const { fields: clientPaymentFields, append: appendClientPayment, remove: removeClientPayment } = useFieldArray({
    control,
    name: "clientPayments"
  });
  
  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({
    control,
    name: "expenses"
  });
  
  // Watch form values for calculating totals
  const watchClientPayments = watch('clientPayments');
  const watchExpenses = watch('expenses');
  const watchWorkOrderId = watch('workOrderId');
  
  // Calculate totals whenever form values change
  useEffect(() => {
    const totalClientPayment = watchClientPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    
    // Calculate expenses by type
    const materialExpenses = watchExpenses
      .filter(expense => expense.type === 'material')
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      
    const laborExpenses = watchExpenses
      .filter(expense => expense.type === 'labor')
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      
    const utilityExpenses = watchExpenses
      .filter(expense => expense.type === 'utility')
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    
    const totalExpenses = materialExpenses + laborExpenses + utilityExpenses;
    const revenue = totalClientPayment - totalExpenses;
    
    setTotals({
      clientPayment: totalClientPayment,
      materialCost: materialExpenses,
      laborCost: laborExpenses,
      utilityCost: utilityExpenses,
      expenses: totalExpenses,
      revenue: revenue
    });
  }, [watchClientPayments, watchExpenses]);
  
  // Fetch work orders
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const response = await fetch('/api/work-orders');
        if (response.ok) {
          const data = await response.json();
          console.log("Work orders fetched:", data.workOrders);
          setWorkOrders(data.workOrders);
        } else {
          console.error("Error fetching work orders:", await response.text());
          throw new Error('Failed to fetch work orders');
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
        setWorkOrders([
          { _id: '1', workOrderNumber: 'WO-2023-001', clientName: 'ABC Company' },
          { _id: '2', workOrderNumber: 'WO-2023-002', clientName: 'XYZ Corporation' },
          { _id: '3', workOrderNumber: 'WO-2023-003', clientName: 'Acme Corp' },
        ]);
      }
    };

    fetchWorkOrders();
    
    // Generate invoice number
    const generateInvoiceNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `INV-${year}${month}-${random}`;
    };
    
    setValue('invoiceNumber', generateInvoiceNumber());
  }, [setValue]);
  
  // Manual refresh function for work orders
  const refreshWorkOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/work-orders');
      if (response.ok) {
        const data = await response.json();
        console.log("Work orders refreshed:", data.workOrders);
        setWorkOrders(data.workOrders);
        alert(`Successfully loaded ${data.workOrders.length} work orders`);
      } else {
        throw new Error('Failed to refresh work orders');
      }
    } catch (error) {
      console.error('Error refreshing work orders:', error);
      alert('Error refreshing work orders: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch work order details when selected
  useEffect(() => {
    const fetchWorkOrderDetails = async (id) => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/work-orders/${id}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Work order details fetched:", data.workOrder);
          setSelectedWorkOrder(data.workOrder);
        } else {
          const errorText = await response.text();
          console.error(`Error fetching work order details (${response.status}):`, errorText);
          throw new Error(`Failed to fetch work order details: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching work order details:', error);
        // Fallback to finding the work order in the already loaded array
        const foundWorkOrder = workOrders.find(wo => wo._id === id);
        if (foundWorkOrder) {
          console.log("Using cached work order:", foundWorkOrder);
          setSelectedWorkOrder(foundWorkOrder);
        } else {
          console.error("Work order not found in cache either");
          setError(`Could not load work order details. Please try refreshing.`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (watchWorkOrderId) {
      fetchWorkOrderDetails(watchWorkOrderId);
    } else {
      setSelectedWorkOrder(null);
    }
  }, [watchWorkOrderId, workOrders]);
  
  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Add calculated totals
      const invoiceData = {
        ...data,
        totalClientPayment: totals.clientPayment,
        totalMaterialCost: totals.materialCost,
        totalLaborCost: totals.laborCost,
        totalUtilityCost: totals.utilityCost,
        revenue: totals.revenue,
        issueDate: new Date().toISOString(),
        createdBy: session?.user?.id,
      };
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }
      
      // Navigate to invoices list
      router.push('/invoices');
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err.message || 'An error occurred while creating the invoice');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  return (
    <DashboardLayout title="Create Invoice">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Number */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="invoiceNumber">
                Invoice Number *
              </label>
              <input
                {...register('invoiceNumber')}
                id="invoiceNumber"
                type="text"
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
              {errors.invoiceNumber && (
                <p className="text-red-500 text-xs italic">{errors.invoiceNumber.message}</p>
              )}
            </div>
            
            {/* Work Order */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold" htmlFor="workOrderId">
                  Work Order * {workOrders.length > 0 ? `(${workOrders.length} available)` : '(No work orders found)'}
                </label>
                <button 
                  type="button" 
                  onClick={refreshWorkOrders}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded"
                >
                  Refresh Work Orders
                </button>
              </div>
              <select
                {...register('workOrderId')}
                id="workOrderId"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select a Work Order</option>
                {workOrders.map((wo) => (
                  <option key={wo._id} value={wo._id}>
                    {wo.workOrderNumber} - {wo.clientName} {wo.status ? `(${wo.status})` : ''}
                  </option>
                ))}
              </select>
              {errors.workOrderId && (
                <p className="text-red-500 text-xs italic">{errors.workOrderId.message}</p>
              )}
            </div>
            
            {/* Due Date */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                Due Date
              </label>
              <input
                {...register('dueDate')}
                id="dueDate"
                type="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs italic">{errors.dueDate.message}</p>
              )}
            </div>
          </div>
          
          {/* Work Order Info */}
          {selectedWorkOrder && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-semibold mb-2">Work Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Client:</span> {selectedWorkOrder.clientName}</p>
                  <p><span className="font-semibold">Company:</span> {selectedWorkOrder.companyName}</p>
                  <p><span className="font-semibold">Work Type:</span> {selectedWorkOrder.workType}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Address:</span> {selectedWorkOrder.address}</p>
                  <p><span className="font-semibold">Status:</span> {selectedWorkOrder.status}</p>
                  <p><span className="font-semibold">Completed Date:</span> {selectedWorkOrder.updatedAt ? format(new Date(selectedWorkOrder.updatedAt), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Client Payments Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Income - Client Payments</h3>
            <div className="space-y-4">
              {clientPaymentFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Payment #{index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeClientPayment(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Minus size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Amount *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <DollarSign size={16} className="text-gray-500" />
                        </div>
                        <input
                          {...register(`clientPayments.${index}.amount`)}
                          type="number"
                          step="0.01"
                          min="0"
                          className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                      {errors.clientPayments?.[index]?.amount && (
                        <p className="text-red-500 text-xs italic">
                          {errors.clientPayments[index].amount.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Payment Method *
                      </label>
                      <select
                        {...register(`clientPayments.${index}.paymentMethod`)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="">Select Method</option>
                        {paymentMethods.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                      {errors.clientPayments?.[index]?.paymentMethod && (
                        <p className="text-red-500 text-xs italic">
                          {errors.clientPayments[index].paymentMethod.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Payment Date *
                      </label>
                      <input
                        {...register(`clientPayments.${index}.paymentDate`)}
                        type="date"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                      {errors.clientPayments?.[index]?.paymentDate && (
                        <p className="text-red-500 text-xs italic">
                          {errors.clientPayments[index].paymentDate.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                      </label>
                      <input
                        {...register(`clientPayments.${index}.description`)}
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Payment description"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => appendClientPayment({
                  amount: 0,
                  paymentMethod: '',
                  description: '',
                  paymentDate: format(new Date(), 'yyyy-MM-dd')
                })}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <Plus size={18} className="mr-2" />
                Add Payment
              </button>
              
              <div className="mt-4 text-right">
                <p className="font-semibold text-lg">Total Client Payments: {formatCurrency(totals.clientPayment)}</p>
              </div>
            </div>
          </div>
          
          {/* Expenses Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Expenses</h3>
            <div className="space-y-4">
              {expenseFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Expense #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Minus size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Expense Type *
                      </label>
                      <select
                        {...register(`expenses.${index}.type`)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        {expenseTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.expenses?.[index]?.type && (
                        <p className="text-red-500 text-xs italic">
                          {errors.expenses[index].type.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Amount *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <DollarSign size={16} className="text-gray-500" />
                        </div>
                        <input
                          {...register(`expenses.${index}.amount`)}
                          type="number"
                          step="0.01"
                          min="0"
                          className="shadow appearance-none border rounded w-full py-2 px-3 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>
                      {errors.expenses?.[index]?.amount && (
                        <p className="text-red-500 text-xs italic">
                          {errors.expenses[index].amount.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                      </label>
                      <input
                        {...register(`expenses.${index}.description`)}
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Expense description"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Status *
                      </label>
                      <select
                        {...register(`expenses.${index}.status`)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        {expenseStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.expenses?.[index]?.status && (
                        <p className="text-red-500 text-xs italic">
                          {errors.expenses[index].status.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => appendExpense({
                  type: 'material',
                  amount: 0,
                  description: '',
                  status: 'unpaid'
                })}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <Plus size={18} className="mr-2" />
                Add Expense
              </button>
              
              <div className="mt-4 bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Material Costs: {formatCurrency(totals.materialCost)}</p>
                    <p className="font-medium">Labor Costs: {formatCurrency(totals.laborCost)}</p>
                    <p className="font-medium">Utility Costs: {formatCurrency(totals.utilityCost)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Expenses: {formatCurrency(totals.expenses)}</p>
                    <p className="font-semibold text-lg mt-2">
                      Revenue: <span className={totals.revenue < 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatCurrency(totals.revenue)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Client Payments - (Material + Labor + Utility)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              Invoice Notes
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows="3"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Additional notes about this invoice"
            ></textarea>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/invoices')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 