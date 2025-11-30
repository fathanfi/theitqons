'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-fade-in ${
        type === 'success'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 ml-2"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toasts: ToastMessage[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).substring(7);
    toasts.push({ id, message, type: 'success' });
    notifyListeners();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, 3000);
  },
  error: (message: string) => {
    const id = Math.random().toString(36).substring(7);
    toasts.push({ id, message, type: 'error' });
    notifyListeners();
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notifyListeners();
    }, 3000);
  },
};

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (newToasts: ToastMessage[]) => {
      setCurrentToasts(newToasts);
    };
    toastListeners.push(listener);
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const handleClose = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {currentToasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => handleClose(toast.id)}
        />
      ))}
    </div>
  );
}


