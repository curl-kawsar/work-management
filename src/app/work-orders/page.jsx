"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateWorkOrderButton from '@/components/work-orders/CreateWorkOrderButton';
import DeleteWorkOrderModal from '@/components/work-orders/DeleteWorkOrderModal';
import StaffWorkOrderCard from '@/components/staff/StaffWorkOrderCard';
import StaffNotifications from '@/components/staff/StaffNotifications';
import { Search, Edit, Trash2, Eye, ArrowUpDown, Filter, Grid, List, Bell, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { useWorkOrders, useUpdateWorkOrder } from '@/hooks/useWorkOrders';

export default function WorkOrders() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showNotifications, setShowNotifications] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    workOrder: null,
  });

  const isStaff = session?.user?.role === 'staff';
  const isAdmin = session?.user?.role === 'admin';

  // Tanstack Query hooks - API handles role-based filtering automatically
  const { 
    data: workOrders = [], 
    isLoading: loading, 
    refetch: refreshWorkOrders 
  } = useWorkOrders();

  const updateWorkOrderMutation = useUpdateWorkOrder();

  // Enhanced filtering for staff
  const getWorkOrderPriority = (workOrder) => {
    const dueDate = new Date(workOrder.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (workOrder.status === 'Completed') return 'low';
    if (daysUntilDue < 0) return 'high'; // Overdue
    if (daysUntilDue <= 1) return 'high'; // Due today or tomorrow
    if (daysUntilDue <= 3) return 'medium'; // Due within 3 days
    return 'low';
  };

  // Enhanced filtering
  const filteredWorkOrders = workOrders.filter(workOrder => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        workOrder.workOrderNumber.toLowerCase().includes(searchLower) ||
        workOrder.clientName.toLowerCase().includes(searchLower) ||
        workOrder.companyName.toLowerCase().includes(searchLower) ||
        workOrder.workType.toLowerCase().includes(searchLower) ||
        workOrder.address.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        const isOverdue = isPast(new Date(workOrder.dueDate)) && workOrder.status !== 'Completed';
        if (!isOverdue) return false;
      } else if (statusFilter === 'today') {
        const isDueToday = isToday(new Date(workOrder.dueDate)) || isToday(new Date(workOrder.scheduleDate));
        if (!isDueToday) return false;
      } else if (workOrder.status !== statusFilter) {
        return false;
      }
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      const priority = getWorkOrderPriority(workOrder);
      if (priority !== priorityFilter) return false;
    }

    return true;
  });

  // Handle quick status update for staff
  const handleQuickStatusUpdate = async (workOrderId, newStatus) => {
    try {
      await updateWorkOrderMutation.mutateAsync({
        id: workOrderId,
        data: { status: newStatus }
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle quick progress update for staff
  const handleQuickProgress = async (workOrderId, progressData) => {
    try {
      const workOrder = workOrders.find(wo => wo._id === workOrderId);
      const updatedNotes = [
        ...(workOrder.notes || []),
        {
          ...progressData,
          user: session.user.id,
          timestamp: new Date(),
        }
      ];

      await updateWorkOrderMutation.mutateAsync({
        id: workOrderId,
        data: { notes: updatedNotes }
      });
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Open delete modal
  const handleDeleteClick = (workOrder) => {
    setDeleteModal({
      isOpen: true,
      workOrder: workOrder,
    });
  };

  // Handle successful deletion
  const handleDeleteSuccess = (deletedId) => {
    // Refresh the work orders list
    refreshWorkOrders();
    setDeleteModal({
      isOpen: false,
      workOrder: null,
    });
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      workOrder: null,
    });
  };

  // Sort and filter work orders
  const sortedAndFilteredWorkOrders = [...workOrders]
    .filter(wo => {
      if (searchTerm === '') return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        wo.workOrderNumber.toLowerCase().includes(searchLower) ||
        wo.clientName.toLowerCase().includes(searchLower) ||
        wo.companyName.toLowerCase().includes(searchLower) ||
        wo.workType.toLowerCase().includes(searchLower) ||
        wo.status.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Status badge colors
  const statusColors = {
    Created: 'bg-blue-100 text-blue-800',
    Ongoing: 'bg-amber-100 text-amber-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <DashboardLayout title="Work Orders">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          <CreateWorkOrderButton />
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('workOrderNumber')}
                    >
                      <div className="flex items-center">
                        WO Number
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('clientName')}
                    >
                      <div className="flex items-center">
                        Client
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('companyName')}
                    >
                      <div className="flex items-center">
                        Company
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('workType')}
                    >
                      <div className="flex items-center">
                        Work Type
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('dueDate')}
                    >
                      <div className="flex items-center">
                        Due Date
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAndFilteredWorkOrders.length > 0 ? (
                    sortedAndFilteredWorkOrders.map((wo) => (
                      <tr key={wo._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {wo.workOrderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {wo.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {wo.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {wo.workType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[wo.status]}`}>
                            {wo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(wo.dueDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/work-orders/${wo._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye size={18} />
                            </Link>
                            {/* Edit and Delete buttons only for appropriate roles */}
                            {session?.user?.role === 'admin' || 
                             (session?.user?.role === 'staff' && 
                              wo.assignedStaff === session?.user?.id) ? (
                              <>
                                <Link
                                  href={`/work-orders/${wo._id}/edit`}
                                  className="text-amber-600 hover:text-amber-900"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </Link>
                                {session?.user?.role === 'admin' && (
                                  <button
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete"
                                    onClick={() => handleDeleteClick(wo)}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        No work orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications Modal for Staff */}
        {isStaff && (
          <StaffNotifications
            workOrders={workOrders}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteWorkOrderModal
          workOrder={deleteModal.workOrder}
          isOpen={deleteModal.isOpen}
          onClose={handleCloseDeleteModal}
          onDelete={handleDeleteSuccess}
        />
      </div>
    </DashboardLayout>
  );
}