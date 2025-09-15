'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/app/lib/locale-provider';
import { formatCurrency } from '../../../lib/currency';
import { invoiceApi, type Invoice } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { ArrowLeft, Download, Printer, Calendar, User, Building2, FileText, DollarSign } from 'lucide-react';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id || typeof id !== 'string') {
        setError(t('invoice.invalidInvoiceId'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const invoiceData = await invoiceApi.get(id);
        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError(t('invoice.failedToLoadInvoice'));
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id, t]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    
    try {
      setIsDownloading(true);
      
      // Download PDF blob from API
      const pdfBlob = await invoiceApi.downloadPdf(invoice.id, locale);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faktura-${invoice.invoiceNumber.toString().padStart(10, '0')}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert(t('invoice.failedToDownloadPdf'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateTotalVat = () => {
    if (!invoice) return 0;
    return invoice.items.reduce((total, item) => {
      const itemVat = item.vatRate ? (item.lineTotal * item.vatRate) / 100 : 0;
      return total + itemVat;
    }, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="sm"
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('invoice.backToDashboard')}
          </Button>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">{t('common.error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="sm"
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('invoice.backToDashboard')}
          </Button>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{t('invoice.invoiceNotFound')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              No invoice found with ID: {id}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header with Navigation and Actions */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            size="sm"
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('invoice.backToDashboard')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {t('invoice.invoiceNumber', { number: invoice.invoiceNumber })}
            </h1>
            <p className="text-gray-600">
              {t('invoice.createdOn', { date: formatDate(invoice.createdAt) })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            {t('actions.print')}
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? t('actions.downloading') : t('actions.downloadPdf')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Invoice Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('invoice.from')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{invoice.supplier.name}</p>
                <p>{invoice.supplier.street}</p>
                <p>{invoice.supplier.city}, {invoice.supplier.zipCode}</p>
                <p>{invoice.supplier.country}</p>
                {invoice.supplier.ico && (
                  <p className="text-sm text-gray-600">IČO: {invoice.supplier.ico}</p>
                )}
                {invoice.supplier.dic && (
                  <p className="text-sm text-gray-600">DIČ: {invoice.supplier.dic}</p>
                )}
                {invoice.supplier.isNonVatPayer && (
                  <Badge variant="secondary" className="text-xs">
                    Not a VAT payer
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('invoice.billTo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{invoice.clientName}</p>
                <p>{invoice.clientStreet}</p>
                <p>{invoice.clientCity}, {invoice.clientZipCode}</p>
                <p>{invoice.clientCountry}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('invoice.invoiceDates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('invoice.issueDate')}</p>
                <p className="text-lg">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t('invoice.dueDate')}</p>
                <p className="text-lg">{formatDate(invoice.dueDate)}</p>
              </div>
              {invoice.duzp && (
                <div>
                  <p className="text-sm font-medium text-gray-600">DUZP</p>
                  <p className="text-lg">{formatDate(invoice.duzp)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('invoice.items')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{t('invoice.description')}</th>
                    <th className="text-right py-2">{t('invoice.quantity')}</th>
                    <th className="text-right py-2">{t('invoice.unitPrice')}</th>
                    {!invoice.supplier.isNonVatPayer && (
                      <th className="text-right py-2">{t('invoice.vatRate')}</th>
                    )}
                    <th className="text-right py-2">{t('invoice.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">{item.description}</td>
                      <td className="text-right py-3">{Number(item.quantity).toFixed(2)}</td>
                      <td className="text-right py-3">
                        {formatCurrency({ locale, amount: Number(item.unitPrice) })}
                      </td>
                      {!invoice.supplier.isNonVatPayer && (
                        <td className="text-right py-3">
                          {item.vatRate ? `${item.vatRate}%` : '0%'}
                        </td>
                      )}
                      <td className="text-right py-3 font-medium">
                        {formatCurrency({ locale, amount: Number(item.lineTotal) })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('invoice.total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span>{t('invoice.subtotal')}:</span>
                  <span>{formatCurrency({ locale, amount: Number(invoice.subtotal) })}</span>
                </div>
                {!invoice.supplier.isNonVatPayer && Number(invoice.vatAmount) > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span>{t('invoice.vatAmount')}:</span>
                    <span>{formatCurrency({ locale, amount: Number(invoice.vatAmount) })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-t font-bold text-lg">
                  <span>{t('invoice.grandTotal')}:</span>
                  <span>{formatCurrency({ locale, amount: Number(invoice.total) })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        {invoice.supplier.bankAccount && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <span className="font-medium">Bank Account:</span> {invoice.supplier.bankAccount}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}