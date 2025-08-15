"use client";
import { useState } from 'react';
import { 
  Menu, 
  X, 
  Plus, 
  Camera, 
  MessageSquare, 
  MapPin, 
  Phone, 
  Clock,
  CheckCircle,
  Play,
  Pause,
  Upload,
  FileText,
  Bell,
  Home
} from 'lucide-react';
import Link from 'next/link';

export default function MobileStaffActions({ 
  workOrder,
  onStatusUpdate,
  onQuickNote,
  onFileUpload,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  const handleQuickNote = (type, message) => {
    if (onQuickNote) {
      onQuickNote({
        message: message || quickNote,
        type,
        priority: type === 'issue' ? 'high' : 'normal',
        timestamp: new Date(),
      });
    }
    setQuickNote('');
    setShowNoteInput(false);
    setIsOpen(false);
  };

  const quickNoteTemplates = [
    { type: 'progress', message: 'Work is progressing as scheduled', icon: Clock },
    { type: 'completion', message: 'Task completed successfully', icon: CheckCircle },
    { type: 'issue', message: 'Issue encountered - need assistance', icon: MessageSquare },
    { type: 'milestone', message: 'Important milestone reached', icon: CheckCircle },
  ];

  return (
    <>
      {/* Mobile FAB */}
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center
            transition-all duration-300 transform hover:scale-110 active:scale-95
            ${isOpen ? 'rotate-45' : 'rotate-0'}
          `}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Mobile Action Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Work Order Info */}
            {workOrder && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">{workOrder.workOrderNumber}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} />
                    <span>{workOrder.address}</span>
                  </div>
                  <div>Client: {workOrder.clientName}</div>
                  <div>Status: <span className="font-medium">{workOrder.status}</span></div>
                </div>
              </div>
            )}

            {/* Status Actions */}
            {workOrder && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Update Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  {workOrder.status === 'Created' && (
                    <button
                      onClick={() => {
                        onStatusUpdate?.(workOrder._id, 'Ongoing');
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center space-x-2 p-3 bg-yellow-600 text-white rounded-lg"
                    >
                      <Play size={16} />
                      <span>Start Work</span>
                    </button>
                  )}
                  
                  {workOrder.status === 'Ongoing' && (
                    <button
                      onClick={() => {
                        onStatusUpdate?.(workOrder._id, 'Completed');
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg"
                    >
                      <CheckCircle size={16} />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Notes */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Updates</h3>
              <div className="grid grid-cols-1 gap-2">
                {quickNoteTemplates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickNote(template.type, template.message)}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <Icon size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{template.message}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Custom Note */}
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="w-full mt-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700"
              >
                + Add custom note
              </button>
              
              {showNoteInput && (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleQuickNote('note')}
                      disabled={!quickNote.trim()}
                      className="flex-1 p-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
                    >
                      Add Note
                    </button>
                    <button
                      onClick={() => {
                        setShowNoteInput(false);
                        setQuickNote('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Media & Files</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <Camera size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        onFileUpload?.(e.target.files[0]);
                        setIsOpen(false);
                      }
                    }}
                  />
                </label>
                
                <label className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">Upload File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        onFileUpload?.(e.target.files[0]);
                        setIsOpen(false);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Navigation */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Navigation</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/staff"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Home size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">Dashboard</span>
                </Link>
                
                <Link
                  href="/work-orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">All Orders</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}