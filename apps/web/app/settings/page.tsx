'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
import { LanguageSwitcher } from '@/app/components/ui/language-switcher';
import { supplierApi, aresApi } from '@/app/lib/api';
import { supplierSchema, type SupplierFormData } from '@/app/lib/schemas';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [aresLoading, setAresLoading] = useState(false);
  const [aresError, setAresError] = useState<string | null>(null);
  const [isRegistryEditMode, setIsRegistryEditMode] = useState(false);
  const [automaticLegalText, setAutomaticLegalText] = useState<string>('');
  const t = useTranslations();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      street: '',
      city: '',
      zipCode: '',
      country: 'Czech Republic',
      ico: '',
      dic: '',
      bankAccount: '',
      isNonVatPayer: false,
      registrationType: '',
      registrationCourt: '',
      registrationFileNumber: '',
      automaticLegalText: '',
    },
  });

  // Load existing supplier data
  useEffect(() => {
    const loadSupplier = async () => {
      try {
        setLoading(true);
        const data = await supplierApi.get();
        form.reset({
          name: data.name,
          street: data.street,
          city: data.city,
          zipCode: data.zipCode,
          country: data.country,
          ico: data.ico || '',
          dic: data.dic || '',
          bankAccount: data.bankAccount || '',
          isNonVatPayer: data.isNonVatPayer || false,
          registrationType: data.registrationType || '',
          registrationCourt: data.registrationCourt || '',
          registrationFileNumber: data.registrationFileNumber || '',
          automaticLegalText: data.automaticLegalText || '',
        });
        setAutomaticLegalText(data.automaticLegalText || '');
        setError(null);
      } catch (err: unknown) {
        if (err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 404) {
          // No supplier info exists yet, that's fine
          setError(null);
        } else {
          setError('Failed to load supplier information');
          console.error('Error loading supplier:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSupplier();
  }, [form]);

  // ARES lookup function
  const handleAresLookup = async (ico: string) => {
    if (!ico || ico.length !== 8 || !/^\d{8}$/.test(ico)) {
      // Clear ARES-populated fields when ICO is invalid/empty
      form.setValue('name', '', { shouldValidate: true });
      form.setValue('street', '', { shouldValidate: true });
      form.setValue('city', '', { shouldValidate: true });
      form.setValue('zipCode', '', { shouldValidate: true });
      form.setValue('country', 'Czech Republic', { shouldValidate: true });
      form.setValue('dic', '', { shouldValidate: true });
      form.setValue('registrationType', '', { shouldValidate: true });
      form.setValue('registrationCourt', '', { shouldValidate: true });
      form.setValue('registrationFileNumber', '', { shouldValidate: true });
      setAutomaticLegalText('');
      return;
    }

    try {
      setAresLoading(true);
      setAresError(null);
      
      const aresData = await aresApi.lookup(ico);
      
      // Reset and update form with ARES data
      form.setValue('name', aresData.name, { shouldValidate: true });
      form.setValue('street', aresData.address.street, { shouldValidate: true });
      form.setValue('city', aresData.address.city, { shouldValidate: true });
      form.setValue('zipCode', aresData.address.zipCode, { shouldValidate: true });
      form.setValue('country', aresData.address.country, { shouldValidate: true });
      
      // Update DIC
      if (aresData.dic) {
        form.setValue('dic', aresData.dic, { shouldValidate: true });
      }
      
      // Update registration info (read-only fields will be disabled)
      form.setValue('registrationType', aresData.registration.registrationType, { shouldValidate: true });
      form.setValue('registrationCourt', aresData.registration.registrationCourt || '', { shouldValidate: true });
      form.setValue('registrationFileNumber', aresData.registration.registrationFileNumber || '', { shouldValidate: true });
      
      // Set automatic legal text and exit edit mode
      setAutomaticLegalText(aresData.registration.automaticLegalText || '');
      form.setValue('automaticLegalText', aresData.registration.automaticLegalText || '', { shouldValidate: true });
      setIsRegistryEditMode(false);
      
    } catch (err: any) {
      console.error('ARES lookup error:', err);
      setAresError(
        err.response?.data?.message || 
        t('ares.lookupFailed')
      );
      
      // Clear fields on error
      form.setValue('name', '', { shouldValidate: true });
      form.setValue('street', '', { shouldValidate: true });
      form.setValue('city', '', { shouldValidate: true });
      form.setValue('zipCode', '', { shouldValidate: true });
      form.setValue('country', 'Czech Republic', { shouldValidate: true });
      form.setValue('dic', '', { shouldValidate: true });
      form.setValue('registrationType', '', { shouldValidate: true });
      form.setValue('registrationCourt', '', { shouldValidate: true });
      form.setValue('registrationFileNumber', '', { shouldValidate: true });
      setAutomaticLegalText('');
    } finally {
      setAresLoading(false);
    }
  };

  const onSubmit = async (data: SupplierFormData) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await supplierApi.update(data);
      setSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data ? String(err.response.data.error) : 'Failed to save supplier information');
      console.error('Error saving supplier:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">{t('common.loading')}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </Link>
        <span className="text-muted-foreground">•</span>
        <Link href="/customers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Customers
        </Link>
      </div>
      {/* Language Settings Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('settings.languageSettings')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.selectLanguage')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('settings.selectLanguage')}</label>
              <div className="mt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('settings.companySettings')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('settings.companyDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.companyName')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('settings.placeholders.companyName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('settings.address')} *</h3>
                
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.street')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('settings.placeholders.street')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.city')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('settings.placeholders.city')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('settings.zipCode')} *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('settings.placeholders.zipCode')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.country')} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('settings.placeholders.country')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isNonVatPayer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {t('settings.isNonVatPayer')}
                      </FormLabel>
                      <FormDescription>
                        {t('settings.isNonVatPayerDescription')}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IČO</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder={t('settings.placeholders.ico')} 
                            {...field}
                            onBlur={(e) => {
                              field.onBlur();
                              handleAresLookup(e.target.value);
                            }}
                          />
                          {aresLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {aresError && (
                        <p className="text-sm text-destructive">{aresError}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DIČ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('settings.placeholders.dic')}
                          disabled={form.watch('isNonVatPayer')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.bankAccount')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('settings.placeholders.bankAccount')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Registration Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Údaj o zápisu v rejstříku</h3>
                
                {/* Primary view: Automatic legal text with Edit button */}
                <div className="space-y-2">
                  <FormLabel>Právní text</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      value={automaticLegalText || 'Údaje budou doplněny automaticky po zadání IČO'}
                      readOnly
                      className="flex-1 bg-gray-50"
                      placeholder="Údaje budou doplněny automaticky po zadání IČO"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRegistryEditMode(true)}
                      className="shrink-0"
                    >
                      Upravit
                    </Button>
                  </div>
                  
                  {/* Collapsible manual form */}
                  <Collapsible open={isRegistryEditMode} onOpenChange={setIsRegistryEditMode}>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <FormField
                        control={form.control}
                        name="registrationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Typ registrace</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Vyberte typ registrace" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="obchodni_rejstrik">Obchodní rejstřík</SelectItem>
                                <SelectItem value="zivnostensky_rejstrik">Živnostenský rejstřík</SelectItem>
                                <SelectItem value="jiny_rejstrik">Jiný rejstřík</SelectItem>
                                <SelectItem value="bez_zapisu">Bez zápisu</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {(form.watch('registrationType') === 'obchodni_rejstrik' || 
                        form.watch('registrationType') === 'zivnostensky_rejstrik' || 
                        form.watch('registrationType') === 'jiny_rejstrik') && (
                        <FormField
                          control={form.control}
                          name="registrationCourt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {form.watch('registrationType') === 'obchodni_rejstrik' 
                                  ? 'Krajský soud' 
                                  : form.watch('registrationType') === 'zivnostensky_rejstrik'
                                  ? 'Úřad'
                                  : 'Název rejstříku'}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={
                                    form.watch('registrationType') === 'obchodni_rejstrik' 
                                      ? 'např. Krajským soudem v Praze' 
                                      : form.watch('registrationType') === 'zivnostensky_rejstrik'
                                      ? 'např. Živnostenským úřadem Praha 1'
                                      : 'Název rejstříku'
                                  }
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {(form.watch('registrationType') === 'obchodni_rejstrik' || 
                        form.watch('registrationType') === 'jiny_rejstrik') && (
                        <FormField
                          control={form.control}
                          name="registrationFileNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spisová značka</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="např. C 12345" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRegistryEditMode(false)}
                        >
                          Hotovo
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {t('settings.companyInformationSaved')}
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? t('settings.saving') : t('settings.saveCompanyInformation')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}