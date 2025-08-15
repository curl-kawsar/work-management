import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// File management API functions
const filesApi = {
  // Get files list
  getFiles: async ({ workOrderNumber, directory } = {}) => {
    const params = new URLSearchParams();
    if (workOrderNumber) params.append('workOrderNumber', workOrderNumber);
    if (directory) params.append('directory', directory);

    const response = await fetch(`/api/files?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    return response.json();
  },

  // Get file info
  getFileInfo: async (filePath) => {
    const params = new URLSearchParams({ path: filePath });
    const response = await fetch(`/api/files/info?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch file info');
    }
    return response.json();
  },

  // Upload files
  uploadFiles: async ({ files, workOrderNumber, directory }) => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    if (workOrderNumber) {
      formData.append('workOrderNumber', workOrderNumber);
    }
    if (directory) {
      formData.append('directory', directory);
    }

    const response = await fetch('/api/files', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload files');
    }

    return response.json();
  },

  // Delete file
  deleteFile: async (filePath) => {
    const params = new URLSearchParams({ path: filePath });
    const response = await fetch(`/api/files?${params}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete file');
    }

    return response.json();
  },
};

// Custom hooks
export const useFiles = ({ workOrderNumber, directory, enabled = true } = {}) => {
  return useQuery({
    queryKey: ['files', { workOrderNumber, directory }],
    queryFn: () => filesApi.getFiles({ workOrderNumber, directory }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useFileInfo = (filePath, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['fileInfo', filePath],
    queryFn: () => filesApi.getFileInfo(filePath),
    enabled: enabled && !!filePath,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUploadFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.uploadFiles,
    onSuccess: (data, variables) => {
      // Invalidate and refetch files list
      queryClient.invalidateQueries({
        queryKey: ['files', { 
          workOrderNumber: variables.workOrderNumber,
          directory: variables.directory 
        }]
      });
      
      // Also invalidate general files queries
      queryClient.invalidateQueries({
        queryKey: ['files']
      });
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.deleteFile,
    onSuccess: (data, filePath) => {
      // Extract work order number from file path
      const pathParts = filePath.split('/');
      const workOrderNumber = pathParts[2];

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['files', { workOrderNumber }]
      });
      
      queryClient.invalidateQueries({
        queryKey: ['files']
      });

      // Remove the specific file info from cache
      queryClient.removeQueries({
        queryKey: ['fileInfo', filePath]
      });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
    },
  });
};

// Hook for work order files specifically
export const useWorkOrderFiles = (workOrderNumber, { enabled = true } = {}) => {
  return useFiles({ workOrderNumber, enabled });
};

// Hook for getting all work order directories
export const useWorkOrderDirectories = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['files', 'directories'],
    queryFn: () => filesApi.getFiles(),
    enabled,
    select: (data) => data.directories || [],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};