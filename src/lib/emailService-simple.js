/**
 * ⚠️  SERVER-SIDE ONLY MODULE ⚠️
 * Simplified Email Service with direct nodemailer usage
 */

// Direct import - let's see if this works better
const nodemailer = require('nodemailer');

// Generate verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send deletion confirmation email
export const sendDeletionConfirmationEmail = async (email, workOrderNumber, verificationCode) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.1550plus.com',
      port: 465,
      secure: true, // Use SSL for port 465
      auth: {
        user: 'test@1550plus.com',
        pass: 'u732b&^Ep4e]',
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
    
    const mailOptions = {
      from: 'test@1550plus.com',
      to: email,
      subject: `Confirm Work Order Deletion - ${workOrderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Work Order Deletion Confirmation</h2>
          <p>You have requested to delete the following work order:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Work Order Number:</strong> ${workOrderNumber}
          </div>
          
          <p>To confirm this deletion, please use the following verification code:</p>
          
          <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${verificationCode}</h3>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">Warning: This action cannot be undone!</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you did not request this deletion, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending deletion confirmation email:', error);
    return false;
  }
};

// Send general notification email
export const sendNotificationEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.1550plus.com',
      port: 465,
      secure: true, // Use SSL for port 465
      auth: {
        user: 'test@1550plus.com',
        pass: 'u732b&^Ep4e]',
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
    
    const mailOptions = {
      from: 'test@1550plus.com',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Work Management System</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px;">
            ${message}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Work Management System - Automated Email
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
};

// Send database backup via email
export const sendBackupEmail = async (backupResult) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.1550plus.com',
      port: 465,
      secure: true,
      auth: {
        user: 'test@1550plus.com',
        pass: 'u732b&^Ep4e]',
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
    
    const bangladeshTime = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Prepare attachments from backup files
    const attachments = backupResult.files?.map(file => ({
      filename: file.name,
      path: file.path,
      contentType: file.name.endsWith('.csv') ? 'text/csv' : 'text/plain'
    })) || [];
    
    const mailOptions = {
      from: 'test@1550plus.com',
      to: 'test@1550plus.com', // Send to same email for now, can be changed
      subject: `Database Backup - ${bangladeshTime.split(',')[0]} ${bangladeshTime.split(' ')[0]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">🗄️ Database Backup</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Work Management System</p>
            </div>
            
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px;">📊 Backup Summary</h2>
              <div style="color: #1e40af;">
                <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${bangladeshTime}</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${backupResult.success ? 'SUCCESS' : 'FAILED'}</span></p>
                <p style="margin: 8px 0;"><strong>Files Created:</strong> ${backupResult.files?.length || 0}</p>
              </div>
            </div>

            ${backupResult.success ? `
            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 16px;">📋 Backup Details</h3>
              <div style="color: #166534; font-family: 'Courier New', monospace; font-size: 14px; white-space: pre-line;">${backupResult.summary || 'No summary available'}</div>
            </div>

            <div style="background-color: #fefce8; border: 1px solid #eab308; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #a16207; margin: 0 0 15px 0; font-size: 16px;">📎 Attached Files</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                ${backupResult.files?.map(file => 
                  `<li style="margin: 5px 0;">${file.name} <span style="color: #78716c; font-size: 12px;">(${file.collection})</span></li>`
                ).join('') || '<li>No files attached</li>'}
              </ul>
            </div>
            ` : `
            <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">❌ Backup Failed</h3>
              <p style="color: #991b1b; margin: 0;">Error: ${backupResult.error || 'Unknown error occurred'}</p>
            </div>
            `}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                🤖 This is an automated backup email<br>
                Generated by Work Management System
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);
    console.log('Backup email sent successfully');
    return { success: true, message: 'Backup email sent successfully' };
  } catch (error) {
    console.error('Error sending backup email:', error);
    return { success: false, error: error.message };
  }
};

// Test backup email configuration with actual backup
export const testBackupEmail = async () => {
  try {
    console.log('Starting test email with backup functionality...');
    
    // First, create a test backup
    const { createDatabaseBackup } = require('./backupService');
    const backupResult = await createDatabaseBackup();
    
    const transporter = nodemailer.createTransport({
      host: 'mail.1550plus.com',
      port: 465,
      secure: true, // Use SSL for port 465
      auth: {
        user: 'test@1550plus.com',
        pass: 'u732b&^Ep4e]',
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });

    const bangladeshTime = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Prepare attachments if backup was successful
    const attachments = backupResult.success && backupResult.files ? backupResult.files.map(file => ({
      filename: file.name,
      path: file.path,
      contentType: file.name.endsWith('.csv') ? 'text/csv' : 'text/plain'
    })) : [];
    
    const mailOptions = {
      from: 'test@1550plus.com',
      to: 'test@1550plus.com',
      subject: `🧪 Test Email with Database Backup - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0f9ff; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin: 0; font-size: 28px;">🧪 Email System Test</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Work Management System</p>
            </div>

            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #15803d; margin: 0 0 15px 0; font-size: 18px;">✅ Email Configuration Test</h2>
              <div style="color: #166534;">
                <p style="margin: 8px 0;"><strong>Test Time:</strong> ${bangladeshTime} (Bangladesh Time)</p>
                <p style="margin: 8px 0;"><strong>From:</strong> test@1550plus.com</p>
                <p style="margin: 8px 0;"><strong>Server:</strong> mail.1550plus.com:465 (SSL)</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">SUCCESS ✨</span></p>
              </div>
            </div>

            ${backupResult.success ? `
            <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #0c4a6e; margin: 0 0 15px 0; font-size: 18px;">📊 Test Backup Included</h2>
              <div style="color: #1e40af;">
                <p style="margin: 8px 0;"><strong>Backup Status:</strong> <span style="color: #059669; font-weight: bold;">SUCCESS</span></p>
                <p style="margin: 8px 0;"><strong>Files Created:</strong> ${backupResult.files?.length || 0}</p>
                <p style="margin: 8px 0;"><strong>Backup Time:</strong> ${bangladeshTime}</p>
              </div>
            </div>

            <div style="background-color: #fefce8; border: 1px solid #eab308; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #a16207; margin: 0 0 15px 0; font-size: 16px;">📎 Test Backup Files Attached</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                ${backupResult.files?.map(file => 
                  `<li style="margin: 5px 0;">${file.name} <span style="color: #78716c; font-size: 12px;">(${file.collection})</span></li>`
                ).join('') || '<li>No files attached</li>'}
              </ul>
            </div>

            <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #15803d; margin: 0 0 15px 0; font-size: 16px;">📋 Test Summary</h3>
              <div style="color: #166534; font-family: 'Courier New', monospace; font-size: 14px; white-space: pre-line;">${backupResult.summary || 'Test backup completed successfully'}</div>
            </div>
            ` : `
            <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">❌ Test Backup Failed</h3>
              <p style="color: #991b1b; margin: 0;">Error: ${backupResult.error || 'Unknown error occurred during test backup'}</p>
            </div>
            `}

            <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
              <h3 style="color: #047857; margin: 0 0 15px 0; font-size: 16px;">🎯 Test Results</h3>
              <ul style="color: #065f46; margin: 0; padding-left: 20px;">
                <li>✅ Email server connection successful</li>
                <li>✅ Authentication working</li>
                <li>✅ SSL/TLS encryption active</li>
                <li>✅ Email delivery confirmed</li>
                <li>${backupResult.success ? '✅' : '❌'} Database backup ${backupResult.success ? 'successful' : 'failed'}</li>
                <li>${attachments.length > 0 ? '✅' : '❌'} File attachments ${attachments.length > 0 ? 'included' : 'not available'}</li>
              </ul>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                🤖 This is an automated test email with backup functionality<br>
                Generated by Work Management System<br>
                <strong>Email system is fully operational! 🚀</strong>
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);
    console.log('Test email with backup sent successfully');
    
    return { 
      success: true, 
      message: 'Test email with backup sent successfully',
      backupIncluded: backupResult.success,
      filesAttached: attachments.length
    };
  } catch (error) {
    console.error('Error sending test email with backup:', error);
    return { success: false, error: error.message };
  }
};