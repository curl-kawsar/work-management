"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AssignmentDebugger() {
  const { data: session } = useSession();
  const [debugInfo, setDebugInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDebugInfo = async () => {
    if (session?.user?.role !== 'admin') return;
    
    setIsLoading(true);
    try {
      // Fetch all work orders
      const workOrdersRes = await fetch('/api/work-orders');
      const workOrdersData = await workOrdersRes.json();
      
      // Fetch all users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      
      setDebugInfo({
        workOrders: workOrdersData.workOrders || [],
        users: usersData.users || [],
        currentUser: session.user
      });
    } catch (error) {
      console.error('Error fetching debug info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, [session]);

  if (session?.user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Loading debug information...</p>
      </div>
    );
  }

  if (!debugInfo) {
    return null;
  }

  const staffUsers = debugInfo.users.filter(user => user.role === 'staff');
  const workOrdersWithStaff = debugInfo.workOrders.filter(wo => wo.assignedStaff);
  const workOrdersWithoutStaff = debugInfo.workOrders.filter(wo => !wo.assignedStaff);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-medium text-blue-900 mb-4">🔧 Assignment Debugger (Admin Only)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-900">Staff Users</h4>
          <p className="text-2xl font-bold text-blue-600">{staffUsers.length}</p>
          <div className="mt-2 text-sm text-gray-600">
            {staffUsers.map(user => (
              <div key={user._id} className="flex justify-between">
                <span>{user.name}</span>
                <span className="font-mono text-xs">{user._id}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-900">Work Orders with Staff</h4>
          <p className="text-2xl font-bold text-green-600">{workOrdersWithStaff.length}</p>
          <div className="mt-2 text-sm text-gray-600">
            {workOrdersWithStaff.slice(0, 3).map(wo => (
              <div key={wo._id} className="mb-1">
                <div className="font-medium">{wo.workOrderNumber}</div>
                <div className="text-xs">
                  Staff: {wo.assignedStaff?.name || 'Unknown'} 
                  <span className="font-mono ml-1">({wo.assignedStaff?._id || wo.assignedStaff})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-900">Unassigned Work Orders</h4>
          <p className="text-2xl font-bold text-red-600">{workOrdersWithoutStaff.length}</p>
          <div className="mt-2 text-sm text-gray-600">
            {workOrdersWithoutStaff.slice(0, 3).map(wo => (
              <div key={wo._id} className="mb-1">
                <div className="font-medium">{wo.workOrderNumber}</div>
                <div className="text-xs">Client: {wo.clientName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded border">
        <h4 className="font-medium text-gray-900 mb-2">Current Session Info</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>User ID: <span className="font-mono">{debugInfo.currentUser.id}</span></div>
          <div>User Name: {debugInfo.currentUser.name}</div>
          <div>User Role: {debugInfo.currentUser.role}</div>
        </div>
      </div>

      {workOrdersWithStaff.length === 0 && staffUsers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
          <h4 className="font-medium text-red-800">⚠️ Issue Detected</h4>
          <p className="text-red-700 text-sm mt-1">
            You have staff users but no work orders are assigned to them. 
            Try editing a work order and assigning it to a staff member.
          </p>
        </div>
      )}

      <div className="mt-4 flex space-x-2">
        <button
          onClick={fetchDebugInfo}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Refresh Debug Info
        </button>
      </div>
    </div>
  );
}