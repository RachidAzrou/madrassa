import React from 'react';

const ChalkboardIcon = ({ className = '' }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="14" rx="2" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="6" y1="12" x2="6" y2="20" />
      <line x1="18" y1="12" x2="18" y2="20" />
      <ellipse cx="12" cy="18" rx="3" ry="2" />
      <path d="M10 4h4" />
      <path d="M8 8h8" />
    </svg>
  );
};

export default ChalkboardIcon;