"use client";
import { useSession } from 'next-auth/react';
import { UserCircle2 } from 'lucide-react';

export default function Header({ title }) {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">
          {session?.user?.name}
        </span>
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <UserCircle2 size={20} />
        </div>
      </div>
    </header>
  );
} 