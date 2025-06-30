"use client";
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function CreateWorkOrderButton() {
  const { data: session } = useSession();
  
  // Only show button for staff and admin users
  if (!session || !['admin', 'staff'].includes(session.user.role)) {
    return null;
  }
  
  return (
    <Link
      href="/work-orders/create"
      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Plus size={18} className="mr-2" />
      Create Work Order
    </Link>
  );
} 