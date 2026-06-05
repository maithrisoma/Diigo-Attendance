import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-lilac-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className={`relative w-full ${sizes[size]} glass-card p-0 animate-fadeInUp shadow-lilac-lg`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-lilac-300/40">
            <h3 className="text-base font-bold text-lilac-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-lilac-100 text-lilac-500 hover:text-lilac-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
