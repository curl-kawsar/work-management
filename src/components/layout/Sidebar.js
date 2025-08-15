"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Circle,
  Grid,
  LineChart,
  ChevronRight,
  Activity
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Sidebar({ role, userName = "User" }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  
  // Determine sidebar items based on role
  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      allowedRoles: ['admin', 'staff'],
    },
    {
      name: 'Work Orders',
      href: '/work-orders',
      icon: <Briefcase size={20} />,
      allowedRoles: ['admin', 'staff'],
      badge: { count: 3, color: 'blue' }
    },
    {
      name: 'Invoices',
      href: '/invoices',
      icon: <FileText size={20} />,
      allowedRoles: ['admin', 'staff'],
      badge: { count: 2, color: 'green' }
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: <BarChart3 size={20} />,
      allowedRoles: ['admin'],
    },
    {
      name: 'User Management',
      href: '/users',
      icon: <Users size={20} />,
      allowedRoles: ['admin'],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings size={20} />,
      allowedRoles: ['admin', 'staff'],
    },
  ];
  
  // Filter items based on user role
  const filteredItems = sidebarItems.filter(item => 
    item.allowedRoles.includes(role)
  );

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };
  
  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
            WM
          </div>
          {!collapsed && (
            <h1 className="text-lg font-bold text-gray-800">Work Management</h1>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
        >
          <ChevronRight size={18} className={`transform transition-transform ${collapsed ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </div>
      
      {/* User */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation with integrated category filters */}
      <div className="flex-1 py-2">
        <nav>
          <ul className="space-y-1 px-3">
            {/* All category */}
            {!collapsed && (
              <li className="mb-1">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-500'}>
                    <Grid size={20} />
                  </span>
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
              </li>
            )}
            
            {/* Main category */}
            {!collapsed && (
              <li className="mt-4 mb-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main
                </h3>
              </li>
            )}
            
            {/* Work Orders */}
            <li>
              <Link
                href="/work-orders"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  pathname === '/work-orders' || pathname.startsWith('/work-orders/') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className={pathname.startsWith('/work-orders') ? 'text-blue-600' : 'text-gray-500'}>
                  <Briefcase size={20} />
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium">Work Orders</span>
                )}
                {!collapsed && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                    3
                  </span>
                )}
                {collapsed && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </Link>
            </li>
            
            {/* Invoices */}
            <li>
              <Link
                href="/invoices"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  pathname === '/invoices' || pathname.startsWith('/invoices/') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className={pathname.startsWith('/invoices') ? 'text-blue-600' : 'text-gray-500'}>
                  <FileText size={20} />
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium">Invoices</span>
                )}
                {!collapsed && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                    2
                  </span>
                )}
                {collapsed && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500"></span>
                )}
              </Link>
            </li>
            
            {/* Management category */}
            {!collapsed && role === 'admin' && (
              <li className="mt-4 mb-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Management
                </h3>
              </li>
            )}
            
            {/* Reports */}
            {role === 'admin' && (
              <li>
                <Link
                  href="/reports"
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    pathname === '/reports' || pathname.startsWith('/reports/') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <span className={pathname.startsWith('/reports') ? 'text-blue-600' : 'text-gray-500'}>
                    <LineChart size={20} />
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium">Reports</span>
                  )}
                </Link>
              </li>
            )}
            
            {/* User Management */}
            {role === 'admin' && (
              <li>
                <Link
                  href="/users"
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    pathname === '/users' || pathname.startsWith('/users/') 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <span className={pathname.startsWith('/users') ? 'text-blue-600' : 'text-gray-500'}>
                    <Users size={20} />
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium">User Management</span>
                  )}
                </Link>
              </li>
            )}

            {/* Activity Logs (Admin Only) */}
            {role === 'admin' && (
              <li>
                <Link
                  href="/activity-logs"
                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    pathname === '/activity-logs' || pathname.startsWith('/activity-logs/')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <span className={pathname.startsWith('/activity-logs') ? 'text-blue-600' : 'text-gray-500'}>
                    <Activity size={20} />
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium">Activity Logs</span>
                  )}
                </Link>
              </li>
            )}
            
            {/* Settings category */}
            {!collapsed && (
              <li className="mt-4 mb-2">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Settings
                </h3>
              </li>
            )}
            
            {/* Settings */}
            <li>
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                  pathname === '/settings' || pathname.startsWith('/settings/') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className={pathname.startsWith('/settings') ? 'text-blue-600' : 'text-gray-500'}>
                  <Settings size={20} />
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium">Settings</span>
                )}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-200">
        <div className={`p-4 flex ${collapsed ? 'flex-col items-center space-y-4' : 'items-center justify-between'}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500" title="Notifications">
                  <Bell size={18} />
                </button>
                <Link href="/help" className="p-2 rounded-md hover:bg-gray-100 text-gray-500" title="Help">
                  <HelpCircle size={18} />
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Circle size={8} className="text-green-500 fill-green-500" />
                <span className="text-xs text-gray-600">Online</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <button className="p-2 rounded-md hover:bg-gray-100 text-gray-500" title="Notifications">
                <Bell size={18} />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 