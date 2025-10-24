
import React, { useState } from 'react';

interface AccordionCardProps {
  title: string;
  children: React.ReactNode;
  startOpen?: boolean;
}

const AccordionCard: React.FC<AccordionCardProps> = ({ title, children, startOpen = true }) => {
  const [isOpen, setIsOpen] = useState(startOpen);

  const ChevronIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className="bg-gray-800/70 rounded-lg shadow-lg">
      <button
        className={`w-full flex justify-between items-center text-left text-xl font-bold text-cyan-400 p-6 focus:outline-none transition-colors ${isOpen ? 'border-b border-gray-700' : 'border-b border-transparent'}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <ChevronIcon />
      </button>
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}
      >
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AccordionCard;
