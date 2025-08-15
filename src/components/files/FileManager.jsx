"use client";
import { useState } from 'react';
import FileUpload from './FileUpload';
import FileGallery from './FileGallery';
import { Folder, Upload as UploadIcon, Grid, List, FolderOpen } from 'lucide-react';

export default function FileManager({ 
  workOrderNumber, 
  directory,
  showUpload = true,
  showGallery = true,
  title = "File Manager",
  className = ""
}) {
  const [activeTab, setActiveTab] = useState(showGallery ? 'gallery' : 'upload');
  const [viewMode, setViewMode] = useState('grid');
  const [notification, setNotification] = useState(null);

  // Handle upload success
  const handleUploadSuccess = (result) => {
    setNotification({
      type: 'success',
      message: `Successfully uploaded ${result.files?.length || 0} files`,
    });
    
    // Auto-switch to gallery to show uploaded files
    if (showGallery) {
      setActiveTab('gallery');
    }

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle upload error
  const handleUploadError = (error) => {
    setNotification({
      type: 'error',
      message: typeof error === 'string' ? error : 'Upload failed',
    });

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle file deletion
  const handleFileDelete = (filePath) => {
    setNotification({
      type: 'success',
      message: 'File deleted successfully',
    });

    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen size={20} className="text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
              {(workOrderNumber || directory) && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">
                  {workOrderNumber || directory}
                </span>
              )}
            </div>

            {/* View Mode Toggle (only for gallery) */}
            {showGallery && activeTab === 'gallery' && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List view"
                >
                  <List size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Tabs (if both upload and gallery are enabled) */}
          {showUpload && showGallery && (
            <div className="mt-4">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'gallery'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Folder size={16} />
                    <span>Files</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <UploadIcon size={16} />
                    <span>Upload</span>
                  </div>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-4 border-b ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Upload Section */}
        {showUpload && (!showGallery || activeTab === 'upload') && (
          <FileUpload
            workOrderNumber={workOrderNumber}
            directory={directory}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        )}

        {/* Gallery Section */}
        {showGallery && (!showUpload || activeTab === 'gallery') && (
          <FileGallery
            workOrderNumber={workOrderNumber}
            directory={directory}
            onFileDelete={handleFileDelete}
            showUploadSection={showUpload}
            viewMode={viewMode}
          />
        )}
      </div>
    </div>
  );
}