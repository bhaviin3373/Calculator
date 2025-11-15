

import React from 'react';

interface CalculatorButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'number' | 'operator' | 'special' | 'scientific';
  className?: string;
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({
  onClick,
  children,
  variant = 'number',
  className = '',
}) => {
  const baseClasses = "rounded-full text-2xl sm:text-3xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 aspect-square flex items-center justify-center focus:ring-offset-white dark:focus:ring-offset-black";

  const variantClasses = {
    number: 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 focus:ring-zinc-400 dark:focus:ring-zinc-600',
    operator: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400 text-3xl sm:text-4xl',
    special: 'bg-zinc-400 dark:bg-zinc-600 text-black dark:text-white hover:bg-zinc-500 dark:hover:bg-zinc-500 focus:ring-zinc-400',
    scientific: 'bg-zinc-300 dark:bg-zinc-700 text-black dark:text-white hover:bg-zinc-400 dark:hover:bg-zinc-600 focus:ring-zinc-500 text-xl sm:text-2xl',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default CalculatorButton;
