import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const icons = {
  success: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 10L9.16667 11.6667L12.5 8.33334" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.67"/>
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.67"/>
      <path d="M10 6.66669V10" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
      <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.67"/>
      <path d="M10 10V13.3333" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
      <path d="M10 6.66669H10.0083" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
    </svg>
  ),
};

const styles = {
  success: 'bg-green-50 text-green-800 border border-green-200',
  error: 'bg-red-50 text-red-800 border border-red-200',
  info: 'bg-blue-50 text-blue-800 border border-blue-200',
};

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${styles[type]} rounded-lg shadow-xl p-4 animate-slide-up flex items-center gap-3 min-w-[320px]`}>
        <div className="shrink-0">
          {icons[type]}
        </div>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
} 