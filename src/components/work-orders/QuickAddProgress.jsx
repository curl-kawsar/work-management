"use client";
import { useState } from 'react';
import { Plus, Send, X } from 'lucide-react';

const QUICK_TEMPLATES = [
  { type: 'progress', message: 'Work in progress - proceeding as planned', progress: null },
  { type: 'progress', message: 'Significant progress made today', progress: 50 },
  { type: 'progress', message: 'Almost complete - finishing touches', progress: 90 },
  { type: 'completion', message: 'Task completed successfully', progress: 100 },
  { type: 'issue', message: 'Minor issue encountered - working on resolution', priority: 'normal' },
  { type: 'milestone', message: 'Key milestone achieved', priority: 'normal' },
];

export default function QuickAddProgress({ 
  onAddNote, 
  onCancel, 
  isSubmitting = false,
  className = "" 
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNote, setCustomNote] = useState({
    type: 'progress',
    priority: 'normal',
    progress: null,
  });

  const handleTemplateSelect = async (template) => {
    try {
      await onAddNote({
        message: template.message,
        type: template.type,
        priority: template.priority || 'normal',
        progress: template.progress,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error adding template note:', error);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    try {
      await onAddNote({
        message: customMessage,
        type: customNote.type,
        priority: customNote.priority,
        progress: customNote.progress === '' ? null : Number(customNote.progress),
        timestamp: new Date(),
      });

      // Reset form
      setCustomMessage('');
      setCustomNote({
        type: 'progress',
        priority: 'normal',
        progress: null,
      });
      setShowCustomForm(false);
    } catch (error) {
      console.error('Error adding custom note:', error);
    }
  };

  if (showCustomForm) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={customNote.type}
                onChange={(e) => setCustomNote(prev => ({ ...prev, type: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="progress">Progress</option>
                <option value="issue">Issue</option>
                <option value="completion">Completion</option>
                <option value="milestone">Milestone</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={customNote.priority}
                onChange={(e) => setCustomNote(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {(customNote.type === 'progress' || customNote.type === 'completion') && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Progress %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={customNote.progress || ''}
                onChange={(e) => setCustomNote(prev => ({ ...prev, progress: e.target.value }))}
                placeholder="e.g., 75"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Describe the progress or update..."
              rows="2"
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              ← Back to templates
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !customMessage.trim()}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={12} />
                <span>{isSubmitting ? 'Adding...' : 'Add'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Quick Progress Update</h4>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {QUICK_TEMPLATES.map((template, index) => (
          <button
            key={index}
            onClick={() => handleTemplateSelect(template)}
            disabled={isSubmitting}
            className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-900">{template.message}</span>
              <div className="flex items-center space-x-1">
                <span className={`px-2 py-1 text-xs rounded ${
                  template.type === 'progress' ? 'bg-blue-100 text-blue-800' :
                  template.type === 'completion' ? 'bg-green-100 text-green-800' :
                  template.type === 'issue' ? 'bg-red-100 text-red-800' :
                  template.type === 'milestone' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {template.type}
                </span>
                {template.progress !== null && (
                  <span className="text-xs text-gray-500">{template.progress}%</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowCustomForm(true)}
        className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
      >
        <Plus size={16} />
        <span>Custom Update</span>
      </button>
    </div>
  );
}