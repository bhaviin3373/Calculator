
import React from 'react';

interface HistoryDisplayProps {
  history: string[];
  onClear: () => void;
  onClose: () => void;
  onHistoryItemClick: (result: string) => void;
}

const HistoryDisplay: React.FC<HistoryDisplayProps> = ({ history, onClear, onClose, onHistoryItemClick }) => {
  const handleItemClick = (item: string) => {
    const result = item.split('=').pop()?.trim();
    if (result && result !== 'Error') {
      onHistoryItemClick(result);
    }
  };

  return (
    <div className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm z-10 flex flex-col p-6 rounded-3xl animate-history-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">History</h2>
        <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-2 -m-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-grow overflow-y-auto text-right pr-2">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center">
             <p className="text-gray-400 dark:text-gray-500">No history yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((item, index) => (
              <li 
                key={index} 
                className="text-gray-600 dark:text-gray-300 text-base sm:text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-md cursor-pointer transition-colors"
                onClick={() => handleItemClick(item)}
                title="Click to use this result"
              >
                {item.split('=')[0]}=<span className="text-black dark:text-white font-semibold">{item.split('=')[1]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {history.length > 0 && (
         <button 
            onClick={onClear} 
            className="mt-4 w-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-red-500 dark:text-red-400 font-bold py-3 px-4 rounded-xl transition-colors"
        >
            Clear History
        </button>
      )}
    </div>
  );
};

export default HistoryDisplay;