import React from 'react';

interface BoltBadgeProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function BoltBadge({ 
  className = '', 
  size = 'medium',
  position = 'top-right'
}: BoltBadgeProps) {
  const sizeClasses = {
    small: 'w-16 h-16 md:w-20 md:h-20',
    medium: 'w-20 h-20 md:w-24 md:h-24',
    large: 'w-24 h-24 md:w-28 md:h-28'
  };

  const positionClasses = {
    'top-right': 'top-20 right-4 md:top-24 md:right-5', // Adjusted to be below taskbar
    'top-left': 'top-20 left-4 md:top-24 md:left-5',    // Adjusted to be below taskbar
    'bottom-right': 'bottom-4 right-4 md:bottom-5 md:right-5',
    'bottom-left': 'bottom-4 left-4 md:bottom-5 md:left-5'
  };

  return (
    <a 
      href="https://bolt.new/" 
      target="_blank" 
      rel="noopener noreferrer"
      className={`fixed ${positionClasses[position]} z-30 bolt-badge ${className}`}
      aria-label="Powered by Bolt.new"
    >
      <img 
        src="/image.png" 
        alt="Powered by Bolt.new" 
        className={`${sizeClasses[size]} rounded-full transition-all duration-300 hover:drop-shadow-lg`}
      />
    </a>
  );
}