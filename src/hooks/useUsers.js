import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Users API functions
const usersApi = {
  // Get all users
  getUsers: async () => {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  // Get staff users only
  getStaffUsers: async () => {
    const response = await fetch('/api/users/staff');
    if (!response.ok) {
      throw new Error('Failed to fetch staff users');
    }
    return response.json();
  },

  // Get single user
  getUser: async (id) => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  // Create user
  createUser: async (userData) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }

    return response.json();
  },

  // Update user
  updateUser: async ({ id, data }) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update user');
    }

    return response.json();
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete user');
    }

    return response.json();
  },

  // Get staff performance data
  getStaffPerformance: async () => {
    const response = await fetch('/api/users/staff/performance');
    if (!response.ok) {
      throw new Error('Failed to fetch staff performance');
    }
    return response.json();
  },
};

// User roles enum
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
};

// Custom hooks
export const useUsers = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes - users don't change often
    select: (data) => data.users || [],
  });
};

export const useStaffUsers = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['users', 'staff'],
    queryFn: usersApi.getStaffUsers,
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes - staff list changes less frequently
    select: (data) => {
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.users && Array.isArray(data.users)) {
        return data.users;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (typeof data === 'object' && data !== null) {
        // Try to extract an array of users if available
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          return possibleArrays[0];
        } else {
          // If we can't find an array, create staff list from object keys
          const staffArray = Object.entries(data).map(([id, details]) => {
            if (typeof details === 'object') {
              return { _id: id, name: details.name || details.fullName || details.username || id };
            } else {
              return { _id: id, name: details || id };
            }
          });
          return staffArray;
        }
      }
      return [];
    },
  });
};

export const useUser = (id, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getUser(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.user,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: (data) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Add the new user to the cache
      if (data.user) {
        queryClient.setQueryData(['user', data.user._id], data);
      }
    },
    onError: (error) => {
      console.error('Create user failed:', error);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateUser,
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user', id] });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(['user', id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['user', id], (old) => ({
        ...old,
        user: { ...old?.user, ...data }
      }));

      return { previousUser };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser) {
        queryClient.setQueryData(['user', id], context.previousUser);
      }
    },
    onSuccess: (data, { id }) => {
      // Update the specific user in cache
      queryClient.setQueryData(['user', id], data);
      
      // Invalidate users list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: (data, id) => {
      // Remove the user from cache
      queryClient.removeQueries({ queryKey: ['user', id] });
      
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Delete user failed:', error);
    },
  });
};

// Utility hooks for filtered data
export const useUsersByRole = (role, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['users', 'role', role],
    queryFn: usersApi.getUsers,
    enabled,
    select: (data) => {
      const users = data.users || [];
      return role ? users.filter(user => user.role === role) : users;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAdminUsers = ({ enabled = true } = {}) => {
  return useUsersByRole(USER_ROLES.ADMIN, { enabled });
};

export const useUsersMetrics = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['users', 'metrics'],
    queryFn: usersApi.getUsers,
    enabled,
    select: (data) => {
      const users = data.users || [];
      return {
        total: users.length,
        admins: users.filter(user => user.role === USER_ROLES.ADMIN).length,
        staff: users.filter(user => user.role === USER_ROLES.STAFF).length,
        recentlyCreated: users.filter(user => {
          const createdDate = new Date(user.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdDate > weekAgo;
        }).length,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for metrics
  });
};

// Hook for user options (useful for dropdowns)
export const useUserOptions = ({ role = null, enabled = true } = {}) => {
  return useQuery({
    queryKey: ['users', 'options', role],
    queryFn: usersApi.getUsers,
    enabled,
    select: (data) => {
      let users = data.users || [];
      if (role) {
        users = users.filter(user => user.role === role);
      }
      return users.map(user => ({
        value: user._id,
        label: user.name,
        email: user.email,
        role: user.role,
      }));
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for options
  });
};

export const useStaffOptions = ({ enabled = true } = {}) => {
  return useUserOptions({ role: USER_ROLES.STAFF, enabled });
};

// Search users hook
export const useSearchUsers = (searchTerm, { enabled = true } = {}) => {
  return useQuery({
    queryKey: ['users', 'search', searchTerm],
    queryFn: usersApi.getUsers,
    enabled: enabled && !!searchTerm && searchTerm.length >= 2,
    select: (data) => {
      const users = data.users || [];
      const term = searchTerm.toLowerCase();
      return users.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useStaffPerformance = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: ['users', 'staff', 'performance'],
    queryFn: usersApi.getStaffPerformance,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes - performance data should be relatively fresh
    select: (data) => data || { staffPerformance: [], summary: {} },
  });
};

// Invalidation helpers
export const useInvalidateUsers = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    invalidateUser: (id) => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
    invalidateStaff: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'staff'] });
    },
    invalidateOptions: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'options'] });
    },
  };
};