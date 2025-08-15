"use client";
import { useState } from 'react';
import Link from 'next/link';
import { 
  Eye, 
  Edit, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  DollarSign,
  FileText,
  Camera,
  MessageSquare,
  Zap,
  CheckCircle,
  Play,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  'Created': 'bg-blue-100 text-blue-800 border-blue-200',
  'Ongoing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Completed': 'bg-green-100 text-green-800 border-green-200',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_ICONS = {
  'Created': Clock,
  'Ongoing': TrendingUp,
  'Completed': CheckCircle,
  'Cancelled': AlertTriangle,
};

export default function StaffWorkOrderCard({ 
  workOrder, 
  onStatusUpdate, 
  onQuickProgress,
  isUpdating = false,
  showQuickActions = true,
  compact = false 
}) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const getDueDateInfo = () => {
    const dueDate = new Date(workOrder.dueDate);
    const today = new Date();
    
    if (isPast(dueDate) && workOrder.status !== 'Completed') {
      return {
        text: `Overdue by ${formatDistanceToNow(dueDate)}`,
        color: 'text-red-600',
        urgent: true
      };
    } else if (isToday(dueDate)) {
      return {
        text: 'Due today',
        color: 'text-orange-600',
        urgent: true
      };
    } else if (isTomorrow(dueDate)) {
      return {
        text: 'Due tomorrow',
        color: 'text-yellow-600',
        urgent: false
      };
    } else {
      return {
        text: `Due ${format(dueDate, 'MMM dd')}`,
        color: 'text-gray-600',
        urgent: false
      };
    }
  };

  const dueDateInfo = getDueDateInfo();
  const StatusIcon = STATUS_ICONS[workOrder.status];
  const latestNote = workOrder.notes?.[workOrder.notes.length - 1];
  const hasFiles = workOrder.media && workOrder.media.length > 0;

  const getProgressPercentage = () => {
    if (workOrder.status === 'Completed') return 100;
    if (workOrder.status === 'Ongoing') return 50;
    if (workOrder.status === 'Created') return 0;
    return 0;
  };

  const progressPercentage = getProgressPercentage();

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {workOrder.workOrderNumber}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[workOrder.status]}`}>
                <StatusIcon size={12} className="mr-1" />
                {workOrder.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 truncate">{workOrder.clientName}</p>
            <p className={`text-xs ${dueDateInfo.color}`}>{dueDateInfo.text}</p>
          </div>
          <div className="flex items-center space-x-1">
            <Link
              href={`/work-orders/${workOrder._id}`}
              className="p-1 text-blue-600 hover:text-blue-800"
            >
              <Eye size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {workOrder.workOrderNumber}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[workOrder.status]}`}>
                <StatusIcon size={12} className="mr-1" />
                {workOrder.status}
              </span>
              {dueDateInfo.urgent && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                  <AlertTriangle size={12} className="mr-1" />
                  Urgent
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User size={14} />
                <span>{workOrder.clientName}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin size={14} />
                <span className="truncate">{workOrder.address}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>Scheduled: {format(new Date(workOrder.scheduleDate), 'MMM dd')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasFiles && (
              <div className="p-1 bg-blue-100 rounded">
                <Camera size={14} className="text-blue-600" />
              </div>
            )}
            {workOrder.nte > 0 && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <DollarSign size={12} />
                <span>${workOrder.nte.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage === 100 ? 'bg-green-500' :
                progressPercentage > 0 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Work Details */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start space-x-2">
          <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Work Type: {workOrder.workType}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{workOrder.details}</p>
          </div>
        </div>
      </div>

      {/* Latest Activity */}
      {latestNote && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start space-x-2">
            <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900">Latest Update</h4>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(latestNote.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{latestNote.message}</p>
              {latestNote.type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 mt-1">
                  {latestNote.type}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {workOrder.status === 'Created' && (
                <button
                  onClick={() => onStatusUpdate?.(workOrder._id, 'Ongoing')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  <Play size={12} className="mr-1" />
                  Start Work
                </button>
              )}
              
              {workOrder.status === 'Ongoing' && (
                <button
                  onClick={() => onStatusUpdate?.(workOrder._id, 'Completed')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={12} className="mr-1" />
                  Complete
                </button>
              )}

              {workOrder.status !== 'Completed' && (
                <button
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Zap size={12} className="mr-1" />
                  Quick Update
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href={`/work-orders/${workOrder._id}/edit`}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Edit Work Order"
              >
                <Edit size={16} />
              </Link>
              <Link
                href={`/work-orders/${workOrder._id}`}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="View Details"
              >
                <Eye size={16} />
              </Link>
            </div>
          </div>

          {/* Quick Progress Add */}
          {showQuickAdd && onQuickProgress && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      onQuickProgress(workOrder._id, {
                        message: 'Work in progress - proceeding as planned',
                        type: 'progress',
                        priority: 'normal'
                      });
                      setShowQuickAdd(false);
                    }}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    Progress Update
                  </button>
                  <button
                    onClick={() => {
                      onQuickProgress(workOrder._id, {
                        message: 'Issue encountered - need assistance',
                        type: 'issue',
                        priority: 'high'
                      });
                      setShowQuickAdd(false);
                    }}
                    className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                  >
                    Report Issue
                  </button>
                  <button
                    onClick={() => {
                      onQuickProgress(workOrder._id, {
                        message: 'Key milestone reached',
                        type: 'milestone',
                        priority: 'normal'
                      });
                      setShowQuickAdd(false);
                    }}
                    className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200"
                  >
                    Milestone
                  </button>
                  <button
                    onClick={() => setShowQuickAdd(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}