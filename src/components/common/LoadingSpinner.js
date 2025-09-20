// src/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = '', className = '' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'medium':
        return 'w-8 h-8';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`${getSizeClasses()} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
        />
      </div>
      {message && (
        <p className={`mt-4 text-gray-600 ${getTextSize()}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;