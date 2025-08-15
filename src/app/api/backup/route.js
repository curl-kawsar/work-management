import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createDatabaseBackup, getBackupStats, cleanOldBackups } from '@/lib/backupService';
import { sendBackupEmail, testBackupEmail } from '@/lib/emailService-simple';

// GET - Get backup statistics or list recent backups
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await getBackupStats();
        return NextResponse.json({ stats });
      
      case 'test-email':
        const testResult = await testBackupEmail();
        return NextResponse.json(testResult);
      
      default:
        const stats2 = await getBackupStats();
        return NextResponse.json({ 
          message: 'Backup API is operational',
          stats: stats2,
          actions: ['stats', 'test-email']
        });
    }
  } catch (error) {
    console.error('Error in backup GET:', error);
    return NextResponse.json(
      { message: 'Error processing backup request', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create database backup and optionally send email
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sendEmail = true, cleanOld = true } = body;

    console.log('Starting database backup process...');
    
    // Create the backup
    const backupResult = await createDatabaseBackup();
    
    if (!backupResult.success) {
      return NextResponse.json(
        { message: 'Backup failed', error: backupResult.error },
        { status: 500 }
      );
    }

    // Clean old backups if requested
    if (cleanOld) {
      await cleanOldBackups();
    }

    // Send email if requested
    let emailResult = null;
    if (sendEmail) {
      emailResult = await sendBackupEmail(backupResult);
    }

    console.log('Backup process completed successfully');

    return NextResponse.json({
      message: 'Backup completed successfully',
      backup: {
        timestamp: backupResult.timestamp,
        filesCreated: backupResult.files?.length || 0,
        backupDir: backupResult.backupDir
      },
      email: emailResult,
      summary: backupResult.summary
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { message: 'Error creating backup', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Clean old backup files
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const cleanResult = await cleanOldBackups();
    
    return NextResponse.json({
      message: 'Old backups cleaned successfully',
      deletedCount: cleanResult.deletedCount || 0
    });

  } catch (error) {
    console.error('Error cleaning backups:', error);
    return NextResponse.json(
      { message: 'Error cleaning backups', error: error.message },
      { status: 500 }
    );
  }
}