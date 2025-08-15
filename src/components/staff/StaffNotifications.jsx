"use client";
import { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText,
  User,
  Zap,
  TrendingUp
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isPast } from 'date-fns';

const NOTIFICATION_ICONS = {
  overdue: AlertTriangle,
  due_today: Calendar,
  assignment: User,
  status_change: TrendingUp,
  new_note: FileText,
  reminder: Bell,
  urgent: Zap,
};

const NOTIFICATION_COLORS = {
  overdue: 'bg-red-100 text-red-800 border-red-200',
  due_today: 'bg-orange-100 text-orange-800 border-orange-200',
  assignment: 'bg-blue-100 text-blue-800 border-blue-200',
  status_change: 'bg-green-100 text-green-800 border-green-200',
  new_note: 'bg-purple-100 text-purple-800 border-purple-200',
  reminder: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

export default function StaffNotifications({ 
  workOrders = [], 
  isOpen, 
  onClose,
  onMarkAsRead 
}) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!workOrders.length) return;

    const newNotifications = [];
    const today = new Date();

    workOrders.forEach(workOrder => {
      const dueDate = new Date(workOrder.dueDate);
      const scheduleDate = new Date(workOrder.scheduleDate);

      // Overdue notifications
      if (isPast(dueDate) && workOrder.status !== 'Completed') {
        newNotifications.push({
          id: `overdue-${workOrder._id}`,
          type: 'overdue',
          title: 'Work Order Overdue',
          message: `${workOrder.workOrderNumber} for ${workOrder.clientName} is overdue`,
          workOrderId: workOrder._id,
          workOrder,
          timestamp: dueDate,
          priority: 'high',
          actionRequired: true,
        });
      }

      // Due today notifications
      if (isToday(dueDate) && workOrder.status !== 'Completed') {
        newNotifications.push({
          id: `due-today-${workOrder._id}`,
          type: 'due_today',
          title: 'Work Order Due Today',
          message: `${workOrder.workOrderNumber} for ${workOrder.clientName} is due today`,
          workOrderId: workOrder._id,
          workOrder,
          timestamp: dueDate,
          priority: 'medium',
          actionRequired: true,
        });
      }

      // Scheduled for today
      if (isToday(scheduleDate) && workOrder.status === 'Created') {
        newNotifications.push({
          id: `scheduled-today-${workOrder._id}`,
          type: 'reminder',
          title: 'Work Scheduled for Today',
          message: `${workOrder.workOrderNumber} is scheduled to start today`,
          workOrderId: workOrder._id,
          workOrder,
          timestamp: scheduleDate,
          priority: 'medium',
          actionRequired: true,
        });
      }

      // Recent status changes (last 24 hours)
      const lastUpdated = new Date(workOrder.updatedAt);
      const hoursAgo = (today - lastUpdated) / (1000 * 60 * 60);
      
      if (hoursAgo <= 24 && workOrder.status === 'Ongoing') {
        newNotifications.push({
          id: `status-change-${workOrder._id}`,
          type: 'status_change',
          title: 'Work Order Started',
          message: `${workOrder.workOrderNumber} status changed to Ongoing`,
          workOrderId: workOrder._id,
          workOrder,
          timestamp: lastUpdated,
          priority: 'low',
          actionRequired: false,
        });
      }

      // Recent notes/updates
      if (workOrder.notes && workOrder.notes.length > 0) {
        const latestNote = workOrder.notes[workOrder.notes.length - 1];
        const noteTime = new Date(latestNote.timestamp);
        const noteHoursAgo = (today - noteTime) / (1000 * 60 * 60);
        
        if (noteHoursAgo <= 12 && latestNote.type === 'issue') {
          newNotifications.push({
            id: `new-note-${workOrder._id}-${latestNote.timestamp}`,
            type: 'urgent',
            title: 'Issue Reported',
            message: `Issue in ${workOrder.workOrderNumber}: ${latestNote.message.substring(0, 50)}...`,
            workOrderId: workOrder._id,
            workOrder,
            timestamp: noteTime,
            priority: 'high',
            actionRequired: true,
          });
        }
      }
    });

    // Sort by priority and timestamp
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    newNotifications.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    setNotifications(newNotifications);
  }, [workOrders]);

  const handleNotificationClick = (notification) => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    // Navigate to work order
    window.location.href = `/work-orders/${notification.workOrderId}`;
  };

  const urgentCount = notifications.filter(n => n.priority === 'high').length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] mt-16">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {(urgentCount > 0 || actionRequiredCount > 0) && (
              <p className="text-sm text-gray-600">
                {urgentCount > 0 && `${urgentCount} urgent`}
                {urgentCount > 0 && actionRequiredCount > 0 && ' • '}
                {actionRequiredCount > 0 && `${actionRequiredCount} require action`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No new notifications at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type];
                const colorClass = NOTIFICATION_COLORS[notification.type];
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full border ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {notification.priority === 'high' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Urgent
                              </span>
                            )}
                            {notification.actionRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Action Required
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {notification.workOrder && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                notification.workOrder.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                notification.workOrder.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {notification.workOrder.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setNotifications([]);
                  onClose();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}