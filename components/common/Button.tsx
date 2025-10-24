
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = "font-bold py-2 px-4 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
  const variantClasses = {
    primary: "bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
