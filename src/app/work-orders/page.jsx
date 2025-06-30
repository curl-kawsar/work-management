"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateWorkOrderButton from '@/components/work-orders/CreateWorkOrderButton';
import { Search, Edit, Trash2, Eye, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkOrders() {
  const { data: session } = useSession();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const response = await fetch('/api/work-orders');
        if (response.ok) {
          const data = await response.json();
          setWorkOrders(data.workOrders);
        } else {
          throw new Error('Failed to fetch work orders');
        }
      } catch (error) {
        console.error('Error fetching work orders:', error);
        
        // Sample data for development
        setWorkOrders([
          {
            _id: '1',
            workOrderNumber: 'WO-2023-001',
            clientName: 'ABC Company',
            companyName: 'ABC Inc.',
            workType: 'Repair',
            status: 'Ongoing',
            scheduleDate: '2023-06-15T00:00:00.000Z',
            dueDate: '2023-06-20T00:00:00.000Z',
            createdAt: '2023-06-10T00:00:00.000Z',
          },
          {
            _id: '2',
            workOrderNumber: 'WO-2023-002',
            clientName: 'XYZ Corporation',
            companyName: 'XYZ Corp',
            workType: 'Installation',
            status: 'Completed',
            scheduleDate: '2023-06-05T00:00:00.000Z',
            dueDate: '2023-06-10T00:00:00.000Z',
            createdAt: '2023-06-01T00:00:00.000Z',
          },
          {
            _id: '3',
            workOrderNumber: 'WO-2023-003',
            clientName: 'Acme Corp',
            companyName: 'Acme Inc.',
            workType: 'Maintenance',
            status: 'Created',
            scheduleDate: '2023-06-25T00:00:00.000Z',
            dueDate: '2023-06-30T00:00:00.000Z',
            createdAt: '2023-06-20T00:00:00.000Z',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Delete work order
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/work-orders/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove the deleted work order from the UI
          setWorkOrders((prevOrders) => prevOrders.filter(wo => wo._id !== id));
        } else {
          // Handle error response
          const errorData = await response.json();
          alert(errorData.message || 'Failed to delete work order');
        }
      } catch (error) {
        console.error('Error deleting work order:', error);
        alert('An error occurred while deleting the work order');
      }
    }
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
                                    onClick={() => handleDelete(wo._id)}
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
      </div>
    </DashboardLayout>
  );
} 