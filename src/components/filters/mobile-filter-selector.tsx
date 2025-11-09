'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface MobileFilterSelectorProps {
  label: string;
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function MobileFilterSelector({
  label,
  options,
  selectedId,
  onSelect,
  placeholder = 'Sélectionner...',
  className,
}: MobileFilterSelectorProps) {
  // Filtrer et trier les options :
  // - "Tous" reste en premier
  // - Ensuite trier par nombre de jeux décroissant
  // - Ne garder que les options avec au moins 1 jeu (sauf "Tous")
  const sortedOptions = React.useMemo(() => {
    const allOption = options.find(opt => opt.id === 'all');
    const otherOptions = options
      .filter(opt => opt.id !== 'all' && (opt.count !== undefined && opt.count > 0))
      .sort((a, b) => {
        // Trier par nombre de jeux décroissant
        const countA = a.count || 0;
        const countB = b.count || 0;
        if (countB !== countA) {
          return countB - countA;
        }
        // En cas d'égalité, trier par ordre alphabétique
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      });
    
    return allOption ? [allOption, ...otherOptions] : otherOptions;
  }, [options]);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium">{label}</label>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {sortedOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}{option.count !== undefined ? ` (${option.count})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

