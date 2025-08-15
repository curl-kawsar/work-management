"use client";
import { useState } from 'react';
import { useFiles, useDeleteFile, useFileInfo } from '@/hooks/useFiles';
import { 
  Image, 
  Video, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  X, 
  File,
  Calendar,
  HardDrive,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function FileGallery({ 
  workOrderNumber, 
  directory, 
  onFileDelete,
  showUploadSection = true,
  viewMode = 'grid' // 'grid' or 'list'
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const { data: filesData, isLoading, error, refetch } = useFiles({ 
    workOrderNumber, 
    directory 
  });
  const deleteFileMutation = useDeleteFile();

  // Get file icon based on type
  const getFileIcon = (fileName, size = 24) => {
    const ext = fileName.toLowerCase().split('.').pop();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoTypes = ['mp4', 'mov', 'avi', 'mkv'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt'];

    if (imageTypes.includes(ext)) return <Image size={size} className="text-blue-500" />;
    if (videoTypes.includes(ext)) return <Video size={size} className="text-purple-500" />;
    if (documentTypes.includes(ext)) return <FileText size={size} className="text-red-500" />;
    return <File size={size} className="text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle file download
  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file deletion
  const handleDelete = async (filePath) => {
    try {
      await deleteFileMutation.mutateAsync(filePath);
      setDeleteConfirm(null);
      if (onFileDelete) {
        onFileDelete(filePath);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Check if file is an image
  const isImage = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  // Check if file is a video
  const isVideo = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['mp4', 'mov', 'avi', 'mkv'].includes(ext);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Error loading files</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const files = filesData?.files || [];

  if (files.length === 0) {
    return (
      <div className="text-center p-8">
        <File size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
        <p className="text-gray-500">
          {showUploadSection 
            ? 'Upload some files to get started'
            : 'No files found in this location'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Files Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Files ({files.length})
        </h3>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh files"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Files Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.path}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
            >
              {/* File Preview */}
              <div className="relative mb-3">
                {isImage(file.name) ? (
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={file.path}
                      alt={file.name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setSelectedFile(file)}
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
                    {getFileIcon(file.name, 32)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                  {file.name}
                </h4>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                {file.lastModified && (
                  <p className="text-xs text-gray-400">
                    {formatDate(file.lastModified)}
                  </p>
                )}
              </div>

              {/* File Actions */}
              <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedFile(file)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                </div>
                <button
                  onClick={() => setDeleteConfirm(file)}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file.name, 20)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <HardDrive size={12} />
                      <span>{formatFileSize(file.size)}</span>
                    </span>
                    {file.lastModified && (
                      <span className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{formatDate(file.lastModified)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedFile(file)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(file)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {selectedFile.name}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(selectedFile)}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-auto">
              {isImage(selectedFile.name) ? (
                <img
                  src={selectedFile.path}
                  alt={selectedFile.name}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : isVideo(selectedFile.name) ? (
                <video
                  controls
                  className="max-w-full h-auto rounded-lg"
                  src={selectedFile.path}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center py-8">
                  {getFileIcon(selectedFile.name, 64)}
                  <p className="mt-4 text-gray-600">
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={() => handleDownload(selectedFile)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Size:</span>
                  <span className="ml-1 font-medium">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-1 font-medium">{selectedFile.type || 'Unknown'}</span>
                </div>
                {selectedFile.lastModified && (
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Modified:</span>
                    <span className="ml-1 font-medium">{formatDate(selectedFile.lastModified)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Delete File</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={deleteFileMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.path)}
                  disabled={deleteFileMutation.isPending}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {deleteFileMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}