"use client";
import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Clock, 
  Search, 
  Activity,
  Camera,
  MessageSquare,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function StaffQuickActions({ workOrders = [], onAction }) {
  const [activeAction, setActiveAction] = useState(null);

  const todayCount = workOrders.filter(wo => {
    const scheduleDate = new Date(wo.scheduleDate);
    return new Date().toDateString() === scheduleDate.toDateString();
  }).length;

  const ongoingCount = workOrders.filter(wo => wo.status === 'Ongoing').length;
  const overdueCount = workOrders.filter(wo => {
    const dueDate = new Date(wo.dueDate);
    return dueDate < new Date() && wo.status !== 'Completed';
  }).length;

  const quickActions = [
    {
      id: 'create-work-order',
      title: 'New Work Order',
      description: 'Create a new work order',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      href: '/work-orders/create',
    },
    {
      id: 'create-invoice',
      title: 'New Invoice',
      description: 'Generate an invoice',
      icon: FileText,
      color: 'bg-green-600 hover:bg-green-700',
      href: '/invoices/create',
    },
    {
      id: 'today-schedule',
      title: `Today's Work`,
      description: `${todayCount} work orders scheduled`,
      icon: Calendar,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => onAction?.('filter-today'),
      badge: todayCount > 0 ? todayCount : null,
    },
    {
      id: 'ongoing-work',
      title: 'Ongoing Work',
      description: `${ongoingCount} work orders in progress`,
      icon: Clock,
      color: 'bg-yellow-600 hover:bg-yellow-700',
      action: () => onAction?.('filter-ongoing'),
      badge: ongoingCount > 0 ? ongoingCount : null,
    },
    {
      id: 'urgent-work',
      title: 'Urgent Items',
      description: `${overdueCount} overdue work orders`,
      icon: Zap,
      color: overdueCount > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400',
      action: () => onAction?.('filter-overdue'),
      badge: overdueCount > 0 ? overdueCount : null,
      urgent: overdueCount > 0,
    },
    {
      id: 'activity-logs',
      title: 'Activity Logs',
      description: 'View recent activities',
      icon: Activity,
      color: 'bg-purple-600 hover:bg-purple-700',
      href: '/activity-logs',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="text-sm text-gray-500">
          {workOrders.length} total work orders
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.id;
          
          const ActionComponent = action.href ? Link : 'button';
          const actionProps = action.href 
            ? { href: action.href }
            : { 
                onClick: () => {
                  setActiveAction(action.id);
                  action.action?.();
                  setTimeout(() => setActiveAction(null), 200);
                },
                type: 'button'
              };

          return (
            <ActionComponent
              key={action.id}
              {...actionProps}
              className={`
                relative flex flex-col items-center p-4 rounded-lg text-white transition-all duration-200 transform
                ${action.color}
                ${isActive ? 'scale-95' : 'hover:scale-105'}
                ${action.urgent ? 'ring-2 ring-red-300 animate-pulse' : ''}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              {/* Badge */}
              {action.badge && (
                <div className="absolute -top-2 -right-2 bg-white text-gray-900 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                  {action.badge > 99 ? '99+' : action.badge}
                </div>
              )}

              {/* Icon */}
              <div className="mb-2">
                <Icon size={24} />
              </div>

              {/* Title */}
              <h3 className="text-sm font-medium text-center leading-tight mb-1">
                {action.title}
              </h3>

              {/* Description */}
              <p className="text-xs opacity-90 text-center leading-tight">
                {action.description}
              </p>

              {/* Urgent indicator */}
              {action.urgent && (
                <div className="absolute top-1 left-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </ActionComponent>
          );
        })}
      </div>

      {/* Additional Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {workOrders.filter(wo => wo.status === 'Completed').length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {ongoingCount}
            </div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {overdueCount}
            </div>
            <div className="text-xs text-gray-600">Overdue</div>
          </div>
        </div>
      </div>
    </div>
  );
}