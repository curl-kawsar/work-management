import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { 
  startBackupScheduler, 
  stopBackupScheduler, 
  getSchedulerStatus, 
  triggerManualBackup,
  restartScheduler,
  getSchedulerInfo
} from '@/lib/backupScheduler';

// GET - Get scheduler status and information
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = getSchedulerStatus();
        return NextResponse.json({ status });
      
      case 'info':
        const info = getSchedulerInfo();
        return NextResponse.json({ info });
      
      default:
        const defaultInfo = getSchedulerInfo();
        return NextResponse.json({
          message: 'Backup Scheduler API',
          ...defaultInfo
        });
    }
  } catch (error) {
    console.error('Error in scheduler GET:', error);
    return NextResponse.json(
      { message: 'Error getting scheduler information', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Start scheduler or trigger manual backup
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        startBackupScheduler();
        return NextResponse.json({
          message: 'Backup scheduler started',
          status: getSchedulerStatus()
        });
      
      case 'restart':
        restartScheduler();
        return NextResponse.json({
          message: 'Backup scheduler restarted',
          status: getSchedulerStatus()
        });
      
      case 'manual-backup':
        // Trigger manual backup in background
        triggerManualBackup().catch(error => {
          console.error('Manual backup failed:', error);
        });
        
        return NextResponse.json({
          message: 'Manual backup triggered',
          note: 'Backup is running in the background'
        });
      
      default:
        return NextResponse.json(
          { message: 'Invalid action. Use "start", "restart", or "manual-backup"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in scheduler POST:', error);
    return NextResponse.json(
      { message: 'Error managing scheduler', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Stop scheduler
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    stopBackupScheduler();
    
    return NextResponse.json({
      message: 'Backup scheduler stopped',
      status: getSchedulerStatus()
    });

  } catch (error) {
    console.error('Error stopping scheduler:', error);
    return NextResponse.json(
      { message: 'Error stopping scheduler', error: error.message },
      { status: 500 }
    );
  }
}