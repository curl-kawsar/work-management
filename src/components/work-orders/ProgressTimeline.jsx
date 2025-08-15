"use client";
import { useState } from 'react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Tag, 
  Paperclip,
  TrendingUp,
  Flag,
  Star,
  Calendar,
  FileText,
  Send,
  Filter,
  X
} from 'lucide-react';

const ACTIVITY_TYPES = {
  created: { icon: Plus, color: 'bg-green-100 text-green-600', label: 'Created' },
  progress: { icon: TrendingUp, color: 'bg-blue-100 text-blue-600', label: 'Progress Update' },
  issue: { icon: AlertTriangle, color: 'bg-red-100 text-red-600', label: 'Issue Reported' },
  completion: { icon: CheckCircle, color: 'bg-green-100 text-green-600', label: 'Task Completed' },
  status_change: { icon: Flag, color: 'bg-purple-100 text-purple-600', label: 'Status Changed' },
  assignment: { icon: User, color: 'bg-orange-100 text-orange-600', label: 'Assignment Updated' },
  note: { icon: MessageSquare, color: 'bg-gray-100 text-gray-600', label: 'Note Added' },
  milestone: { icon: Star, color: 'bg-yellow-100 text-yellow-600', label: 'Milestone Reached' },
};

const PRIORITY_COLORS = {
  low: 'border-l-gray-300',
  normal: 'border-l-blue-300',
  high: 'border-l-orange-300',
  critical: 'border-l-red-500',
};

export default function ProgressTimeline({ 
  workOrder, 
  onAddNote, 
  canAddNotes = false,
  showAddNoteForm = false,
  onToggleAddNoteForm 
}) {
  const [newNote, setNewNote] = useState({
    message: '',
    type: 'note',
    priority: 'normal',
    progress: null,
    tags: [],
  });
  const [filter, setFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Get activity type configuration
  const getActivityConfig = (type) => ACTIVITY_TYPES[type] || ACTIVITY_TYPES.note;

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  // Filter activities
  const filteredNotes = (workOrder.notes || []).filter(note => {
    if (filter === 'all') return true;
    return note.type === filter;
  });

  // Handle adding tags
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!newNote.tags.includes(tagInput.trim())) {
        setNewNote(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.message.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddNote({
        ...newNote,
        progress: newNote.progress === '' ? null : Number(newNote.progress),
        timestamp: new Date(),
      });
      
      // Reset form
      setNewNote({
        message: '',
        type: 'note',
        priority: 'normal',
        progress: null,
        tags: [],
      });
      setTagInput('');
      onToggleAddNoteForm(false);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique activity types for filter
  const availableTypes = [...new Set((workOrder.notes || []).map(note => note.type))];

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Work Progress Timeline</h2>
            <p className="text-sm text-gray-600">Track continuous evaluation and updates</p>
          </div>
          {canAddNotes && (
            <button
              onClick={() => onToggleAddNoteForm(!showAddNoteForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Update</span>
            </button>
          )}
        </div>

        {/* Filters */}
        {availableTypes.length > 1 && (
          <div className="mt-4 flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({workOrder.notes?.length || 0})
              </button>
              {availableTypes.map(type => {
                const config = getActivityConfig(type);
                const count = workOrder.notes?.filter(note => note.type === type).length || 0;
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === type 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {config.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Note Form */}
      {showAddNoteForm && canAddNotes && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Type
                </label>
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="note">General Note</option>
                  <option value="progress">Progress Update</option>
                  <option value="issue">Issue/Problem</option>
                  <option value="completion">Task Completed</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newNote.priority}
                  onChange={(e) => setNewNote(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {(newNote.type === 'progress' || newNote.type === 'completion') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progress %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newNote.progress || ''}
                    onChange={(e) => setNewNote(prev => ({ ...prev, progress: e.target.value }))}
                    placeholder="e.g., 75"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Message
              </label>
              <textarea
                value={newNote.message}
                onChange={(e) => setNewNote(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Describe the work progress, issues, or updates..."
                rows="3"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newNote.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tags (press Enter)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onToggleAddNoteForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newNote.message.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Adding...' : 'Add Update'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div className="p-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
            <p className="text-gray-600">
              {canAddNotes 
                ? "Start tracking work progress by adding your first update."
                : "Updates will appear here as work progresses."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNotes
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((note, index) => {
                const config = getActivityConfig(note.type);
                const Icon = config.icon;
                
                return (
                  <div
                    key={index}
                    className={`relative pl-8 pb-6 border-l-4 ${PRIORITY_COLORS[note.priority || 'normal']} ${
                      index === filteredNotes.length - 1 ? 'border-l-transparent' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-0 transform -translate-x-1/2 w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="ml-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
                              {config.label}
                            </span>
                            {note.priority && note.priority !== 'normal' && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                note.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                note.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {note.priority}
                              </span>
                            )}
                            {note.progress !== null && note.progress !== undefined && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                {note.progress}% Complete
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-900 mb-2 whitespace-pre-wrap">{note.message}</p>
                          
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {note.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                  <Tag size={10} />
                                  <span>{tag}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User size={12} />
                          <span>{note.user?.name || 'Unknown User'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{formatRelativeTime(note.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}