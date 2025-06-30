import React from 'react';

export function BoltBadge() {
  return (
    <a 
      href="https://bolt.new/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="absolute top-24 right-4 z-30 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sapphire-blue focus:ring-offset-2 focus:ring-offset-midnight-navy"
      aria-label="Powered by Bolt.new"
    >
      <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] relative">
        <img 
          src="/white_circle_360x360.png" 
          alt="Powered by Bolt.new" 
          className="w-full h-full"
        />
      </div>
    </a>
  );
}