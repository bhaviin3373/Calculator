
import React, { useState } from 'react';
import ClipboardIcon from './ClipboardIcon';

interface CalculatorDisplayProps {
  value: string;
  operation: string;
  memory: number;
  error: string | null;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ value, operation, memory, error }) => {
  const [isCopied, setIsCopied] = useState(false);

  const getFontSize = (val: string) => {
    const len = val.length;
    if (len > 12) return 'text-3xl sm:text-4xl';
    if (len > 9) return 'text-4xl sm:text-5xl';
    if (len > 6) return 'text-5xl sm:text-6xl';
    return 'text-6xl sm:text-7xl';
  };

  const hasError = error !== null;

  const handleCopyClick = () => {
    if (hasError || isCopied) return;
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const displayValue = hasError ? error : value;
  const displayClasses = `font-medium animate-value-update ${
    hasError ? 'text-3xl sm:text-4xl text-red-500 dark:text-red-400' : getFontSize(value)
  }`;

  return (
    <div className="relative text-black dark:text-white text-right break-words h-28 sm:h-32 flex flex-col justify-end overflow-hidden">
      {memory !== 0 && !hasError && (
        <div className="absolute top-1 left-2 text-base sm:text-lg text-gray-500 dark:text-gray-400 font-semibold">
          M
        </div>
      )}
      
      <div className="absolute bottom-1 left-2">
        <button
          onClick={handleCopyClick}
          disabled={hasError || isCopied}
          className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-black dark:hover:text-white transition-all p-2 -m-2 rounded-lg"
          aria-label="Copy value to clipboard"
        >
          <ClipboardIcon copied={isCopied} />
          {isCopied && <span className="text-sm font-medium animate-history-fade-in">Copied!</span>}
        </button>
      </div>

      <div className="text-2xl sm:text-3xl text-gray-500 dark:text-gray-400 font-light min-h-[30px] sm:min-h-[36px] transition-opacity duration-200">
        {!hasError && operation.trim()}
      </div>
      <div
        key={displayValue}
        className={displayClasses}
      >
        {displayValue}
      </div>
    </div>
  );
};

export default CalculatorDisplay;