import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export type Currency = 'GEL' | 'USD';

interface CurrencyToggleProps {
  onCurrencyChange: (currency: Currency) => void;
}

export function CurrencyToggle({ onCurrencyChange }: CurrencyToggleProps) {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('GEL');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && ['GEL', 'USD'].includes(savedCurrency)) {
      setCurrentCurrency(savedCurrency);
      onCurrencyChange(savedCurrency);
    }
  }, [onCurrencyChange]);

  const handleCurrencyChange = (currency: Currency) => {
    setCurrentCurrency(currency);
    localStorage.setItem('currency', currency);
    onCurrencyChange(currency);
  };

  return (
    <div className="flex items-center bg-muted rounded-md p-1" data-testid="currency-toggle">
      <Button
        variant={currentCurrency === 'GEL' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleCurrencyChange('GEL')}
        className="px-3 py-1 text-sm rounded transition-colors"
        data-testid="button-currency-gel"
      >
        GEL
      </Button>
      <Button
        variant={currentCurrency === 'USD' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleCurrencyChange('USD')}
        className="px-3 py-1 text-sm rounded transition-colors"
        data-testid="button-currency-usd"
      >
        USD
      </Button>
    </div>
  );
}
