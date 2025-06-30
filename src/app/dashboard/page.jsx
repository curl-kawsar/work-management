"use client";
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';


export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    // Redirect based on role
    if (session?.user) {
      // Redirect based on role
      if (session.user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (session.user.role === 'staff') {
        router.push('/dashboard/staff');
      }
      // Client users stay on this page
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

} 