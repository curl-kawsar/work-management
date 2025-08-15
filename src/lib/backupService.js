/**
 * ⚠️  SERVER-SIDE ONLY MODULE ⚠️
 * This module uses Node.js built-in modules (fs, path) and should NEVER be imported in client-side code.
 * Use API routes to access this functionality from the client.
 */

import connectDB from './mongodb';
import User from '@/models/User';
import WorkOrder from '@/models/WorkOrder';
import Invoice from '@/models/Invoice';
import ActivityLog from '@/models/ActivityLog';
import path from 'path';
import fs from 'fs/promises';

/**
 * Database Backup Service
 * Exports all database collections to CSV format
 */

// Helper function to convert object to CSV row
const objectToCSVRow = (obj, headers) => {
  return headers.map(header => {
    let value = obj[header];
    
    // Handle nested objects and arrays
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        value = value.map(item => 
          typeof item === 'object' ? JSON.stringify(item) : item
        ).join('; ');
      } else {
        value = JSON.stringify(value);
      }
    }
    
    // Handle null/undefined values
    if (value === null || value === undefined) {
      value = '';
    }
    
    // Escape quotes and wrap in quotes if contains comma or quote
    value = String(value);
    if (value.includes('"')) {
      value = value.replace(/"/g, '""');
    }
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      value = `"${value}"`;
    }
    
    return value;
  }).join(',');
};

// Helper function to get all unique headers from a collection
const getAllHeaders = (documents) => {
  const headerSet = new Set();
  
  documents.forEach(doc => {
    const obj = doc.toObject ? doc.toObject() : doc;
    Object.keys(obj).forEach(key => {
      headerSet.add(key);
    });
  });
  
  return Array.from(headerSet).sort();
};

// Export Users collection to CSV
const exportUsersToCSV = async () => {
  try {
    const users = await User.find({}).lean();
    if (users.length === 0) return 'No users data available\n';
    
    const headers = getAllHeaders(users);
    const csvHeader = headers.join(',');
    const csvRows = users.map(user => objectToCSVRow(user, headers));
    
    return [csvHeader, ...csvRows].join('\n');
  } catch (error) {
    console.error('Error exporting users:', error);
    return `Error exporting users: ${error.message}\n`;
  }
};

// Export Work Orders collection to CSV
const exportWorkOrdersToCSV = async () => {
  try {
    const workOrders = await WorkOrder.find({})
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('assignedStaff', 'name email')
      .lean();
    
    if (workOrders.length === 0) return 'No work orders data available\n';
    
    const headers = getAllHeaders(workOrders);
    const csvHeader = headers.join(',');
    const csvRows = workOrders.map(wo => objectToCSVRow(wo, headers));
    
    return [csvHeader, ...csvRows].join('\n');
  } catch (error) {
    console.error('Error exporting work orders:', error);
    return `Error exporting work orders: ${error.message}\n`;
  }
};

// Export Invoices collection to CSV
const exportInvoicesToCSV = async () => {
  try {
    const invoices = await Invoice.find({})
      .populate('workOrder')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();
    
    if (invoices.length === 0) return 'No invoices data available\n';
    
    const headers = getAllHeaders(invoices);
    const csvHeader = headers.join(',');
    const csvRows = invoices.map(invoice => objectToCSVRow(invoice, headers));
    
    return [csvHeader, ...csvRows].join('\n');
  } catch (error) {
    console.error('Error exporting invoices:', error);
    return `Error exporting invoices: ${error.message}\n`;
  }
};

// Export Activity Logs collection to CSV
const exportActivityLogsToCSV = async () => {
  try {
    const activityLogs = await ActivityLog.find({})
      .populate('userId', 'name email')
      .lean();
    
    if (activityLogs.length === 0) return 'No activity logs data available\n';
    
    const headers = getAllHeaders(activityLogs);
    const csvHeader = headers.join(',');
    const csvRows = activityLogs.map(log => objectToCSVRow(log, headers));
    
    return [csvHeader, ...csvRows].join('\n');
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    return `Error exporting activity logs: ${error.message}\n`;
  }
};

// Create backup directory if it doesn't exist
const ensureBackupDirectory = async () => {
  const backupDir = path.join(process.cwd(), 'backups');
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
  }
  return backupDir;
};

// Main backup function
export const createDatabaseBackup = async () => {
  try {
    console.log('Starting database backup...');
    await connectDB();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = await ensureBackupDirectory();
    
    // Create individual CSV files for each collection
    const backupData = {
      users: await exportUsersToCSV(),
      workOrders: await exportWorkOrdersToCSV(),
      invoices: await exportInvoicesToCSV(),
      activityLogs: await exportActivityLogsToCSV()
    };
    
    // Save individual CSV files
    const filePaths = [];
    for (const [collection, csvData] of Object.entries(backupData)) {
      const fileName = `${collection}_${timestamp}.csv`;
      const filePath = path.join(backupDir, fileName);
      await fs.writeFile(filePath, csvData, 'utf8');
      filePaths.push({
        name: fileName,
        path: filePath,
        collection: collection
      });
    }
    
    // Create a summary file
    const summaryFileName = `backup_summary_${timestamp}.txt`;
    const summaryPath = path.join(backupDir, summaryFileName);
    const summaryContent = `
Database Backup Summary
======================
Backup Date: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (Bangladesh Time)
Timestamp: ${timestamp}

Collections Backed Up:
- Users: ${backupData.users.split('\n').length - 1} records
- Work Orders: ${backupData.workOrders.split('\n').length - 1} records  
- Invoices: ${backupData.invoices.split('\n').length - 1} records
- Activity Logs: ${backupData.activityLogs.split('\n').length - 1} records

Files Created:
${filePaths.map(file => `- ${file.name} (${file.collection})`).join('\n')}

Total Files: ${filePaths.length + 1}
Backup Directory: ${backupDir}
`;
    
    await fs.writeFile(summaryPath, summaryContent, 'utf8');
    filePaths.push({
      name: summaryFileName,
      path: summaryPath,
      collection: 'summary'
    });
    
    console.log('Database backup completed successfully');
    
    return {
      success: true,
      timestamp,
      backupDir,
      files: filePaths,
      summary: summaryContent
    };
    
  } catch (error) {
    console.error('Database backup failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Get backup statistics
export const getBackupStats = async () => {
  try {
    await connectDB();
    
    const stats = {
      users: await User.countDocuments(),
      workOrders: await WorkOrder.countDocuments(),
      invoices: await Invoice.countDocuments(),
      activityLogs: await ActivityLog.countDocuments()
    };
    
    stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    return stats;
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return { error: error.message };
  }
};

// Clean old backup files (keep last 30 days)
export const cleanOldBackups = async () => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const files = await fs.readdir(backupDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned ${deletedCount} old backup files`);
    return { deletedCount };
  } catch (error) {
    console.error('Error cleaning old backups:', error);
    return { error: error.message };
  }
};