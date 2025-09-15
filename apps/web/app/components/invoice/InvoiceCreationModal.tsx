'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as z from 'zod';
import { useLocale } from '@/app/lib/locale-provider';
import { formatCurrency } from '../../../lib/currency';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react';
import { invoiceApi, supplierApi, aresApi, type Supplier, type Customer, type CreateInvoiceRequest } from '../../lib/api';
import { CustomerSelector } from './CustomerSelector';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
  vatRate: z.number().min(0).max(100).optional(),
});

const invoiceSchema = z.object({
  customerId: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientIco: z.string().optional(),
  clientStreet: z.string().min(1, 'Client street is required'),
  clientCity: z.string().min(1, 'Client city is required'),
  clientZipCode: z.string().min(1, 'Client zip code is required'),
  clientCountry: z.string().min(1, 'Client country is required').default('Czech Republic'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  duzp: z.string().optional(),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  isReverseCharge: z.boolean().optional().default(false),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to calculate due date (14 days from issue date)
const calculateDueDate = (issueDate: string): string => {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
};

export function InvoiceCreationModal({ isOpen, onClose }: InvoiceCreationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [aresLoading, setAresLoading] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();

  const currentDate = new Date().toISOString().split('T')[0];
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientIco: '',
      clientStreet: '',
      clientCity: '',
      clientZipCode: '',
      clientCountry: 'Czech Republic',
      issueDate: currentDate,
      dueDate: calculateDueDate(currentDate), // 14 days from issue date
      duzp: currentDate, // Default to issue date
      description: '',
      items: [{ description: '', quantity: 1, unitPrice: 1, vatRate: 21 }],
      isReverseCharge: false,
    },
  });

  // Load supplier data to check VAT payer status
  useEffect(() => {
    const loadSupplier = async () => {
      try {
        const data = await supplierApi.get();
        setSupplier(data);
        
        // If supplier is non-VAT payer, reset VAT rates to 0
        if (data.isNonVatPayer) {
          const items = form.getValues('items');
          const updatedItems = items.map(item => ({ ...item, vatRate: 0 }));
          form.setValue('items', updatedItems);
        }
      } catch (err) {
        console.warn('Could not load supplier data:', err);
        setSupplier(null);
      }
    };

    if (isOpen) {
      loadSupplier();
    }
  }, [isOpen, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedIssueDate = form.watch('issueDate');
  const watchedReverseCharge = form.watch('isReverseCharge');

  // Auto-recalculate due date when issue date changes
  useEffect(() => {
    if (watchedIssueDate) {
      const newDueDate = calculateDueDate(watchedIssueDate);
      // Only update if current due date is auto-calculated (14 days from current issue date)
      // This preserves manual edits
      const currentDueDate = form.getValues('dueDate');
      const expectedDueDate = calculateDueDate(form.getValues('issueDate'));
      
      // If current due date matches the expected auto-calculated value, update it
      if (currentDueDate === expectedDueDate || !currentDueDate) {
        form.setValue('dueDate', newDueDate);
      }
    }
  }, [watchedIssueDate, form]);

  // Calculate totals
  const calculateLineTotal = (quantity: number, unitPrice: number) => {
    return (quantity || 0) * (unitPrice || 0);
  };

  const calculateSubtotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + calculateLineTotal(item.quantity || 0, item.unitPrice || 0);
    }, 0);
  };

  const calculateVatAmount = () => {
    if (watchedReverseCharge) return 0; // No VAT calculation for reverse charge
    return watchedItems.reduce((total, item) => {
      const lineTotal = calculateLineTotal(item.quantity || 0, item.unitPrice || 0);
      const vatRate = item.vatRate || 0;
      return total + (lineTotal * vatRate / 100);
    }, 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateVatAmount();
  };

  // Customer selection handler
  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    
    if (customer) {
      // Auto-populate form fields with customer data
      setIsManualEntry(false);
      form.setValue('customerId', customer.id);
      form.setValue('clientName', customer.name);
      form.setValue('clientStreet', customer.street);
      form.setValue('clientCity', customer.city);
      form.setValue('clientZipCode', customer.zipCode);
      form.setValue('clientCountry', customer.country);
      form.setValue('clientIco', customer.ico || '');
      
      // Clear any ARES errors since we're using customer data
      setAresError(null);
    } else {
      // Manual entry - clear customer data and enable manual input
      setIsManualEntry(true);
      form.setValue('customerId', '');
      // Don't clear the form fields to allow manual entry
    }
  };

  // ARES lookup function
  const handleClientAresLookup = async (ico: string) => {
    if (!ico || ico.length !== 8 || !/^\d{8}$/.test(ico)) {
      return;
    }

    try {
      setAresLoading(true);
      setAresError(null);
      
      const aresData = await aresApi.lookup(ico);
      
      // Update form with ARES data
      form.setValue('clientName', aresData.name, { shouldValidate: true });
      form.setValue('clientStreet', aresData.address.street, { shouldValidate: true });
      form.setValue('clientCity', aresData.address.city, { shouldValidate: true });
      form.setValue('clientZipCode', aresData.address.zipCode, { shouldValidate: true });
      form.setValue('clientCountry', aresData.address.country, { shouldValidate: true });
      
    } catch (err: unknown) {
      console.error('ARES lookup error:', err);
      const errorMessage = err instanceof Error && 'response' in err && 
        err.response && typeof err.response === 'object' && 'data' in err.response && 
        err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data
        ? String(err.response.data.message)
        : t('ares.lookupFailed');
      setAresError(errorMessage);
    } finally {
      setAresLoading(false);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      // Create invoice via API
      const createInvoiceData: CreateInvoiceRequest = {
        clientName: data.clientName,
        clientStreet: data.clientStreet,
        clientCity: data.clientCity,
        clientZipCode: data.clientZipCode,
        clientCountry: data.clientCountry,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        duzp: data.duzp,
        description: data.description,
        items: data.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: data.isReverseCharge ? 0 : item.vatRate, // Set VAT rate to 0 for reverse charge
        })),
      };
      
      // Add customerId if a customer is selected
      if (data.customerId) {
        createInvoiceData.customerId = data.customerId;
      }
      
      const createdInvoice = await invoiceApi.create(createInvoiceData);
      
      console.log('Invoice created successfully:', createdInvoice);
      
      console.log('✅ Faktúra úspěšne vytvorená:', createdInvoice);
      
      // Reset form and close modal
      form.reset();
      onClose();
      
      // Redirect to invoice view page
      console.log('➡️ Přesměrovávám na:', `/invoices/${createdInvoice.id}`);
      router.push(`/invoices/${createdInvoice.id}`);
      
    } catch (error: unknown) {
      console.error('Error creating invoice:', error);
      
      // Handle supplier profile not found error
      if (error instanceof Error && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 400 && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data && error.response.data.error === 'Supplier profile not found. Please complete your profile first.') {
        const shouldGoToSettings = confirm(
          'You need to complete your company profile before creating invoices.\n\nWould you like to go to Settings now?'
        );
        if (shouldGoToSettings) {
          router.push('/settings');
          onClose();
          return;
        }
      } else if (error instanceof Error && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        alert(`Error creating invoice: ${error.response.data.error}`);
      } else if (error instanceof Error) {
        alert(`Error creating invoice: ${error.message}`);
      } else {
        alert('Error creating invoice. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    const defaultVatRate = supplier?.isNonVatPayer || watchedReverseCharge ? 0 : 21;
    append({ description: '', quantity: 1, unitPrice: 1, vatRate: defaultVatRate });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('invoice.createNewInvoice')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('invoice.clientInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <div>
                <Label>Select Customer</Label>
                <CustomerSelector
                  selectedCustomerId={selectedCustomer?.id}
                  onCustomerSelect={handleCustomerSelect}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="clientName">{t('invoice.clientName')} *</Label>
                <Input
                  id="clientName"
                  {...form.register('clientName')}
                  placeholder={t('invoice.placeholders.clientName')}
                  disabled={!isManualEntry && !!selectedCustomer}
                />
                {form.formState.errors.clientName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.clientName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="clientIco">IČO klienta</Label>
                <div className="relative">
                  <Input
                    id="clientIco"
                    {...form.register('clientIco')}
                    placeholder="12345678"
                    disabled={!isManualEntry && !!selectedCustomer}
                    onBlur={(e) => {
                      if (isManualEntry || !selectedCustomer) {
                        handleClientAresLookup(e.target.value);
                      }
                    }}
                  />
                  {aresLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
                {aresError && (
                  <p className="text-sm text-red-600 mt-1">{aresError}</p>
                )}
                {form.formState.errors.clientIco && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.clientIco.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="clientStreet">{t('invoice.clientStreet')} *</Label>
                <Input
                  id="clientStreet"
                  {...form.register('clientStreet')}
                  placeholder={t('invoice.placeholders.clientStreet')}
                  disabled={!isManualEntry && !!selectedCustomer}
                />
                {form.formState.errors.clientStreet && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.clientStreet.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientCity">{t('invoice.clientCity')} *</Label>
                  <Input
                    id="clientCity"
                    {...form.register('clientCity')}
                    placeholder={t('invoice.placeholders.clientCity')}
                    disabled={!isManualEntry && !!selectedCustomer}
                  />
                  {form.formState.errors.clientCity && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.clientCity.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="clientZipCode">{t('invoice.clientZipCode')} *</Label>
                  <Input
                    id="clientZipCode"
                    {...form.register('clientZipCode')}
                    placeholder={t('invoice.placeholders.clientZipCode')}
                    disabled={!isManualEntry && !!selectedCustomer}
                  />
                  {form.formState.errors.clientZipCode && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.clientZipCode.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="clientCountry">{t('invoice.clientCountry')} *</Label>
                <Input
                  id="clientCountry"
                  {...form.register('clientCountry')}
                  placeholder={t('invoice.placeholders.clientCountry')}
                  disabled={!isManualEntry && !!selectedCustomer}
                />
                {form.formState.errors.clientCountry && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.clientCountry.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Dates and Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('invoice.invoiceDates')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="issueDate">{t('invoice.issueDate')} *</Label>
                  <div className="relative">
                    <Input
                      id="issueDate"
                      type="date"
                      {...form.register('issueDate')}
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {form.formState.errors.issueDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.issueDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dueDate">{t('invoice.dueDate')} *</Label>
                  <div className="relative">
                    <Input
                      id="dueDate"
                      type="date"
                      {...form.register('dueDate')}
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {form.formState.errors.dueDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.dueDate.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* DUZP field - only show for VAT payers */}
              {!supplier?.isNonVatPayer && (
                <div className="mt-4">
                  <Label htmlFor="duzp">DUZP (Datum uskutečnění zdanitelného plnění)</Label>
                  <div className="relative">
                    <Input
                      id="duzp"
                      type="date"
                      {...form.register('duzp')}
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  {form.formState.errors.duzp && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.duzp.message}
                    </p>
                  )}
                </div>
              )}
              
              {/* Reverse Charge Option - only show for VAT payers */}
              {!supplier?.isNonVatPayer && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isReverseCharge"
                      checked={watchedReverseCharge}
                      onCheckedChange={(checked) => {
                        form.setValue('isReverseCharge', !!checked);
                        // Reset VAT rates to 0 when enabling reverse charge
                        if (checked) {
                          const items = form.getValues('items');
                          const updatedItems = items.map(item => ({ ...item, vatRate: 0 }));
                          form.setValue('items', updatedItems);
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="isReverseCharge"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Přenesená daňová povinnost (Reverse Charge)
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Pro specifické druhy služeb a zboží (např. stavebnictví)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popis</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="description">Popis faktury (nepovinné)</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Popište služby nebo zboží..."
                  rows={3}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{t('invoice.lineItems')}</CardTitle>
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('invoice.addItem')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">{t('invoice.item')} {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeItem(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className={supplier?.isNonVatPayer || watchedReverseCharge ? "md:col-span-7" : "md:col-span-6"}>
                        <Label htmlFor={`items.${index}.description`}>{t('invoice.description')} *</Label>
                        <Input
                          {...form.register(`items.${index}.description`)}
                          placeholder={t('invoice.placeholders.description')}
                        />
                        {form.formState.errors.items?.[index]?.description && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.items[index]?.description?.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor={`items.${index}.quantity`}>{t('invoice.quantity')} *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                          placeholder="1.00"
                        />
                        {form.formState.errors.items?.[index]?.quantity && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor={`items.${index}.unitPrice`}>{t('invoice.unitPrice')} *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                        {form.formState.errors.items?.[index]?.unitPrice && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.items[index]?.unitPrice?.message}
                          </p>
                        )}
                      </div>

                      {!supplier?.isNonVatPayer && !watchedReverseCharge && (
                        <div className="md:col-span-1">
                          <Label htmlFor={`items.${index}.vatRate`}>{t('invoice.vatRate')} (%)</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...form.register(`items.${index}.vatRate`, { valueAsNumber: true })}
                            disabled={watchedReverseCharge}
                          >
                            <option value={0}>0%</option>
                            <option value={12}>12%</option>
                            <option value={15}>15%</option>
                            <option value={21}>21%</option>
                          </select>
                          {form.formState.errors.items?.[index]?.vatRate && (
                            <p className="text-sm text-red-600 mt-1">
                              {form.formState.errors.items[index]?.vatRate?.message}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="md:col-span-1">
                        <Label>{t('invoice.lineTotal')}</Label>
                        <div className="p-2 bg-gray-50 rounded border text-right font-medium">
                          {formatCurrency({
                            locale,
                            amount: calculateLineTotal(
                              watchedItems[index]?.quantity || 0,
                              watchedItems[index]?.unitPrice || 0
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {form.formState.errors.items?.root && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.items.root.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span>{t('invoice.subtotal')}:</span>
                    <span>{formatCurrency({ locale, amount: calculateSubtotal() })}</span>
                  </div>
                  {!supplier?.isNonVatPayer && !watchedReverseCharge && (
                    <div className="flex justify-between items-center py-1">
                      <span>{t('invoice.vatAmount')}:</span>
                      <span>{formatCurrency({ locale, amount: calculateVatAmount() })}</span>
                    </div>
                  )}
                  {watchedReverseCharge && (
                    <div className="flex justify-between items-center py-1 text-sm text-orange-600">
                      <span>Přenesená daňová povinnost</span>
                      <span>Daň odvede zákazník</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-t font-bold text-lg">
                    <span>{t('invoice.total')}:</span>
                    <span>{formatCurrency({ locale, amount: calculateGrandTotal() })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('invoice.creating') : t('invoice.createInvoice')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}