import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import path from 'path';
import fs from 'fs';
import { stat } from 'fs/promises';

// GET - Get detailed file information
export async function GET(request) {
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

    const stats = await stat(fullPath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName).toLowerCase();

    // Determine file type category
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const videoTypes = ['.mp4', '.mov', '.avi', '.mkv', '.wmv'];
    const documentTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];

    let fileCategory = 'other';
    if (imageTypes.includes(fileExt)) fileCategory = 'image';
    else if (videoTypes.includes(fileExt)) fileCategory = 'video';
    else if (documentTypes.includes(fileExt)) fileCategory = 'document';

    // Format file size
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const fileInfo = {
      name: fileName,
      path: filePath,
      fullPath: fullPath,
      extension: fileExt,
      category: fileCategory,
      size: stats.size,
      formattedSize: formatFileSize(stats.size),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime,
      isReadOnly: !stats.mode & 0o200,
      permissions: '0' + (stats.mode & parseInt('777', 8)).toString(8),
      workOrderNumber: filePath.split('/')[2], // Extract work order number from path
    };

    return NextResponse.json({ file: fileInfo });

  } catch (error) {
    console.error('Error getting file info:', error);
    return NextResponse.json(
      { message: 'Error getting file information' },
      { status: 500 }
    );
  }
}