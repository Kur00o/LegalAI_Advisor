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
    small: 'w-12 h-12 md:w-16 md:h-16',
    medium: 'w-16 h-16 md:w-20 md:h-20',
    large: 'w-20 h-20 md:w-24 md:h-24'
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
      <text 
        x="180" 
        y="180" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize="0" 
        fill="transparent"
      >
        POWERED BY BOLT.NEW MADE IN BOLT.NEW
      </text>
      <path d="M180 70 L220 70 L160 180 L200 180 L140 290 L160 200 L120 200 Z" fill="black"/>
    </svg>
  );

  const handleImageError = () => {
    console.error("Failed to load Bolt.new badge image");
    setImageError(true);
  };

  return (
    <a 
      href="https://bolt.new/" 
      target="_blank" 
      rel="noopener noreferrer"
      className={`fixed ${positionClasses[position]} z-30 bolt-badge ${className}`}
      aria-label="Powered by Bolt.new"
    >
      {imageError ? (
        <BoltSvg />
      ) : (
        <img 
          src="/white_circle_360x360.png" 
          alt="Powered by Bolt.new" 
          className={`${sizeClasses[size]} rounded-full transition-all duration-300 hover:drop-shadow-lg`}
          onError={handleImageError}
        />
      )}
    </a>
  );
}