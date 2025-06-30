import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin can fetch all staff
    if (session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    await connectDB();
    
    // Get staff users
    const users = await User.find({ role: 'staff' })
      .select('name email')
      .sort({ name: 1 });
      
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error getting staff users:', error);
    return NextResponse.json(
      { message: 'Error getting staff users' },
      { status: 500 }
    );
  }
} 