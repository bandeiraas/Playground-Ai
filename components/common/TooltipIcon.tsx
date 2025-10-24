import React, { useState } from 'react';

interface TooltipIconProps {
  text: string;
}

const TooltipIcon: React.FC<TooltipIconProps> = ({ text }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-block ml-1.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <i className="fas fa-info-circle text-gray-500 cursor-pointer hover:text-cyan-400 text-xs"></i>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 border border-gray-700 text-left">
          {text}
        </div>
      )}
    </div>
  );
};

export default TooltipIcon;
