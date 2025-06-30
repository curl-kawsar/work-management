"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Plus, Eye, Edit, ArrowUpDown, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function Invoices() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'issueDate',
    direction: 'desc'
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('/api/invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices);
        } else {
          throw new Error('Failed to fetch invoices');
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        
        // Sample data for development
        setInvoices([
          {
            _id: '1',
            invoiceNumber: 'INV-2023-001',
            workOrder: {
              _id: '1',
              workOrderNumber: 'WO-2023-001',
              clientName: 'ABC Company',
            },
            totalClientPayment: 5000,
            totalMaterialCost: 1200,
            totalLaborCost: 2000,
            totalUtilityCost: 300,
            revenue: 1500,
            issueDate: '2023-06-15T00:00:00.000Z',
            status: 'paid',
          },
          {
            _id: '2',
            invoiceNumber: 'INV-2023-002',
            workOrder: {
              _id: '2',
              workOrderNumber: 'WO-2023-002',
              clientName: 'XYZ Corporation',
            },
            totalClientPayment: 7500,
            totalMaterialCost: 3000,
            totalLaborCost: 2500,
            totalUtilityCost: 500,
            revenue: 1500,
            issueDate: '2023-06-20T00:00:00.000Z',
            status: 'sent',
          },
          {
            _id: '3',
            invoiceNumber: 'INV-2023-003',
            workOrder: {
              _id: '3',
              workOrderNumber: 'WO-2023-003',
              clientName: 'Acme Corp',
            },
            totalClientPayment: 3500,
            totalMaterialCost: 1000,
            totalLaborCost: 1500,
            totalUtilityCost: 200,
            revenue: 800,
            issueDate: '2023-06-25T00:00:00.000Z',
            status: 'draft',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort and filter invoices
  const sortedAndFilteredInvoices = [...invoices]
    .filter(invoice => {
      if (searchTerm === '') return true;
      const searchLower = searchTerm.toLowerCase();
      
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.workOrder?.workOrderNumber?.toLowerCase().includes(searchLower) ||
        invoice.workOrder?.clientName?.toLowerCase().includes(searchLower) ||
        invoice.status.toLowerCase().includes(searchLower)
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
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DashboardLayout title="Invoices">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          
          {/* Only show Create button for staff and admin */}
          {session?.user?.role && ['staff', 'admin'].includes(session.user.role) && (
            <Link
              href="/invoices/create"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Create Invoice
            </Link>
          )}
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
                      onClick={() => handleSort('invoiceNumber')}
                    >
                      <div className="flex items-center">
                        Invoice #
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('workOrder.workOrderNumber')}
                    >
                      <div className="flex items-center">
                        Work Order
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('workOrder.clientName')}
                    >
                      <div className="flex items-center">
                        Client
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('totalClientPayment')}
                    >
                      <div className="flex items-center">
                        Income
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('revenue')}
                    >
                      <div className="flex items-center">
                        Revenue
                        <ArrowUpDown size={14} className="ml-1" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('issueDate')}
                    >
                      <div className="flex items-center">
                        Date
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAndFilteredInvoices.length > 0 ? (
                    sortedAndFilteredInvoices.map((invoice) => (
                      <tr key={invoice._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.workOrder?.workOrderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.workOrder?.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.totalClientPayment)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${invoice.revenue < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(invoice.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[invoice.status]}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/invoices/${invoice._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye size={18} />
                            </Link>
                            {/* Edit link for staff and admin */}
                            {session?.user?.role && ['staff', 'admin'].includes(session.user.role) && (
                              <Link
                                href={`/invoices/${invoice._id}/edit`}
                                className="text-amber-600 hover:text-amber-900"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </Link>
                            )}
                            {/* PDF download/print link */}
                            <Link
                              href={`/api/invoices/${invoice._id}/pdf`}
                              className="text-gray-600 hover:text-gray-900"
                              title="Download PDF"
                              target="_blank"
                            >
                              <FileText size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                        No invoices found
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