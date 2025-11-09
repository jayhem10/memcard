'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Console {
  id: string;
  name: string;
}

interface ConsoleFilterProps {
  consoles: Console[];
  selectedConsoleId: string;
  onSelect: (consoleId: string) => void;
}

export function ConsoleFilter({ consoles, selectedConsoleId, onSelect }: ConsoleFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedConsole = consoles.find(c => c.id === selectedConsoleId);

  // Toujours afficher le filtre, même s'il n'y a pas de consoles
  // Si aucune console, on affiche juste "Toutes les consoles"
  const hasConsoles = consoles && consoles.length > 0;

  // Filtrer les consoles manuellement
  const filteredConsoles = useMemo(() => {
    if (!searchValue.trim() || !hasConsoles) return consoles;
    const searchLower = searchValue.toLowerCase();
    return consoles.filter(console => 
      console.name.toLowerCase().includes(searchLower)
    );
  }, [consoles, searchValue, hasConsoles]);

  return (
    <Popover 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setSearchValue('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[250px] justify-between"
        >
          <span className="truncate">
            {selectedConsoleId === 'all' 
              ? 'Toutes les consoles' 
              : selectedConsole?.name || 'Sélectionner une console'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Rechercher une console..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>Aucune console trouvée.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={(value) => {
                  onSelect('all');
                  setOpen(false);
                  setSearchValue('');
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect('all');
                  setOpen(false);
                  setSearchValue('');
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedConsoleId === 'all' ? "opacity-100" : "opacity-0"
                  )}
                />
                Toutes les consoles
              </CommandItem>
              {filteredConsoles.map((consoleItem) => (
                <CommandItem
                  key={consoleItem.id}
                  value={consoleItem.name}
                  onSelect={(value) => {
                    onSelect(consoleItem.id);
                    setOpen(false);
                    setSearchValue('');
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(consoleItem.id);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedConsoleId === consoleItem.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {consoleItem.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

