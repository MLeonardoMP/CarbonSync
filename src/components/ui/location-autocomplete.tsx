import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Anchor, Building2, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchLocations, type Location } from '@/lib/locations-data';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const getLocationIcon = (type: Location['type']) => {
  switch (type) {
    case 'port':
      return <Anchor className="h-3 w-3" />;
    case 'airport':
      return <Plane className="h-3 w-3" />;
    case 'warehouse':
    case 'logistics_hub':
      return <Building2 className="h-3 w-3" />;
    default:
      return <MapPin className="h-3 w-3" />;
  }
};

const getLocationTypeLabel = (type: Location['type']) => {
  switch (type) {
    case 'port':
      return 'Port';
    case 'city':
      return 'City';
    case 'airport':
      return 'Airport';
    case 'warehouse':
      return 'Warehouse';
    case 'logistics_hub':
      return 'Hub';
    default:
      return 'Location';
  }
};

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter location",
  className,
  disabled = false
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Search for suggestions when value changes
  useEffect(() => {
    if (value.length >= 2) {
      const results = searchLocations(value, 8);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSuggestionClick = (location: Location) => {
    onChange(location.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "pr-8", // Add padding for dropdown icon
            className
          )}
          autoComplete="off"
        />
        <ChevronDown 
          className={cn(
            "absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((location, index) => (
            <div
              key={`${location.name}-${location.country}-${index}`}
              ref={el => { suggestionRefs.current[index] = el; }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                highlightedIndex === index && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSuggestionClick(location)}
            >
              <div className="flex-shrink-0 text-muted-foreground">
                {getLocationIcon(location.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {location.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {getLocationTypeLabel(location.type)} • {location.country}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                  location.type === 'port' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                  location.type === 'city' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                  location.type === 'airport' && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
                  (location.type === 'warehouse' || location.type === 'logistics_hub') && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                )}>
                  {getLocationTypeLabel(location.type)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
