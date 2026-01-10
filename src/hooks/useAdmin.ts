import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if the current user is an admin
 * @returns {boolean} True if the user is an admin, false otherwise
 */
export const useAdmin = () => {
  const { isAdmin, user, loading } = useAuth();
  
  return {
    isAdmin: isAdmin && !!user,
    isLoading: loading,
    user,
  };
};



