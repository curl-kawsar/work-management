import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';

// GET - Fetch unique company names
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get unique company names from work orders
    const companies = await WorkOrder.distinct('companyName');
    
    // Filter out empty/null values and sort
    const validCompanies = companies
      .filter(company => company && company.trim() !== '')
      .sort();

    return NextResponse.json({ 
      companies: validCompanies,
      total: validCompanies.length
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { message: 'Error fetching companies' },
      { status: 500 }
    );
  }
}