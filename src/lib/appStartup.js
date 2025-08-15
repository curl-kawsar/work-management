/**
 * ⚠️  SERVER-SIDE ONLY MODULE ⚠️
 * This module should NEVER be imported in client-side code.
 * Use API routes to access this functionality from the client.
 */

import { startBackupScheduler, getSchedulerStatus } from './backupScheduler';

let isStartupCompleted = false;

/**
 * Application Startup Handler
 * Initializes critical services when the application starts
 */

export const initializeApp = async () => {
  if (isStartupCompleted) {
    console.log('⚠️ App initialization already completed');
    return;
  }

  console.log('🚀 Initializing Work Management System...');

  try {
    // Initialize backup scheduler
    console.log('📅 Starting backup scheduler...');
    startBackupScheduler();
    
    const schedulerStatus = getSchedulerStatus();
    if (schedulerStatus.isRunning) {
      console.log('✅ Backup scheduler initialized successfully');
      console.log(`📅 Next backup: ${schedulerStatus.nextRun}`);
    } else {
      console.warn('⚠️ Backup scheduler failed to start');
    }

    // Mark startup as completed
    isStartupCompleted = true;
    console.log('🎉 Application initialization completed successfully');

  } catch (error) {
    console.error('❌ Error during application initialization:', error);
    // Don't throw error to prevent app from failing to start
  }
};

// Get initialization status
export const getInitializationStatus = () => {
  return {
    completed: isStartupCompleted,
    scheduler: getSchedulerStatus()
  };
};

// Reset initialization status (for development/testing)
export const resetInitialization = () => {
  isStartupCompleted = false;
  console.log('🔄 Initialization status reset');
};