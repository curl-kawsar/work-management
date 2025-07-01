"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSession } from 'next-auth/react';
import { Upload, Plus, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

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
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      status: 'Created',
      nte: 0,
    }
  });

  // Fetch staff list for admin assignment
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const response = await fetch('/api/users/staff');
        const data = await response.json();
        console.log('Staff API response:', data);
        
        // Determine the correct data structure
        if (Array.isArray(data)) {
          setStaffList(data);
        } else if (data.users && Array.isArray(data.users)) {
          setStaffList(data.users);
        } else if (data.data && Array.isArray(data.data)) {
          setStaffList(data.data);
        } else if (typeof data === 'object' && data !== null) {
          // If it's an object with staff data in another format
          // Try to extract an array of users if available
          const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            setStaffList(possibleArrays[0]);
          } else {
            // If we can't find an array in the response, create staff list from object keys
            const staffArray = Object.entries(data).map(([id, details]) => {
              // Handle if each entry is an object with name/email or just a string
              if (typeof details === 'object') {
                return { _id: id, name: details.name || details.fullName || details.username || id };
              } else {
                return { _id: id, name: details || id };
              }
            });
            setStaffList(staffArray);
          }
        } else {
          console.warn('Could not determine staff data format:', data);
          setStaffList([]);
        }
      } catch (error) {
        console.error('Error fetching staff list:', error);
        setStaffList([]);
      }
    };

    // Only fetch staff list if user is admin
    if (session?.user?.role === 'admin') {
      fetchStaffList();
    }
  }, [session?.user?.role]);

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
    }
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Append all form fields
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
      
      // Append files
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Add the current user as creator
      formData.append('createdBy', session?.user?.id);
      
      // Set staff assignment based on role
      if (session?.user?.role === 'staff') {
        formData.append('assignedStaff', session.user.id);
      }

      // Send the request
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create work order');
      }

      // Redirect to work orders list
      router.push('/work-orders');
      router.refresh();
      
    } catch (err) {
      console.error('Error creating work order:', err);
      setError(err.message || 'An error occurred while creating the work order');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a default work order number
  useEffect(() => {
    const generateWorkOrderNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `WO-${year}${month}-${random}`;
    };

    reset({ 
      ...reset(),
      workOrderNumber: generateWorkOrderNumber(),
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

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Upload Photos/Videos
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="files" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload files</span>
                    <input 
                      id="files" 
                      name="files" 
                      type="file" 
                      multiple 
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, MP4 up to 10MB</p>
              </div>
            </div>
            
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="py-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="ml-2 text-sm text-gray-700 truncate">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
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
              disabled={isLoading || isUploading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isLoading ? 'Creating...' : 'Create Work Order'}
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
      </div>
    </DashboardLayout>
  );
} 