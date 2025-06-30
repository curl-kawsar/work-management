"use client";
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  const { data: session, status } = useSession();

  // If the user is not authenticated, redirect to login
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar role={session?.user?.role || 'staff'} />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 