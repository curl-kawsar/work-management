/**
 * ⚠️  SERVER-SIDE ONLY MODULE ⚠️
 * This module uses node-cron and should NEVER be imported in client-side code.
 * Use API routes to access this functionality from the client.
 */

import cron from 'node-cron';
import { createDatabaseBackup, cleanOldBackups } from './backupService';
import { sendBackupEmail } from './emailService-simple';

let scheduledTask = null;
let isSchedulerRunning = false;

/**
 * Automated Database Backup Scheduler
 * Runs daily at 6:00 AM Bangladesh Time (UTC+6)
 * 
 * Cron pattern: '0 6 * * *' (minute=0, hour=6, every day)
 * Timezone: 'Asia/Dhaka' for Bangladesh Standard Time
 */

// Function to perform the backup
const performScheduledBackup = async () => {
  console.log('🔄 Starting scheduled database backup...');
  console.log('⏰ Time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }), '(Bangladesh Time)');
  
  try {
    // Create database backup
    const backupResult = await createDatabaseBackup();
    
    if (!backupResult.success) {
      console.error('❌ Scheduled backup failed:', backupResult.error);
      
      // Send failure notification
      await sendBackupEmail(backupResult);
      return;
    }

    console.log('✅ Database backup completed successfully');
    console.log('📊 Files created:', backupResult.files?.length || 0);

    // Clean old backups (keep last 30 days)
    console.log('🧹 Cleaning old backup files...');
    const cleanResult = await cleanOldBackups();
    console.log('🗑️ Deleted old files:', cleanResult.deletedCount || 0);

    // Send backup via email
    console.log('📧 Sending backup via email...');
    const emailResult = await sendBackupEmail(backupResult);
    
    if (emailResult.success) {
      console.log('✅ Backup email sent successfully');
    } else {
      console.error('❌ Failed to send backup email:', emailResult.error);
    }

    console.log('🎉 Scheduled backup process completed successfully');

  } catch (error) {
    console.error('💥 Error in scheduled backup:', error);
    
    // Try to send error notification
    try {
      await sendBackupEmail({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (emailError) {
      console.error('Failed to send error notification email:', emailError);
    }
  }
};

// Start the scheduler
export const startBackupScheduler = () => {
  if (isSchedulerRunning) {
    console.log('⚠️ Backup scheduler is already running');
    return;
  }

  try {
    // Schedule for 6:00 AM Bangladesh Time every day
    scheduledTask = cron.schedule('0 6 * * *', performScheduledBackup, {
      timezone: 'Asia/Dhaka',
      scheduled: false // Don't start immediately
    });

    // Start the task
    scheduledTask.start();
    isSchedulerRunning = true;

    console.log('🚀 Backup scheduler started successfully');
    console.log('⏰ Scheduled to run daily at 6:00 AM Bangladesh Time');
    console.log('🌍 Timezone: Asia/Dhaka (UTC+6)');
    
    // Log next execution time
    const nextRun = getNextRunTime();
    console.log('📅 Next backup scheduled for:', nextRun);

  } catch (error) {
    console.error('❌ Failed to start backup scheduler:', error);
    isSchedulerRunning = false;
  }
};

// Stop the scheduler
export const stopBackupScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    isSchedulerRunning = false;
    console.log('🛑 Backup scheduler stopped');
  } else {
    console.log('⚠️ Backup scheduler is not running');
  }
};

// Get scheduler status
export const getSchedulerStatus = () => {
  return {
    isRunning: isSchedulerRunning,
    nextRun: isSchedulerRunning ? getNextRunTime() : null,
    schedule: '6:00 AM daily (Bangladesh Time)',
    timezone: 'Asia/Dhaka'
  };
};

// Get next run time
const getNextRunTime = () => {
  const now = new Date();
  const bangladeshNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  
  const nextRun = new Date(bangladeshNow);
  nextRun.setHours(6, 0, 0, 0); // Set to 6:00 AM
  
  // If it's already past 6:00 AM today, schedule for tomorrow
  if (bangladeshNow.getHours() >= 6) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun.toLocaleString('en-US', { 
    timeZone: 'Asia/Dhaka',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Manual backup trigger (for testing)
export const triggerManualBackup = async () => {
  console.log('🔧 Manual backup triggered');
  await performScheduledBackup();
};

// Restart scheduler
export const restartScheduler = () => {
  stopBackupScheduler();
  setTimeout(() => {
    startBackupScheduler();
  }, 1000);
};

// Validate scheduler configuration
export const validateSchedulerConfig = () => {
  try {
    // Test cron pattern
    const testTask = cron.schedule('0 6 * * *', () => {}, {
      timezone: 'Asia/Dhaka',
      scheduled: false
    });
    
    testTask.destroy();
    
    return {
      valid: true,
      message: 'Scheduler configuration is valid'
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

// Get scheduler info
export const getSchedulerInfo = () => {
  return {
    status: getSchedulerStatus(),
    configuration: {
      cronPattern: '0 6 * * *',
      timezone: 'Asia/Dhaka',
      description: 'Daily at 6:00 AM Bangladesh Time'
    },
    nextExecution: isSchedulerRunning ? getNextRunTime() : 'Scheduler not running',
    validation: validateSchedulerConfig()
  };
};