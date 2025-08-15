"use client";
import { useState } from 'react';
import { X, Mail, Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteWorkOrderModal({ 
  workOrder, 
  isOpen, 
  onClose, 
  onDelete 
}) {
  const [step, setStep] = useState(1); // 1: confirm, 2: email sent, 3: verify code
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendVerification = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/work-orders/delete-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workOrderId: workOrder._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification email');
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndDelete = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/work-orders/delete-verification', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workOrderId: workOrder._id,
          verificationCode: verificationCode.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify and delete work order');
      }

      // Call the parent's onDelete callback
      onDelete(workOrder._id);
      onClose();
      
      // Reset modal state
      setStep(1);
      setVerificationCode('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setVerificationCode('');
    setError('');
    onClose();
  };

  if (!isOpen || !workOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Delete Work Order
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-red-600">
                <AlertTriangle size={24} />
                <h4 className="text-lg font-medium">Confirm Deletion</h4>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Work Order Details:</p>
                <p className="font-medium">{workOrder.workOrderNumber}</p>
                <p className="text-sm text-gray-600">{workOrder.clientName}</p>
                <p className="text-sm text-gray-600">{workOrder.companyName}</p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>⚠️ Warning:</strong> This action cannot be undone. 
                  All associated data including files and notes will be permanently deleted.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                To proceed with deletion, we'll send a verification code to your email address.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-blue-600">
                <Mail size={24} />
                <h4 className="text-lg font-medium">Email Verification</h4>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  A verification code has been sent to your email address. 
                  Please check your inbox and enter the 6-digit code below.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg font-mono"
                />
              </div>

              <p className="text-xs text-gray-500">
                The verification code will expire in 10 minutes.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          
          {step === 1 && (
            <button
              onClick={handleSendVerification}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Mail size={16} />
              )}
              <span>{isLoading ? 'Sending...' : 'Send Verification'}</span>
            </button>
          )}
          
          {step === 3 && (
            <button
              onClick={handleVerifyAndDelete}
              disabled={isLoading || !verificationCode.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Trash2 size={16} />
              )}
              <span>{isLoading ? 'Deleting...' : 'Delete Work Order'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}