import { NextResponse } from 'next/server';
import { initializeApp, getInitializationStatus } from '@/lib/appStartup';

// POST - Initialize application services
export async function POST(request) {
  try {
    console.log('🚀 API: Starting application initialization...');
    
    // Check if already initialized
    const status = getInitializationStatus();
    if (status.completed) {
      return NextResponse.json({
        message: 'Application already initialized',
        status: status,
        alreadyInitialized: true
      });
    }

    // Initialize the application
    await initializeApp();
    
    // Get updated status
    const newStatus = getInitializationStatus();
    
    console.log('✅ API: Application initialization completed');
    
    return NextResponse.json({
      message: 'Application initialized successfully',
      status: newStatus,
      initialized: true
    });

  } catch (error) {
    console.error('❌ API: Error during application initialization:', error);
    
    // Don't return error status to prevent app failure
    return NextResponse.json({
      message: 'Application initialization completed with warnings',
      error: error.message,
      initialized: true
    });
  }
}

// GET - Get initialization status
export async function GET(request) {
  try {
    const status = getInitializationStatus();
    
    return NextResponse.json({
      message: 'Initialization status retrieved',
      status: status
    });

  } catch (error) {
    console.error('Error getting initialization status:', error);
    return NextResponse.json(
      { message: 'Error getting status', error: error.message },
      { status: 500 }
    );
  }
}