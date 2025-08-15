"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSession } from 'next-auth/react';
import { Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { useStaffUsers } from '@/hooks/useUsers';

// Form validation schema
const schema = yup.object().shape({
  workOrderNumber: yup.string().required('Work Order Number is required'),
  details: yup.string().required('Work Order Details are required'),
  address: yup.string().required('Work Order Address is required'),
  workType: yup.string().required('Work Type is required'),
  scheduleDate: yup.string().required('Schedule Date is required'),
  dueDate: yup.string().required('Due Date is required'),
  clientName: yup.string().required('Client Name is required'),
  companyName: yup.string().required('Company Name is required'),
  nte: yup.number().transform((value) => 
    isNaN(value) || value === null || value === undefined ? 0 : value
  ),
  assignedStaff: yup.string(),
  notes: yup.string(),
  status: yup.string().required('Status is required'),
});

// Work order status options
const statusOptions = [
  { value: 'Created', label: 'Created' },
  { value: 'Ongoing', label: 'Ongoing' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

// Work type options
const workTypeOptions = [
  { value: 'Installation', label: 'Installation' },
  { value: 'Repair', label: 'Repair' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Inspection', label: 'Inspection' },
  { value: 'Other', label: 'Other' },
];

export default function EditWorkOrder({ params }) {
  const { id } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const [error, setError] = useState('');

  // Tanstack Query hooks
  const { 
    data: workOrder, 
    isLoading: loadingWorkOrder, 
    error: fetchError 
  } = useWorkOrder(id);
  
  const { data: staffList = [] } = useStaffUsers({
    enabled: session?.user?.role === 'admin'
  });
  
  const updateWorkOrderMutation = useUpdateWorkOrder();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
  });

  // Pre-populate form when work order data loads
  useEffect(() => {
    if (workOrder) {
      const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
      };

      reset({
        workOrderNumber: workOrder.workOrderNumber || '',
        details: workOrder.details || '',
        address: workOrder.address || '',
        workType: workOrder.workType || '',
        scheduleDate: formatDate(workOrder.scheduleDate),
        dueDate: formatDate(workOrder.dueDate),
        clientName: workOrder.clientName || '',
        companyName: workOrder.companyName || '',
        nte: workOrder.nte || 0,
        assignedStaff: workOrder.assignedStaff?._id || workOrder.assignedStaff || '',
        notes: workOrder.notes?.[workOrder.notes.length - 1]?.message || '',
        status: workOrder.status || 'Created',
      });
    }
  }, [workOrder, reset]);

  // Check permissions
  const canEdit = session?.user?.role === 'admin' || 
    (session?.user?.role === 'staff' && workOrder?.assignedStaff?._id === session?.user?.id);

  // Handle form submission
  const onSubmit = async (data) => {
    setError('');

    try {
      await updateWorkOrderMutation.mutateAsync({
        id,
        data: {
          ...data,
          // If there are new notes, add them to the notes array
          ...(data.notes && data.notes.trim() !== '' && 
              data.notes !== (workOrder.notes?.[workOrder.notes.length - 1]?.message || '') && {
            notes: [
              ...(workOrder.notes || []),
              {
                message: data.notes,
                type: 'note',
                priority: 'normal',
                timestamp: new Date(),
                user: session.user.id
              }
            ]
          })
        }
      });

      router.push(`/work-orders/${id}`);
    } catch (err) {
      console.error('Error updating work order:', err);
      setError(err.message || 'An error occurred while updating the work order');
    }
  };

  if (loadingWorkOrder) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError || !workOrder) {
    return (
      <DashboardLayout title="Error">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Work Order Not Found</h2>
            <p className="text-gray-600">{fetchError?.message || 'The work order you are looking for does not exist.'}</p>
          </div>
          <Link 
            href="/work-orders"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Work Orders
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!canEdit) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to edit this work order.</p>
          </div>
          <Link 
            href={`/work-orders/${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Work Order
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit Work Order ${workOrder.workOrderNumber}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/work-orders/${id}`}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span>Back to Work Order</span>
              </Link>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work Order Number */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="workOrderNumber">
                Work Order Number *
              </label>
              <input
                {...register('workOrderNumber')}
                id="workOrderNumber"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={session?.user?.role === 'staff'}
              />
              {errors.workOrderNumber && (
                <p className="text-red-500 text-xs italic">{errors.workOrderNumber.message}</p>
              )}
            </div>

            {/* Work Type */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="workType">
                Work Type *
              </label>
              <select
                {...register('workType')}
                id="workType"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Work Type</option>
                {workTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.workType && (
                <p className="text-red-500 text-xs italic">{errors.workType.message}</p>
              )}
            </div>

            {/* Client Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientName">
                Client Name *
              </label>
              <input
                {...register('clientName')}
                id="clientName"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.clientName && (
                <p className="text-red-500 text-xs italic">{errors.clientName.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="companyName">
                Company Name *
              </label>
              <input
                {...register('companyName')}
                id="companyName"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs italic">{errors.companyName.message}</p>
              )}
            </div>

            {/* Schedule Date */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduleDate">
                Schedule Date *
              </label>
              <input
                {...register('scheduleDate')}
                id="scheduleDate"
                type="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.scheduleDate && (
                <p className="text-red-500 text-xs italic">{errors.scheduleDate.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                Due Date *
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

            {/* NTE */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nte">
                NTE (Not to Exceed)
              </label>
              <input
                {...register('nte')}
                id="nte"
                type="number"
                step="0.01"
                min="0"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.nte && (
                <p className="text-red-500 text-xs italic">{errors.nte.message}</p>
              )}
            </div>

            {/* Assigned Staff (Admin only) */}
            {session?.user?.role === 'admin' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assignedStaff">
                  Assign Staff
                </label>
                <select
                  {...register('assignedStaff')}
                  id="assignedStaff"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Staff Member</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
                {errors.assignedStaff && (
                  <p className="text-red-500 text-xs italic">{errors.assignedStaff.message}</p>
                )}
              </div>
            )}

            {/* Status */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                Current Status *
              </label>
              <select
                {...register('status')}
                id="status"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-red-500 text-xs italic">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Work Order Address */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Work Order Address *
            </label>
            <input
              {...register('address')}
              id="address"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.address && (
              <p className="text-red-500 text-xs italic">{errors.address.message}</p>
            )}
          </div>

          {/* Work Order Details */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="details">
              Work Order Details *
            </label>
            <textarea
              {...register('details')}
              id="details"
              rows="4"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            ></textarea>
            {errors.details && (
              <p className="text-red-500 text-xs italic">{errors.details.message}</p>
            )}
          </div>

          {/* Notes / Activities */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              Add Notes / Update Activity
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows="3"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Add new notes or updates..."
            ></textarea>
            {errors.notes && (
              <p className="text-red-500 text-xs italic">{errors.notes.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={updateWorkOrderMutation.isPending}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>{updateWorkOrderMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <Link
              href={`/work-orders/${id}`}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              <X size={16} />
              <span>Cancel</span>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}