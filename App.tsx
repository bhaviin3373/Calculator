

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import CalculatorButton from './components/CalculatorButton';
import CalculatorDisplay from './components/CalculatorDisplay';
import HistoryDisplay from './components/HistoryDisplay';
import HistoryIcon from './components/HistoryIcon';
import ThemeIcon from './components/ThemeIcon';
import UnitSelector from './components/UnitSelector';
import { Operator } from './types';

const INITIAL_CONVERSION_DATA = {
  currency: {
    base: 'USD',
    units: ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'INR'] as const,
    rates: { USD: 1, EUR: 0.93, JPY: 157.0, GBP: 0.79, CAD: 1.37, AUD: 1.51, INR: 83.5 },
  },
  length: {
    base: 'Meter',
    units: ['Meter', 'Kilometer', 'Mile', 'Foot', 'Inch'] as const,
    factors: { Meter: 1, Kilometer: 0.001, Mile: 0.000621371, Foot: 3.28084, Inch: 39.3701 },
  },
  mass: {
    base: 'Kilogram',
    units: ['Kilogram', 'Gram', 'Pound', 'Ounce'] as const,
    factors: { Kilogram: 1, Gram: 1000, Pound: 2.20462, Ounce: 35.274 },
  },
  temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'] as const,
  },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  INR: '₹',
};

const currencyDisplayMap = Object.fromEntries(
  INITIAL_CONVERSION_DATA.currency.units.map(code => {
    const symbol = CURRENCY_SYMBOLS[code];
    return [code, symbol ? `${code} (${symbol})` : code];
  })
);

type ConverterType = keyof typeof INITIAL_CONVERSION_DATA;


const App: React.FC = () => {
  const [currentOperand, setCurrentOperand] = useState('0');
  const [previousOperand, setPreviousOperand] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [calculatorMode, setCalculatorMode] = useState<'normal' | 'scientific' | 'converter'>('normal');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [memory, setMemory] = useState<number>(0);

  // Converter state
  const [conversionData, setConversionData] = useState(INITIAL_CONVERSION_DATA);
  const [ratesStatus, setRatesStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [converterType, setConverterType] = useState<ConverterType>('currency');
  const [fromUnit, setFromUnit] = useState(INITIAL_CONVERSION_DATA.currency.units[0]);
  const [toUnit, setToUnit] = useState(INITIAL_CONVERSION_DATA.currency.units[1]);
  const [inputValue, setInputValue] = useState('1');


  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('calculator-theme') as 'light' | 'dark' | null;
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (userPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);
  
  // Fetch real-time currency rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      setRatesStatus('loading');
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (!response.ok) {
          throw new Error('Failed to fetch rates');
        }
        const data = await response.json();
        setConversionData(prevData => ({
          ...prevData,
          currency: {
            ...prevData.currency,
            rates: { ...data.rates, USD: 1 },
          },
        }));
        setRatesStatus('idle');
      } catch (e) {
        console.error("Failed to fetch currency rates:", e);
        setRatesStatus('error');
      }
    };

    fetchRates();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('calculator-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Load history and memory from localStorage on initial render
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('calculatorHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
      const storedMemory = localStorage.getItem('calculatorMemory');
      if (storedMemory) {
        setMemory(JSON.parse(storedMemory));
      }
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('calculatorHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);
  
  // Save memory to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('calculatorMemory', JSON.stringify(memory));
    } catch (e) {
      console.error("Failed to save memory to localStorage", e);
    }
  }, [memory]);

  const calculate = useCallback((): string => {
    const prev = parseFloat(previousOperand || '0');
    const current = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(current)) return '';
    
    let computation: number;
    switch (operator) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '*':
        computation = prev * current;
        break;
      case '/':
        if (current === 0) throw new Error('Cannot divide by zero');
        computation = prev / current;
        break;
      default:
        return currentOperand;
    }
    return String(parseFloat(computation.toPrecision(15)));
  }, [currentOperand, previousOperand, operator]);

  const handleNumberClick = (num: string) => {
    if (error) {
      setCurrentOperand(num);
      setError(null);
      setOverwrite(false);
      return;
    }
    if (overwrite) {
      setCurrentOperand(num);
      setOverwrite(false);
      return;
    }
    if (num === '.' && currentOperand.includes('.')) return;
    if (currentOperand === '0' && num !== '.') {
      setCurrentOperand(num);
    } else {
      setCurrentOperand(prev => (prev + num).slice(0, 16));
    }
  };

  const handleOperatorClick = (op: Operator) => {
    if (error) return;
    if (previousOperand !== null && !overwrite) {
      try {
        const result = calculate();
        setCurrentOperand(result);
        setPreviousOperand(result);
      } catch (e: any) {
        setError(e.message);
        setOverwrite(true);
        return;
      }
    } else {
      setPreviousOperand(currentOperand);
    }
    setOperator(op);
    setOverwrite(true);
  };

  const handleEqualsClick = () => {
    if (error || !operator || previousOperand === null) return;
    try {
      const result = calculate();
      const calculationString = `${previousOperand} ${operator} ${currentOperand} = ${result}`;
      setHistory(prevHistory => [calculationString, ...prevHistory].slice(0, 20));

      setCurrentOperand(result);
      setPreviousOperand(null);
      setOperator(null);
      setOverwrite(true);
    } catch (e: any) {
        setError(e.message);
        setOverwrite(true);
    }
  };

  const handleAllClearClick = () => {
    setCurrentOperand('0');
    setPreviousOperand(null);
    setOperator(null);
    setOverwrite(true);
    setError(null);
  };
  
  const handleClearEntryClick = () => {
    setCurrentOperand('0');
    setOverwrite(true);
    setError(null);
  };
  
  const handleDeleteClick = () => {
    if (error) {
        handleAllClearClick();
        return;
    }
    if (overwrite) {
        handleAllClearClick();
        return;
    }
    if (currentOperand.length === 1) {
        setCurrentOperand('0');
        setOverwrite(true);
    } else {
        setCurrentOperand(currentOperand.slice(0, -1));
    }
  };

  const handleToggleSignClick = () => {
    if (error) return;
    setCurrentOperand(String(parseFloat(currentOperand) * -1));
  };
  
  const handlePercentClick = () => {
    if (error) return;
    setCurrentOperand(String(parseFloat(currentOperand) / 100));
  };
  
  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleHistoryItemClick = (result: string) => {
    setError(null);
    setCurrentOperand(result);
    setOverwrite(true);
    setIsHistoryVisible(false);
  };
  
  const handleShiftClick = () => {
    setIsShiftActive(prev => !prev);
  };

  const handleAngleModeClick = () => {
    setAngleMode(prev => (prev === 'deg' ? 'rad' : 'deg'));
  };

  const handleMemoryClick = (operation: 'mc' | 'mr' | 'm+' | 'm-') => {
    if (error) return;

    if (operation === 'mc') {
      setMemory(0);
      return;
    }
    if (operation === 'mr') {
      setCurrentOperand(String(memory));
      setOverwrite(true);
      return;
    }

    const currentVal = parseFloat(currentOperand);
    if (isNaN(currentVal)) {
      setError('Invalid input');
      return;
    }
    
    if (operation === 'm+') {
      setMemory(prev => prev + currentVal);
    } else if (operation === 'm-') {
      setMemory(prev => prev - currentVal);
    }
    setOverwrite(true);
  };

  const handleConstantClick = (constant: 'PI' | 'E') => {
    if (error) {
      setError(null);
    }
    const value = constant === 'PI' ? Math.PI : Math.E;
    setCurrentOperand(String(value));
    setOverwrite(true);
  };

  type ScientificFunction = 
    | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' 
    | 'sqrt' | 'log' | 'ln' | 'x-squared' | 'x-cubed' 
    | 'cube-root' | 'factorial' | '10-pow-x' | 'e-pow-x';

  const handleScientificFunctionClick = (func: ScientificFunction) => {
    if (error) return;
    const value = parseFloat(currentOperand);
    if (isNaN(value)) {
        setError("Invalid input");
        setOverwrite(true);
        return;
    }

    let result: number;

    try {
        switch (func) {
            case 'sqrt':
                if (value < 0) throw new Error('Invalid input for sqrt');
                result = Math.sqrt(value);
                break;
            case 'log':
                if (value <= 0) throw new Error('Invalid input for log');
                result = Math.log10(value);
                break;
            case 'ln':
                if (value <= 0) throw new Error('Invalid input for ln');
                result = Math.log(value);
                break;
            case 'x-squared':
                result = Math.pow(value, 2);
                break;
            case 'x-cubed':
                result = Math.pow(value, 3);
                break;
            case 'cube-root':
                result = Math.cbrt(value);
                break;
            case '10-pow-x':
                result = Math.pow(10, value);
                break;
            case 'e-pow-x':
                result = Math.exp(value);
                break;
            case 'factorial':
                if (value < 0 || !Number.isInteger(value)) {
                    throw new Error('Invalid input for factorial');
                }
                if (value === 0) {
                    result = 1;
                } else {
                    result = 1;
                    for (let i = 2; i <= value; i++) {
                        result *= i;
                    }
                }
                break;
            case 'sin': case 'cos': case 'tan':
                const valueInRad = angleMode === 'deg' ? value * (Math.PI / 180) : value;
                if (func === 'sin') result = Math.sin(valueInRad);
                else if (func === 'cos') result = Math.cos(valueInRad);
                else { // tan
                    if (Math.abs(Math.cos(valueInRad)) < 1e-15) throw new Error('Invalid input for tan');
                    result = Math.tan(valueInRad);
                }
                break;
            case 'asin': case 'acos': case 'atan':
                if ((func === 'asin' || func === 'acos') && (value < -1 || value > 1)) {
                    throw new Error(`Invalid input for ${func}`);
                }
                let resultInRad: number;
                if (func === 'asin') resultInRad = Math.asin(value);
                else if (func === 'acos') resultInRad = Math.acos(value);
                else resultInRad = Math.atan(value); // atan
                result = angleMode === 'deg' ? resultInRad * (180 / Math.PI) : resultInRad;
                break;
        }

        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Calculation error');
        } else {
            setCurrentOperand(String(parseFloat(result.toPrecision(15))));
        }
    } catch(e: any) {
        setError(e.message);
    }
    
    setOverwrite(true);
  };
  
  // FIX: Add handlers for the converter mode
  const handleConverterNumberClick = (num: string) => {
    if (inputValue.includes('.') && num === '.') return;
    if (inputValue.length >= 16) return;

    if (inputValue === '0' && num !== '.') {
      setInputValue(num);
    } else {
      setInputValue(prev => prev + num);
    }
  };

  const handleConverterClear = () => {
    setInputValue('0');
  };

  const handleConverterBackspace = () => {
    if (inputValue.length === 1) {
      setInputValue('0');
    } else {
      setInputValue(prev => prev.slice(0, -1));
    }
  };

  const handleConverterTypeChange = (type: ConverterType) => {
    setConverterType(type);
    const newUnits = conversionData[type].units;
    setFromUnit(newUnits[0]);
    setToUnit(newUnits.length > 1 ? newUnits[1] : newUnits[0]);
    setInputValue('1');
  };

  const outputValue = useMemo(() => {
    const input = parseFloat(inputValue);
    if (isNaN(input) || inputValue.endsWith('.') || inputValue === '') return '...';
    if (fromUnit === toUnit) return inputValue;

    const data = conversionData[converterType];

    try {
      // Temperature Conversion
      if (converterType === 'temperature') {
        let tempInCelsius: number;
        if (fromUnit === 'Celsius') {
          tempInCelsius = input;
        } else if (fromUnit === 'Fahrenheit') {
          tempInCelsius = (input - 32) * 5 / 9;
        } else { // Kelvin
          tempInCelsius = input - 273.15;
        }

        let result: number;
        if (toUnit === 'Celsius') {
          result = tempInCelsius;
        } else if (toUnit === 'Fahrenheit') {
          result = (tempInCelsius * 9 / 5) + 32;
        } else { // Kelvin
          result = tempInCelsius + 273.15;
        }

        return String(parseFloat(result.toPrecision(12)));
      }

      // Factor/Rate based conversion
      if ('rates' in data || 'factors' in data) {
        const rates = 'rates' in data ? data.rates : data.factors;

        const fromRate = rates[fromUnit as keyof typeof rates];
        const toRate = rates[toUnit as keyof typeof rates];

        if (fromRate === undefined || toRate === undefined) return 'Error';

        const valueInBase = input / fromRate;
        const result = valueInBase * toRate;

        return String(parseFloat(result.toPrecision(12)));
      }

      return '...';
    } catch (e) {
      console.error("Conversion error:", e);
      return 'Error';
    }
  }, [inputValue, fromUnit, toUnit, converterType, conversionData]);

  const handleTabClick = (mode: 'normal' | 'scientific' | 'converter') => {
    setCalculatorMode(mode);
  };

  const displayOperation = `${previousOperand || ''} ${operator || ''}`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className={`w-full mx-auto bg-white dark:bg-black rounded-3xl shadow-lg p-4 sm:p-6 space-y-2 relative transition-all duration-300 ${
          calculatorMode === 'scientific' ? 'max-w-xl sm:max-w-2xl' : 
          calculatorMode === 'converter' ? 'max-w-xs sm:max-w-sm' : 
          'max-w-xs sm:max-w-md'
        }`}>
        {isHistoryVisible && (
          <HistoryDisplay
            history={history}
            onClear={handleClearHistory}
            onClose={() => setIsHistoryVisible(false)}
            onHistoryItemClick={handleHistoryItemClick}
          />
        )}

        <div className="h-8 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                <ThemeIcon theme={theme} />
              </button>
            </div>
            {calculatorMode !== 'converter' && (
              <button
                onClick={() => setIsHistoryVisible(true)}
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1"
                aria-label="View calculation history"
              >
                <HistoryIcon />
              </button>
            )}
        </div>
        
        {/* Mode Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          {(['normal', 'scientific', 'converter'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleTabClick(mode)}
              className={`flex-1 capitalize py-2 px-1 text-sm sm:text-base font-medium transition-colors ${
                calculatorMode === mode
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>


        {calculatorMode === 'converter' ? (
          <div className="space-y-4 pt-2">
            {/* Converter Type Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              {(Object.keys(conversionData) as ConverterType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleConverterTypeChange(type)}
                  className={`capitalize p-2 rounded-lg transition-colors ${
                    converterType === type 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {converterType === 'currency' && (
              <div className="text-center text-xs text-gray-400 dark:text-gray-500 h-4">
                {ratesStatus === 'loading' && 'Fetching latest rates...'}
                {ratesStatus === 'error' && 'Could not fetch latest rates. Using fallback data.'}
              </div>
            )}
            
            {/* From Input */}
            <div className="space-y-2">
              <UnitSelector
                label="From"
                value={fromUnit}
                options={conversionData[converterType].units}
                onChange={(e) => setFromUnit(e.target.value)}
                displayMap={converterType === 'currency' ? currencyDisplayMap : undefined}
              />
              <div className="text-3xl sm:text-4xl text-black dark:text-white font-medium p-2 text-right break-all">
                {inputValue}
              </div>
            </div>

            {/* To Input */}
            <div className="space-y-2">
               <UnitSelector
                label="To"
                value={toUnit}
                options={conversionData[converterType].units}
                onChange={(e) => setToUnit(e.target.value)}
                displayMap={converterType === 'currency' ? currencyDisplayMap : undefined}
              />
              <div className="text-3xl sm:text-4xl text-black dark:text-white font-medium p-2 text-right break-all min-h-[52px]">
                {outputValue}
              </div>
            </div>
            
            {/* Converter Numpad */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-2">
              <CalculatorButton variant="special" onClick={handleConverterClear}>C</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('7')}>7</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('8')}>8</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('9')}>9</CalculatorButton>
              <CalculatorButton variant="special" onClick={handleConverterBackspace}>⌫</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('4')}>4</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('5')}>5</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('6')}>6</CalculatorButton>
               <div></div>
              <CalculatorButton onClick={() => handleConverterNumberClick('1')}>1</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('2')}>2</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('3')}>3</CalculatorButton>
               <div></div>
              <CalculatorButton className="col-span-2" onClick={() => handleConverterNumberClick('0')}>0</CalculatorButton>
              <CalculatorButton onClick={() => handleConverterNumberClick('.')}>.</CalculatorButton>
            </div>
          </div>
        ) : (
          <>
            <CalculatorDisplay value={currentOperand} operation={displayOperation} memory={memory} error={error} />
            <div className={`grid ${calculatorMode === 'scientific' ? 'grid-cols-6' : 'grid-cols-4'} gap-2 sm:gap-3 pt-2`}>
              {calculatorMode === 'scientific' ? (
                <>
                  {/* Scientific Layout - 6 columns */}
                  <CalculatorButton variant="scientific" onClick={handleShiftClick}>{isShiftActive ? '1st' : '2nd'}</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={handleAngleModeClick}>{angleMode.toUpperCase()}</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleMemoryClick('mc')}>MC</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleMemoryClick('mr')}>MR</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleMemoryClick('m+')}>M+</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleMemoryClick('m-')}>M-</CalculatorButton>

                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick(isShiftActive ? 'x-cubed' : 'x-squared')}>{isShiftActive ? <>x<sup>3</sup></> : <>x<sup>2</sup></>}</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick(isShiftActive ? 'cube-root' : 'sqrt')}>{isShiftActive ? <>³√x</> : '√'}</CalculatorButton>
                  <CalculatorButton variant="special" onClick={handleAllClearClick}>AC</CalculatorButton>
                  <CalculatorButton variant="special" onClick={handleDeleteClick}>⌫</CalculatorButton>
                  <CalculatorButton variant="special" onClick={handlePercentClick}>%</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('/')}>÷</CalculatorButton>

                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick(isShiftActive ? 'e-pow-x' : 'ln')}>{isShiftActive ? <>e<sup>x</sup></> : 'ln'}</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick(isShiftActive ? '10-pow-x' : 'log')}>{isShiftActive ? <>10<sup>x</sup></> : 'log'}</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('7')}>7</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('8')}>8</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('9')}>9</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('*')}>×</CalculatorButton>

                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick(isShiftActive ? 'asin' : 'sin')}>{isShiftActive ? <>sin<sup>-1</sup></> : 'sin'}</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick(isShiftActive ? 'acos' : 'cos')}>{isShiftActive ? <>cos<sup>-1</sup></> : 'cos'}</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('4')}>4</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('5')}>5</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('6')}>6</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('-')}>-</CalculatorButton>

                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick(isShiftActive ? 'atan' : 'tan')}>{isShiftActive ? <>tan<sup>-1</sup></> : 'tan'}</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleScientificFunctionClick('factorial')}>x!</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('1')}>1</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('2')}>2</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('3')}>3</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('+')}>+</CalculatorButton>

                  <CalculatorButton variant="scientific" onClick={() => handleConstantClick('PI')}>π</CalculatorButton>
                  <CalculatorButton variant="scientific" onClick={() => handleConstantClick('E')}>e</CalculatorButton>
                  <CalculatorButton variant="special" onClick={handleToggleSignClick}>+/-</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('0')}>0</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('.')}>.</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={handleEqualsClick}>=</CalculatorButton>
                </>
              ) : (
                <>
                  {/* Normal Layout */}
                  <CalculatorButton variant="special" onClick={handleAllClearClick}>AC</CalculatorButton>
                  <CalculatorButton variant="special" onClick={handleClearEntryClick}>CE</CalculatorButton>
                  <CalculatorButton variant="special" onClick={handlePercentClick}>%</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('/')}>÷</CalculatorButton>
                  
                  <CalculatorButton onClick={() => handleNumberClick('7')}>7</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('8')}>8</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('9')}>9</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('*')}>×</CalculatorButton>

                  <CalculatorButton onClick={() => handleNumberClick('4')}>4</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('5')}>5</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('6')}>6</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('-')}>-</CalculatorButton>
                  
                  <CalculatorButton onClick={() => handleNumberClick('1')}>1</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('2')}>2</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('3')}>3</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={() => handleOperatorClick('+')}>+</CalculatorButton>

                  <CalculatorButton variant="special" onClick={handleToggleSignClick}>+/-</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('0')}>0</CalculatorButton>
                  <CalculatorButton onClick={() => handleNumberClick('.')}>.</CalculatorButton>
                  <CalculatorButton variant="operator" onClick={handleEqualsClick}>=</CalculatorButton>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;