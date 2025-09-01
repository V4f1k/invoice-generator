'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerFormData } from '@/app/lib/schemas';
import { customerApi, aresApi, type Customer, type AresResponse } from '@/app/lib/api';
import { useAuthStore } from '@/app/lib/auth-store';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string>('');
  const [isAresLoading, setIsAresLoading] = useState(false);
  const [aresError, setAresError] = useState<string>('');
  
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      street: '',
      city: '',
      zipCode: '',
      country: 'Czech Republic',
      ico: '',
      dic: '',
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Load customers
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerApi.list();
      setCustomers(data);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
    }
  }, [isAuthenticated]);

  // Handle form submission for both create and edit
  const onSubmit = async (data: CustomerFormData) => {
    try {
      setError('');
      
      if (editingCustomer) {
        // Edit mode
        await customerApi.update(editingCustomer.id, data);
        setIsEditModalOpen(false);
        setEditingCustomer(null);
      } else {
        // Create mode
        await customerApi.create(data);
        setIsCreateModalOpen(false);
      }
      
      // Reload customers list
      await loadCustomers();
      
      // Reset form
      form.reset();
    } catch (err) {
      setError('Failed to save customer');
      console.error('Error saving customer:', err);
    }
  };

  // Handle delete
  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) {
      return;
    }
    
    try {
      setError('');
      await customerApi.delete(customer.id);
      await loadCustomers();
    } catch (err) {
      setError('Failed to delete customer');
      console.error('Error deleting customer:', err);
    }
  };

  // Handle edit
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      street: customer.street,
      city: customer.city,
      zipCode: customer.zipCode,
      country: customer.country,
      ico: customer.ico || '',
      dic: customer.dic || '',
    });
    setIsEditModalOpen(true);
  };

  // ARES lookup handler
  const handleAresLookup = async (ico: string) => {
    // Only lookup if ICO is 8 digits
    if (!/^\d{8}$/.test(ico)) {
      return;
    }

    try {
      setIsAresLoading(true);
      setAresError('');
      
      const aresData: AresResponse = await aresApi.lookup(ico);
      
      // Auto-fill form fields with ARES data
      form.setValue('name', aresData.name);
      form.setValue('street', aresData.address.street);
      form.setValue('city', aresData.address.city);
      form.setValue('zipCode', aresData.address.zipCode);
      form.setValue('country', aresData.address.country);
      
      // Also set DIC if available
      if (aresData.dic) {
        form.setValue('dic', aresData.dic);
      }
      
    } catch (err: unknown) {
      console.error('ARES lookup error:', err);
      
      // Set user-friendly error message
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 404) {
        setAresError('Company with this IČO was not found in ARES registry');
      } else if (error.response?.status === 400) {
        setAresError(error.response.data?.message || 'Invalid IČO or inactive company');
      } else {
        setAresError('Failed to fetch company information from ARES');
      }
    } finally {
      setIsAresLoading(false);
    }
  };

  // Reset form when modals close
  const handleCreateClose = () => {
    setIsCreateModalOpen(false);
    form.reset();
    setError('');
    setAresError('');
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    form.reset();
    setError('');
    setAresError('');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header with navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Customers</h1>
              <p className="text-muted-foreground">Manage your customer address book</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
              size="lg"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Customers table */}
        <div className="bg-card rounded-lg border">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No customers yet</p>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add your first customer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>IČO</TableHead>
                  <TableHead>DIČ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      {customer.street}, {customer.city} {customer.zipCode}
                      {customer.country !== 'Czech Republic' && `, ${customer.country}`}
                    </TableCell>
                    <TableCell>{customer.ico || '-'}</TableCell>
                    <TableCell>{customer.dic || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Create Customer Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={handleCreateClose}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Enter customer name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="street">Street *</Label>
                  <Input
                    id="street"
                    {...form.register('street')}
                    placeholder="Enter street address"
                  />
                  {form.formState.errors.street && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.street.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...form.register('city')}
                      placeholder="Enter city"
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="zipCode">Zip Code *</Label>
                    <Input
                      id="zipCode"
                      {...form.register('zipCode')}
                      placeholder="Enter zip code"
                    />
                    {form.formState.errors.zipCode && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.zipCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    {...form.register('country')}
                    placeholder="Enter country"
                  />
                  {form.formState.errors.country && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.country.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ico">IČO</Label>
                    <div className="relative">
                      <Input
                        id="ico"
                        {...form.register('ico')}
                        placeholder="Enter IČO"
                        onBlur={(e) => handleAresLookup(e.target.value)}
                        disabled={isAresLoading}
                      />
                      {isAresLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    {form.formState.errors.ico && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.ico.message}
                      </p>
                    )}
                    {aresError && (
                      <p className="text-sm text-destructive mt-1">
                        {aresError}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dic">DIČ</Label>
                    <Input
                      id="dic"
                      {...form.register('dic')}
                      placeholder="Enter DIČ"
                    />
                    {form.formState.errors.dic && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.dic.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCreateClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Customer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={handleEditClose}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-name">Customer Name *</Label>
                  <Input
                    id="edit-name"
                    {...form.register('name')}
                    placeholder="Enter customer name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="edit-street">Street *</Label>
                  <Input
                    id="edit-street"
                    {...form.register('street')}
                    placeholder="Enter street address"
                  />
                  {form.formState.errors.street && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.street.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-city">City *</Label>
                    <Input
                      id="edit-city"
                      {...form.register('city')}
                      placeholder="Enter city"
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-zipCode">Zip Code *</Label>
                    <Input
                      id="edit-zipCode"
                      {...form.register('zipCode')}
                      placeholder="Enter zip code"
                    />
                    {form.formState.errors.zipCode && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.zipCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-country">Country *</Label>
                  <Input
                    id="edit-country"
                    {...form.register('country')}
                    placeholder="Enter country"
                  />
                  {form.formState.errors.country && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.country.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-ico">IČO</Label>
                    <div className="relative">
                      <Input
                        id="edit-ico"
                        {...form.register('ico')}
                        placeholder="Enter IČO"
                        onBlur={(e) => handleAresLookup(e.target.value)}
                        disabled={isAresLoading}
                      />
                      {isAresLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </div>
                    {form.formState.errors.ico && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.ico.message}
                      </p>
                    )}
                    {aresError && (
                      <p className="text-sm text-destructive mt-1">
                        {aresError}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="edit-dic">DIČ</Label>
                    <Input
                      id="edit-dic"
                      {...form.register('dic')}
                      placeholder="Enter DIČ"
                    />
                    {form.formState.errors.dic && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.dic.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleEditClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Updating...' : 'Update Customer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}