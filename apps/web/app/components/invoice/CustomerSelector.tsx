'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { customerApi, type Customer } from '@/app/lib/api';

interface CustomerSelectorProps {
  selectedCustomerId?: string;
  onCustomerSelect: (customer: Customer | null) => void;
  disabled?: boolean;
}

export function CustomerSelector({
  selectedCustomerId,
  onCustomerSelect,
  disabled,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await customerApi.list();
        setCustomers(data);
      } catch (err) {
        console.error('Error loading customers:', err);
        setError('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const handleSelect = (customer: Customer | null) => {
    onCustomerSelect(customer);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedCustomer ? (
              <span className="truncate">{selectedCustomer.name}</span>
            ) : (
              "Select customer..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0">
          <DialogTitle className="sr-only">Select Customer</DialogTitle>
          <DialogDescription className="sr-only">
            Choose an existing customer or select manual entry for a one-off client
          </DialogDescription>
          <Command>
            <CommandInput 
              placeholder="Search customers..." 
              disabled={loading}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading customers..." : "No customers found."}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={() => handleSelect(null)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enter manually (one-off client)
                </CommandItem>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => handleSelect(customer)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {customer.street}, {customer.city}
                        {customer.ico && ` • IČO: ${customer.ico}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}