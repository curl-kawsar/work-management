"use client";
import { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

export default function DeleteInvoiceModal({ 
  invoice, 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting = false 
}) {
  const [confirmText, setConfirmText] = useState('');
  const expectedText = invoice?.invoiceNumber || '';

  const handleConfirm = () => {
    if (confirmText === expectedText) {
      onConfirm();
    }
  };

  const isConfirmDisabled = confirmText !== expectedText || isDeleting;

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Delete Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              You are about to permanently delete this invoice:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Invoice Number:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
                </div>
                {invoice.workOrder && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Work Order:</span>
                    <span className="text-sm font-medium text-gray-900">{invoice.workOrder.workOrderNumber}</span>
                  </div>
                )}
                {invoice.workOrder?.clientName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Client:</span>
                    <span className="text-sm font-medium text-gray-900">{invoice.workOrder.clientName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Payment:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${invoice.totalClientPayment?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Revenue:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${invoice.revenue?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">Warning</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• This action cannot be undone</li>
                  <li>• All invoice data will be permanently lost</li>
                  <li>• Financial records and payment history will be deleted</li>
                  <li>• Activity logs will record this deletion</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm deletion, type the invoice number: <span className="font-mono bg-gray-100 px-1 rounded">{expectedText}</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type "${expectedText}" to confirm`}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isDeleting}
              autoComplete="off"
            />
            {confirmText && confirmText !== expectedText && (
              <p className="text-red-600 text-xs mt-1">
                Invoice number doesn't match. Please type exactly: {expectedText}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Invoice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}