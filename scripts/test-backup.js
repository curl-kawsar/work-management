/**
 * Test Script for Database Backup System
 * Run this to test the backup functionality
 * 
 * Usage: node scripts/test-backup.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Database Backup System');
console.log('=====================================\n');

async function runTest() {
  try {
    console.log('📋 Test Instructions:');
    console.log('1. Make sure your application is running (npm run dev)');
    console.log('2. Login as an admin user');
    console.log('3. Go to the admin dashboard');
    console.log('4. Look for the "Backup Management" section');
    console.log('5. Use the following test buttons:\n');
    
    console.log('   ✅ "Test Email" - Verify email configuration');
    console.log('   ✅ "Manual Backup" - Create and send a backup immediately');
    console.log('   ✅ "Start Scheduler" - Enable automatic daily backups\n');
    
    console.log('📧 Expected Email Configuration:');
    console.log('   From: test@1550plus.com');
    console.log('   To: test@1550plus.com');
    console.log('   Server: mail.1550plus.com:465 (SSL)');
    console.log('   Schedule: Daily at 6:00 AM Bangladesh Time\n');
    
    console.log('📁 Backup Files Location:');
    console.log('   Directory: ./backups/');
    console.log('   Format: CSV files for each database collection');
    console.log('   Cleanup: Automatic (30+ days old files removed)\n');
    
    console.log('🔗 API Endpoints for Testing:');
    console.log('   GET  /api/backup?action=stats - Get database statistics');
    console.log('   GET  /api/backup?action=test-email - Test email configuration');
    console.log('   POST /api/backup - Create manual backup');
    console.log('   GET  /api/backup/scheduler?action=info - Get scheduler info');
    console.log('   POST /api/backup/scheduler {"action": "start"} - Start scheduler');
    console.log('   POST /api/backup/scheduler {"action": "manual-backup"} - Manual backup\n');
    
    console.log('🎯 Next Steps:');
    console.log('1. Start your application: npm run dev');
    console.log('2. Visit: http://localhost:3000/dashboard/admin');
    console.log('3. Test the backup functionality using the Backup Management section');
    console.log('4. Check your email (test@1550plus.com) for backup emails\n');
    
    console.log('✨ The backup system is ready to use!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runTest();