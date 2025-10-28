'use client';

import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClearButton?: boolean;
  searchIcon?: boolean;
  clearButtonPosition?: 'right' | 'inside';
  hasActionButton?: boolean; // Indique s'il y a un bouton d'action à droite
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ 
    className, 
    onClear, 
    showClearButton = true, 
    searchIcon = true,
    clearButtonPosition = 'right',
    hasActionButton = false,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '');
    const currentValue = value !== undefined ? value : internalValue;
    const hasValue = currentValue && currentValue.toString().trim() !== '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (value === undefined) {
        setInternalValue('');
      }
      onClear?.();
    };

    const getPaddingClasses = () => {
      const leftPadding = searchIcon ? 'pl-10' : 'pl-4';
      
      if (hasActionButton) {
        // Si il y a un bouton d'action (comme "Rechercher"), on laisse plus d'espace
        if (showClearButton && hasValue) {
          return `${leftPadding} pr-28`; // Plus d'espace pour le bouton clear + action
        }
        return `${leftPadding} pr-24`; // Espace pour le bouton d'action
      } else {
        // Si pas de bouton d'action, padding normal
        if (showClearButton && hasValue) {
          return clearButtonPosition === 'right' ? `${leftPadding} pr-20` : `${leftPadding} pr-10`;
        }
        return `${leftPadding} pr-4`;
      }
    };

    return (
      <div className="relative">
        {searchIcon && (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        
        <Input
          ref={ref}
          className={cn(getPaddingClasses(), className)}
          value={currentValue}
          onChange={handleChange}
          {...props}
        />
        
        {showClearButton && hasValue && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted z-10",
              hasActionButton ? 'right-28' : 'right-3' // Position différente selon le contexte
            )}
            onClick={handleClear}
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
