"use client";
import { useState, useRef } from 'react';
import { useUploadFiles } from '@/hooks/useFiles';
import { Upload, X, File, Image, Video, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function FileUpload({ 
  workOrderNumber, 
  directory, 
  onUploadSuccess,
  onUploadError,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.pdf', '.doc', '.docx']
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const uploadMutation = useUploadFiles();

  // Get file icon based on type
  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoTypes = ['mp4', 'mov', 'avi', 'mkv'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt'];

    if (imageTypes.includes(ext)) return <Image size={20} className="text-blue-500" />;
    if (videoTypes.includes(ext)) return <Video size={20} className="text-purple-500" />;
    if (documentTypes.includes(ext)) return <FileText size={20} className="text-red-500" />;
    return <File size={20} className="text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds ${formatFileSize(maxFileSize)}`);
    }

    // Check file type
    const fileExt = '.' + file.name.toLowerCase().split('.').pop();
    if (!acceptedTypes.includes(fileExt)) {
      errors.push('File type not supported');
    }

    return errors;
  };

  // Handle file selection
  const handleFileSelection = (files) => {
    const newFiles = Array.from(files);
    const validFiles = [];
    const invalidFiles = [];

    newFiles.forEach(file => {
      const errors = validateFile(file);
      if (errors.length === 0) {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
        });
      } else {
        invalidFiles.push({ file, errors });
      }
    });

    // Check total file count
    if (selectedFiles.length + validFiles.length > maxFiles) {
      const allowedCount = maxFiles - selectedFiles.length;
      validFiles.splice(allowedCount);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      const errorMessage = invalidFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.join(', ')}`
      ).join('\n');
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files);
    }
  };

  // Remove file from selection
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const filesToUpload = selectedFiles.map(f => f.file);
      const result = await uploadMutation.mutateAsync({
        files: filesToUpload,
        workOrderNumber,
        directory,
      });

      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      if (onUploadError) {
        onUploadError(error.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : uploadMutation.isPending
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${uploadMutation.isPending ? 'pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={uploadMutation.isPending}
        />

        <div className="space-y-2">
          <Upload size={48} className={`mx-auto ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploadMutation.isPending ? 'Uploading...' : 'Drop files here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              Supports: {acceptedTypes.join(', ')} • Max {maxFiles} files • {formatFileSize(maxFileSize)} per file
            </p>
          </div>
        </div>

        {uploadMutation.isPending && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Uploading files...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(fileItem.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileItem.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileItem.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(fileItem.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={uploadMutation.isPending}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedFiles([])}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={uploadMutation.isPending}
          >
            Clear All
          </button>
          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || selectedFiles.length === 0}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploadMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}

      {/* Upload Status */}
      {uploadMutation.isError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-700">
            {uploadMutation.error?.message || 'Upload failed'}
          </span>
        </div>
      )}

      {uploadMutation.isSuccess && uploadMutation.data && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-sm text-green-700">
            {uploadMutation.data.message}
            {uploadMutation.data.errors && uploadMutation.data.errors.length > 0 && (
              <div className="mt-1 text-xs">
                Errors: {uploadMutation.data.errors.join(', ')}
              </div>
            )}
          </span>
        </div>
      )}
    </div>
  );
}