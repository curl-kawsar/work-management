import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import path from 'path';
import fs from 'fs';
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { logActivity } from '@/lib/activityLogger';

// Helper function to get file info
async function getFileInfo(filePath, relativePath) {
  try {
    const stats = await stat(filePath);
    return {
      name: path.basename(filePath),
      path: relativePath,
      size: stats.size,
      type: path.extname(filePath).toLowerCase(),
      lastModified: stats.mtime,
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    return null;
  }
}

// GET - List files and directories
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const directory = searchParams.get('directory') || '';
    const workOrderNumber = searchParams.get('workOrderNumber');
    
    let targetDir;
    if (workOrderNumber) {
      // Get files for specific work order
      targetDir = path.join(process.cwd(), 'public', 'media', workOrderNumber);
    } else if (directory) {
      // Get files from specific directory
      targetDir = path.join(process.cwd(), 'public', 'media', directory);
    } else {
      // List all work order directories
      targetDir = path.join(process.cwd(), 'public', 'media');
    }

    // Check if directory exists
    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({ files: [], directories: [] });
    }

    const items = await readdir(targetDir);
    const files = [];
    const directories = [];

    for (const item of items) {
      const itemPath = path.join(targetDir, item);
      const relativePath = workOrderNumber 
        ? `/media/${workOrderNumber}/${item}`
        : directory
          ? `/media/${directory}/${item}`
          : `/media/${item}`;
      
      const fileInfo = await getFileInfo(itemPath, relativePath);
      if (fileInfo) {
        if (fileInfo.isDirectory) {
          directories.push(fileInfo);
        } else {
          files.push(fileInfo);
        }
      }
    }

    return NextResponse.json({ 
      files: files.sort((a, b) => b.lastModified - a.lastModified),
      directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
      currentPath: directory || '',
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { message: 'Error listing files' },
      { status: 500 }
    );
  }
}

// POST - Upload files
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    const workOrderNumber = formData.get('workOrderNumber');
    const directory = formData.get('directory') || workOrderNumber;

    if (!directory) {
      return NextResponse.json(
        { message: 'Directory or work order number is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'media', directory);
    
    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        if (file.size === 0) continue; // Skip empty files

        // Validate file type (basic security)
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.pdf', '.doc', '.docx'];
        const fileExt = path.extname(file.name).toLowerCase();
        
        if (!allowedTypes.includes(fileExt)) {
          errors.push(`File ${file.name} has unsupported type`);
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`File ${file.name} is too large (max 10MB)`);
          continue;
        }

        // Generate safe filename with timestamp to avoid conflicts
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${safeName}`;
        const filePath = path.join(uploadDir, filename);

        // Save the file
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const relativePath = `/media/${directory}/${filename}`;
        const fileInfo = {
          name: filename,
          originalName: file.name,
          path: relativePath,
          size: file.size,
          type: fileExt,
          uploadedAt: new Date(),
        };

        uploadedFiles.push(fileInfo);

        // Log the file upload activity
        await logActivity({
          userId: session.user.id,
          action: 'create',
          entityType: 'File',
          entityId: directory,
          description: `Uploaded file ${file.name} to ${directory}`,
          newValues: fileInfo,
        });

      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errors.push(`Failed to upload ${file.name}`);
      }
    }

    return NextResponse.json({
      message: `Uploaded ${uploadedFiles.length} files successfully`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { message: 'Error uploading files' },
      { status: 500 }
    );
  }
}

// DELETE - Delete files
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { message: 'File path is required' },
        { status: 400 }
      );
    }

    // Security check - ensure file is in media directory
    if (!filePath.startsWith('/media/')) {
      return NextResponse.json(
        { message: 'Invalid file path' },
        { status: 400 }
      );
    }

    const fullPath = path.join(process.cwd(), 'public', filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { message: 'File not found' },
        { status: 404 }
      );
    }

    // Delete the file
    await unlink(fullPath);

    // Log the file deletion activity
    await logActivity({
      userId: session.user.id,
      action: 'delete',
      entityType: 'File',
      entityId: path.dirname(filePath),
      description: `Deleted file ${path.basename(filePath)}`,
      oldValues: { path: filePath },
    });

    return NextResponse.json({
      message: 'File deleted successfully',
      path: filePath,
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { message: 'Error deleting file' },
      { status: 500 }
    );
  }
}