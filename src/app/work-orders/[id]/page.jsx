"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  User, 
  Building, 
  Clock, 
  FileText, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FileManager from '@/components/files/FileManager';
import ProgressTimeline from '@/components/work-orders/ProgressTimeline';
import QuickAddProgress from '@/components/work-orders/QuickAddProgress';
import { useWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';

export default function WorkOrderPage({ params }) {
  const { id } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('details');
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Tanstack Query hooks
  const { 
    data: workOrder, 
    isLoading: loading, 
    error: queryError 
  } = useWorkOrder(id);
  
  const updateWorkOrderMutation = useUpdateWorkOrder();
  
  const error = queryError?.message;

  // Handle adding new notes
  const handleAddNote = async (noteData) => {
    try {
      const updatedNotes = [
        ...(workOrder.notes || []),
        {
          ...noteData,
          user: session.user.id,
          timestamp: new Date(),
        }
      ];

      await updateWorkOrderMutation.mutateAsync({
        id,
        data: { notes: updatedNotes }
      });
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  // Check if user can add notes
  const canAddNotes = session?.user?.role === 'admin' || 
    (session?.user?.role === 'staff' && workOrder?.assignedStaff?._id === session?.user?.id);

  // Status badge colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Created':
        return 'bg-blue-100 text-blue-800';
      case 'Ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !workOrder) {
    return (
      <DashboardLayout title="Error">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle size={48} className="text-red-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Work Order Not Found</h2>
            <p className="text-gray-600">{error || 'The work order you are looking for does not exist.'}</p>
          </div>
          <button
            onClick={() => router.push('/work-orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Work Orders
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Work Order ${workOrder.workOrderNumber}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {workOrder.workOrderNumber}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Created {formatDateTime(workOrder.createdAt)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workOrder.status)}`}>
                  {workOrder.status}
                </span>
                {(session?.user?.role === 'admin' || 
                  workOrder.assignedStaff?._id === session?.user?.id) && (
                  <button
                    onClick={() => router.push(`/work-orders/${id}/edit`)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('details')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Progress Timeline
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Files & Media
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Work Order Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-medium">{workOrder.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{workOrder.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{workOrder.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Work Type</p>
                      <p className="font-medium">{workOrder.workType}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Schedule Date</p>
                      <p className="font-medium">{formatDate(workOrder.scheduleDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{formatDate(workOrder.dueDate)}</p>
                    </div>
                  </div>
                  {workOrder.nte > 0 && (
                    <div className="flex items-center space-x-2">
                      <DollarSign size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">NTE (Not to Exceed)</p>
                        <p className="font-medium">${workOrder.nte.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {workOrder.assignedStaff && (
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Assigned Staff</p>
                        <p className="font-medium">{workOrder.assignedStaff.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Work Details</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{workOrder.details}</p>
              </div>

              {/* Recent Activity Preview */}
              {workOrder.notes && workOrder.notes.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Full Timeline →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {workOrder.notes
                      .slice(-3) // Show only last 3 activities
                      .reverse()
                      .map((note, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-700 text-sm">{note.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateTime(note.timestamp)}
                                {note.user && typeof note.user === 'object' && (
                                  <span> • by {note.user.name}</span>
                                )}
                              </p>
                            </div>
                            {note.type && (
                              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                {note.type}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {canAddNotes && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setShowQuickAdd(!showQuickAdd)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Quick Update
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('progress');
                            setShowAddNoteForm(true);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Full Timeline →
                        </button>
                      </div>
                      {showQuickAdd && (
                        <div className="mt-3">
                          <QuickAddProgress
                            onAddNote={handleAddNote}
                            onCancel={() => setShowQuickAdd(false)}
                            isSubmitting={updateWorkOrderMutation.isPending}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Progress */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status & Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Current Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workOrder.status)}`}>
                      {workOrder.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm font-medium">{formatDate(workOrder.createdAt)}</span>
                  </div>
                  {workOrder.updatedAt !== workOrder.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Last Updated</span>
                      <span className="text-sm font-medium">{formatDate(workOrder.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Team */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Team</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Created by</p>
                    <p className="font-medium">
                      {workOrder.createdBy?.name || 'Unknown'}
                    </p>
                  </div>
                  {workOrder.assignedStaff && (
                    <div>
                      <p className="text-sm text-gray-500">Assigned to</p>
                      <p className="font-medium">{workOrder.assignedStaff.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Timeline Tab */}
        {activeTab === 'progress' && (
          <ProgressTimeline
            workOrder={workOrder}
            onAddNote={handleAddNote}
            canAddNotes={canAddNotes}
            showAddNoteForm={showAddNoteForm}
            onToggleAddNoteForm={setShowAddNoteForm}
          />
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white shadow rounded-lg p-6">
            <FileManager
              workOrderNumber={workOrder.workOrderNumber}
              showUpload={session?.user?.role === 'admin' || workOrder.assignedStaff?._id === session?.user?.id}
              showGallery={true}
              title="Work Order Files & Media"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}