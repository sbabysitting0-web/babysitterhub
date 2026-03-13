import React from 'react';

const MapLoadingSpinner = () => {
  return (
    <div className="absolute inset-0 z-[2000] flex items-center justify-center pointer-events-none" style={{ background: 'rgba(8, 15, 13, 0.2)' }}>
      {/* Pill background */}
      <div className="bg-white rounded-[32px] flex items-center justify-center gap-1.5 px-6 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.15)] backdrop-blur-md">
        <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: '#2a9d95', animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: '#3DBEB5', animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: '#E91E8C', animationDelay: '300ms' }} />
        <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: '#F472B6', animationDelay: '450ms' }} />
      </div>
    </div>
  );
};

export default MapLoadingSpinner;
