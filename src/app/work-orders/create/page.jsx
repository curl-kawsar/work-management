"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSession } from 'next-auth/react';
import { Upload, Plus, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FileManager from '@/components/files/FileManager';
import { useStaffUsers } from '@/hooks/useUsers';
import { useCreateWorkOrder } from '@/hooks/useWorkOrders';

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
  notes: yup.string().required('Notes are required'),
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

export default function CreateWorkOrder() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [showFileManager, setShowFileManager] = useState(false);

  // Tanstack Query hooks
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffUsers({
    enabled: session?.user?.role === 'admin'
  });
  const createWorkOrderMutation = useCreateWorkOrder();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      status: 'Created',
      nte: 0,
    }
  });

  // Staff list is now handled by the useStaffUsers hook

  // Generate a default work order number
  const generateWorkOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `WO-${year}${month}-${random}`;
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setError('');

    try {
      // Create JSON payload instead of FormData (files are handled separately now)
      const workOrderData = {
        ...data,
        createdBy: session?.user?.id,
      };
      
      // Set staff assignment based on role
      if (session?.user?.role === 'staff') {
        workOrderData.assignedStaff = session.user.id;
      }

      const result = await createWorkOrderMutation.mutateAsync(workOrderData);
      
      // Show file manager for uploading files after work order creation
      if (result.workOrder) {
        setShowFileManager(true);
        setWorkOrderNumber(result.workOrder.workOrderNumber);
      } else {
        // If no files to upload, redirect immediately
        router.push('/work-orders');
        router.refresh();
      }
      
    } catch (err) {
      console.error('Error creating work order:', err);
      setError(err.message || 'An error occurred while creating the work order');
    }
  };

  // Initialize form with default values
  useEffect(() => {
    const defaultWorkOrderNumber = generateWorkOrderNumber();
    reset({ 
      workOrderNumber: defaultWorkOrderNumber,
      status: 'Created'
    });
  }, [reset]);

  return (
    <DashboardLayout title="Create Work Order">
      <div className="max-w-5xl mx-auto">
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
                min="0"
                step="0.01"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {errors.nte && (
                <p className="text-red-500 text-xs italic">{errors.nte.message}</p>
              )}
            </div>

            {/* Assign Staff (Admin Only) */}
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
                  {staffList && staffList.length > 0 && staffList.map((staff) => (
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
                Status *
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
              Notes / Activities *
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows="3"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter initial notes"
            ></textarea>
            {errors.notes && (
              <p className="text-red-500 text-xs italic">{errors.notes.message}</p>
            )}
          </div>

          {/* File Upload Note */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <Upload className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">File Upload</h3>
                <p className="text-sm text-blue-700 mt-1">
                  After creating the work order, you'll be able to upload photos, videos, and documents.
                </p>
              </div>
            </div>
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
              disabled={createWorkOrderMutation.isPending}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createWorkOrderMutation.isPending ? 'Creating...' : 'Create Work Order'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/work-orders')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* File Manager Modal - Show after work order creation */}
        {showFileManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upload Files for Work Order: {workOrderNumber}
                  </h2>
                  <button
                    onClick={() => {
                      setShowFileManager(false);
                      router.push('/work-orders');
                      router.refresh();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <FileManager
                  workOrderNumber={workOrderNumber}
                  showUpload={true}
                  showGallery={false}
                  title=""
                  onUploadSuccess={() => {
                    // Optional: show success message
                  }}
                />
              </div>
              
              <div className="p-6 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    You can upload files now or skip and add them later.
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowFileManager(false);
                        router.push('/work-orders');
                        router.refresh();
                      }}
                      className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Skip for Now
                    </button>
                    <button
                      onClick={() => {
                        setShowFileManager(false);
                        router.push(`/work-orders/${workOrderNumber}`);
                        router.refresh();
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Work Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 