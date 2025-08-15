"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Database, 
  Clock, 
  Mail, 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  Download,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Server
} from 'lucide-react';

export default function BackupManager() {
  const { data: session } = useSession();
  const [schedulerInfo, setSchedulerInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch scheduler info and stats
  const fetchData = async () => {
    if (session?.user?.role !== 'admin') return;
    
    setLoading(true);
    try {
      // Get scheduler info
      const schedulerRes = await fetch('/api/backup/scheduler?action=info');
      const schedulerData = await schedulerRes.json();
      setSchedulerInfo(schedulerData.info);

      // Get backup stats
      const statsRes = await fetch('/api/backup?action=stats');
      const statsData = await statsRes.json();
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Handle scheduler actions
  const handleSchedulerAction = async (action) => {
    setActionLoading(action);
    try {
      let response;
      
      switch (action) {
        case 'start':
        case 'restart':
          response = await fetch('/api/backup/scheduler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
          });
          break;
        case 'stop':
          response = await fetch('/api/backup/scheduler', {
            method: 'DELETE'
          });
          break;
        case 'manual-backup':
          response = await fetch('/api/backup/scheduler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
          });
          break;
        case 'test-email':
          response = await fetch('/api/backup?action=test-email');
          break;
      }

      const result = await response.json();
      console.log(`${action} result:`, result);
      
      // Refresh data after action
      setTimeout(fetchData, 1000);
      
      // Show success message
      alert(result.message || `${action} completed successfully`);
    } catch (error) {
      console.error(`Error with ${action}:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (session?.user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading backup information...</span>
        </div>
      </div>
    );
  }

  const isSchedulerRunning = schedulerInfo?.status?.isRunning;
  const nextRun = schedulerInfo?.status?.nextRun;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Database className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Backup Management</h3>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      {/* Scheduler Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Scheduler Status</h4>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isSchedulerRunning 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isSchedulerRunning ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Running
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Stopped
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Schedule: Daily at 6:00 AM
            </div>
            <div className="flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Timezone: Asia/Dhaka (UTC+6)
            </div>
            {nextRun && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Next run: {nextRun}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Database Statistics</h4>
          {stats && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.users || 0}</div>
                <div className="text-gray-600">Users</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{stats.workOrders || 0}</div>
                <div className="text-gray-600">Work Orders</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{stats.invoices || 0}</div>
                <div className="text-gray-600">Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{stats.activityLogs || 0}</div>
                <div className="text-gray-600">Activity Logs</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        {!isSchedulerRunning ? (
          <button
            onClick={() => handleSchedulerAction('start')}
            disabled={actionLoading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {actionLoading === 'start' ? 'Starting...' : 'Start Scheduler'}
          </button>
        ) : (
          <button
            onClick={() => handleSchedulerAction('stop')}
            disabled={actionLoading}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            {actionLoading === 'stop' ? 'Stopping...' : 'Stop Scheduler'}
          </button>
        )}

        <button
          onClick={() => handleSchedulerAction('restart')}
          disabled={actionLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {actionLoading === 'restart' ? 'Restarting...' : 'Restart Scheduler'}
        </button>

        <button
          onClick={() => handleSchedulerAction('manual-backup')}
          disabled={actionLoading}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          {actionLoading === 'manual-backup' ? 'Creating...' : 'Manual Backup'}
        </button>

        <button
          onClick={() => handleSchedulerAction('test-email')}
          disabled={actionLoading}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          <Mail className="h-4 w-4 mr-2" />
          {actionLoading === 'test-email' ? 'Sending...' : 'Test Email'}
        </button>
      </div>

      {/* Information Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2">📋 How it works</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Automated backups run daily at 6:00 AM Bangladesh Time</li>
          <li>• All database collections are exported to CSV format</li>
          <li>• Backup files are automatically emailed to test@1550plus.com</li>
          <li>• Old backup files (30+ days) are automatically cleaned up</li>
          <li>• Manual backups can be triggered anytime using the button above</li>
        </ul>
      </div>
    </div>
  );
}