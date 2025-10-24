import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-gray-800/70 rounded-lg shadow-lg ${className}`}>
      {title && (
         <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2 px-6 pt-6">{title}</h2>
      )}
      <div className={title ? "p-6" : ""}>
         {children}
      </div>
    </div>
  );
};

export default Card;