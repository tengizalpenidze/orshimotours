import { useState } from "react";
import { useLanguage, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe } from "lucide-react";

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, changeLanguage, t } = useLanguage();

  const languages = [
    { code: 'en' as Language, label: 'EN' },
    { code: 'ru' as Language, label: 'RU' },
    { code: 'ge' as Language, label: 'GE' },
  ];

  const handleLanguageChange = (language: Language) => {
    changeLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className="relative" data-testid="language-switcher">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 h-10"
        data-testid="button-language-toggle"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span data-testid="text-current-language">{currentLanguage.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-md shadow-lg min-w-24 z-10" data-testid="dropdown-language-options">
          {languages.map((language) => (
            <button
              key={language.code}
              className="w-full px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
              onClick={() => handleLanguageChange(language.code)}
              data-testid={`button-language-${language.code}`}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
