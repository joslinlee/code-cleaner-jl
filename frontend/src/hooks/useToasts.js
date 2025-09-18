import { useState, useCallback } from 'react';

/**
 * Custom hook for managing toast notifications.
 * @returns {{
 *   toasts: Array<{id: string, message: string, type: string}>,
 *   addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warn') => void,
 *   removeToast: (id: string) => void
 * }}
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}