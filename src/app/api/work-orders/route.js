import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import path from 'path';
import fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';
import User from '@/models/User';

// Helper function to save uploaded files
async function saveFiles(files, workOrderNumber) {
  const uploadDir = path.join(process.cwd(), 'public', 'media', workOrderNumber);
  
  // Create directory if it doesn't exist
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
    throw new Error('Error creating upload directory');
  }
  
  // Save each file
  const savedPaths = [];
  for (const file of files) {
    try {
      // Create a buffer from the file data
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Generate a safe filename
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = path.join(uploadDir, filename);
      
      // Save the file
      await writeFile(filePath, buffer);
      
      // Save relative path for the database
      savedPaths.push(`/media/${workOrderNumber}/${filename}`);
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Error saving upload file');
    }
  }
  
  return savedPaths;
}

// GET - List all work orders
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    // For staff users, only show their assigned work orders
    let query = {};
    if (session.user.role === 'staff') {
      query.assignedStaff = session.user.id;
    }
    
    // Get work orders
    const workOrders = await WorkOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('assignedStaff', 'name email');
      
    return NextResponse.json({ workOrders });
  } catch (error) {
    console.error('Error getting work orders:', error);
    return NextResponse.json(
      { message: 'Error getting work orders' },
      { status: 500 }
    );
  }
}

// POST - Create new work order
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the form data
    const formData = await request.formData();
    
    // Extract files
    const files = formData.getAll('files');
    
    // Extract other form fields
    const workOrderNumber = formData.get('workOrderNumber');
    const details = formData.get('details');
    const address = formData.get('address');
    const workType = formData.get('workType');
    const scheduleDate = formData.get('scheduleDate');
    const dueDate = formData.get('dueDate');
    const clientName = formData.get('clientName');
    const companyName = formData.get('companyName');
    const nte = formData.get('nte');
    let assignedStaff = formData.get('assignedStaff');
    const notes = formData.get('notes');
    const status = formData.get('status');
    
    // Validate required fields
    if (!workOrderNumber || !details || !address || !workType ||
        !scheduleDate || !dueDate || !clientName || !companyName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check for existing work order with the same number
    const existingWorkOrder = await WorkOrder.findOne({ workOrderNumber });
    if (existingWorkOrder) {
      return NextResponse.json(
        { message: 'Work order number already exists' },
        { status: 409 }
      );
    }
    
    // If user is staff, assign themselves automatically
    if (session.user.role === 'staff') {
      assignedStaff = session.user.id;
    }
    
    // Handle file uploads if any
    let mediaFiles = [];
    if (files && files.length > 0 && files[0].size > 0) {
      mediaFiles = await saveFiles(files, workOrderNumber);
    }
    
    // Create initial note with timestamp
    const initialNote = {
      message: notes,
      timestamp: new Date(),
      user: session.user.id
    };
    
    // Create the work order
    const workOrder = await WorkOrder.create({
      workOrderNumber,
      details,
      address,
      workType,
      scheduleDate,
      dueDate,
      clientName,
      companyName,
      nte: nte || 0,
      assignedStaff: assignedStaff || null,
      media: mediaFiles,
      notes: [initialNote],
      status,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });
    
    return NextResponse.json(
      { message: 'Work order created successfully', workOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { message: 'Error creating work order' },
      { status: 500 }
    );
  }
} 