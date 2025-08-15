import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import connectDB from '@/lib/mongodb';
import WorkOrder from '@/models/WorkOrder';
import User from '@/models/User';
import { logActivity } from '@/lib/activityLogger';

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
      // Ensure proper ObjectId comparison
      query.assignedStaff = new mongoose.Types.ObjectId(session.user.id);
    }
    
    // Get work orders
    const workOrders = await WorkOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('assignedStaff', 'name email');
    
    // Debug: Log work orders for staff users
    if (session.user.role === 'staff') {
      console.log('Staff work orders result:', {
        count: workOrders.length,
        userId: session.user.id,
        workOrderIds: workOrders.map(wo => wo._id),
        assignments: workOrders.map(wo => ({
          id: wo._id,
          assignedStaff: wo.assignedStaff?._id || wo.assignedStaff
        }))
      });
    }
      
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
    
    // Check content type and parse accordingly
    const contentType = request.headers.get('content-type');
    let data;
    let files = [];
    
    if (contentType && contentType.includes('application/json')) {
      // Handle JSON request (new file management approach)
      data = await request.json();
    } else {
      // Handle FormData request (legacy approach with files)
      const formData = await request.formData();
      
      // Extract files
      files = formData.getAll('files');
      
      // Extract other form fields
      data = {
        workOrderNumber: formData.get('workOrderNumber'),
        details: formData.get('details'),
        address: formData.get('address'),
        workType: formData.get('workType'),
        scheduleDate: formData.get('scheduleDate'),
        dueDate: formData.get('dueDate'),
        clientName: formData.get('clientName'),
        companyName: formData.get('companyName'),
        nte: formData.get('nte'),
        assignedStaff: formData.get('assignedStaff'),
        notes: formData.get('notes'),
        status: formData.get('status'),
        createdBy: formData.get('createdBy'),
      };
    }
    
    // Extract fields from data object
    const {
      workOrderNumber,
      details,
      address,
      workType,
      scheduleDate,
      dueDate,
      clientName,
      companyName,
      nte,
      notes,
      status,
      createdBy
    } = data;
    
    let { assignedStaff } = data;
    
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
    
    // Handle file uploads if any (for FormData requests)
    let mediaFiles = [];
    if (files && files.length > 0 && files[0].size > 0) {
      mediaFiles = await saveFiles(files, workOrderNumber);
    }
    
    // Create initial note with timestamp
    const initialNote = {
      message: notes || 'Work order created',
      type: 'created',
      priority: 'normal',
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
      createdBy: createdBy || session.user.id,
      updatedBy: session.user.id,
    });

    // Log the creation activity
    await logActivity({
      userId: session.user.id,
      action: 'create',
      entityType: 'WorkOrder',
      entityId: workOrder._id,
      description: `Created work order ${workOrderNumber} for ${clientName}`,
      newValues: {
        workOrderNumber,
        clientName,
        companyName,
        workType,
        status,
        assignedStaff: assignedStaff || null,
      },
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