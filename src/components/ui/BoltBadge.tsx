import React, { useState } from 'react';

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
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'w-16 h-16 md:w-20 md:h-20',
    medium: 'w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28',
    large: 'w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32'
  };

  const positionClasses = {
    'top-right': 'top-4 right-4 md:top-5 md:right-5',
    'top-left': 'top-4 left-4 md:top-5 md:left-5',
    'bottom-right': 'bottom-4 right-4 md:bottom-5 md:right-5',
    'bottom-left': 'bottom-4 left-4 md:bottom-5 md:left-5'
  };

  // Fallback SVG for when the image fails to load
  const BoltSvg = () => (
    <svg 
      viewBox="0 0 360 360" 
      className={`${sizeClasses[size]} rounded-full transition-all duration-300 hover:drop-shadow-lg`}
      style={{ backgroundColor: 'white' }}
    >
      <circle cx="180" cy="180" r="180" fill="white"/>
      <path 
        d="M180 60L120 180H160L140 300L220 180H180L200 60H180Z" 
        fill="#3B82F6" 
        stroke="#1E40AF" 
        strokeWidth="2"
      />
    </svg>
  );

  return (
    <div className={`fixed z-50 bolt-badge ${positionClasses[position]} ${className}`}>
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Built with Bolt.new - Visit Bolt.new to create your own AI-powered applications"
        className="block transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sapphire-blue focus:ring-offset-2 focus:ring-offset-midnight-navy rounded-full"
      >
        {imageError ? (
          <BoltSvg />
        ) : (
          <img 
            src="/white_circle_360x360.png" 
            alt="Powered by Bolt.new" 
            className={`${sizeClasses[size]} rounded-full object-contain transition-all duration-300 hover:drop-shadow-lg`}
            onError={(e) => {
              console.warn('Bolt.new badge image failed to load, using fallback SVG');
              setImageError(true);
            }}
          />
        )}
      </a>
    </div>
  );
}