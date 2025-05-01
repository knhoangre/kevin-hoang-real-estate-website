import { useCallback } from 'react';

/**
 * Custom hook that provides a function to scroll to the top of the page
 * @returns A function that scrolls to the top of the page
 */
export const useScrollToTop = () => {
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return scrollToTop;
};

export default useScrollToTop;