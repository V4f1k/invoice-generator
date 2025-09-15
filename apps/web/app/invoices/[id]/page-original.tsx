'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/app/lib/locale-provider';
import { formatCurrency } from '../../../lib/currency';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { ArrowLeft, Calendar, MapPin, User, FileText, DollarSign, Download } from 'lucide-react';
import { invoiceApi, type Invoice } from '../../lib/api';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const t = useTranslations();
  const { locale } = useLocale();

  useEffect(() => {
    async function fetchInvoice() {
      if (!id || typeof id !== 'string') {
        setError(t('invoice.invalidInvoiceId'));
        setLoading(false);
        return;
      }

      try {
        const fetchedInvoice = await invoiceApi.get(id);
        setInvoice(fetchedInvoice);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(t('invoice.failedToLoadInvoice'));
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [id]);

  const formatDate = (dateString: string) => {
    const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US';
    return new Date(dateString).toLocaleDateString(localeCode, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrencyAmount = (amount: number) => {
    return formatCurrency({ locale, amount });
  };

  const handleDownloadPdf = async () => {
    if (!invoice || !id || typeof id !== 'string') return;

    setDownloadingPdf(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/v1/invoices/${id}/pdf?lang=${locale}`,
        {
          method: 'GET',
          credentials: 'include', // This sends the HTTP-only cookies
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faktura-${String(invoice.invoiceNumber).padStart(6, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(t('invoice.failedToDownloadPdf'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">{t('invoice.loadingInvoice')}</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600 mb-2">
                {error || t('invoice.invoiceNotFound')}
              </div>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('invoice.backToDashboard')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('invoice.backToDashboard')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('invoice.invoiceNumber', { number: invoice.invoiceNumber })}</h1>
            <p className="text-muted-foreground">
              {t('invoice.createdOn', { date: formatDate(invoice.createdAt) })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? t('actions.downloading') : t('actions.downloadPdf')}</span>
          </Button>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <FileText className="w-4 h-4 mr-2" />
            {t('invoice.invoice')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              {t('invoice.from')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold">{invoice.supplier.name}</div>
              <div className="text-muted-foreground whitespace-pre-line">
                {invoice.supplier.address}
              </div>
              {invoice.supplier.ico && (
                <div className="text-sm text-muted-foreground">
                  IČO: {invoice.supplier.ico}
                </div>
              )}
              {invoice.supplier.dic && (
                <div className="text-sm text-muted-foreground">
                  DIČ: {invoice.supplier.dic}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              {t('invoice.billTo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-semibold">{invoice.clientName}</div>
              <div className="text-muted-foreground whitespace-pre-line">
                {invoice.clientAddress}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            {t('invoice.invoiceDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('invoice.issueDate')}</div>
              <div className="text-lg">{formatDate(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{t('invoice.dueDate')}</div>
              <div className="text-lg">{formatDate(invoice.dueDate)}</div>
            </div>
            {invoice.duzp && !invoice.supplier.isNonVatPayer && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">DUZP</div>
                <div className="text-lg">{formatDate(invoice.duzp)}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoice.items')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground border-b pb-2">
              <div className="col-span-5">{t('invoice.description')}</div>
              <div className="col-span-1 text-right">{t('invoice.quantity')}</div>
              <div className="col-span-2 text-right">{t('invoice.unitPrice')}</div>
              <div className="col-span-2 text-right">{t('invoice.vatRate')}</div>
              <div className="col-span-2 text-right">{t('invoice.total')}</div>
            </div>
            
            {/* Items */}
            {invoice.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 py-2">
                <div className="col-span-5">
                  <div className="font-medium">{item.description}</div>
                </div>
                <div className="col-span-1 text-right">
                  {Number(item.quantity)}
                </div>
                <div className="col-span-2 text-right">
                  {formatCurrencyAmount(Number(item.unitPrice))}
                </div>
                <div className="col-span-2 text-right">
                  {item.vatRate ? `${Number(item.vatRate)}%` : '0%'}
                </div>
                <div className="col-span-2 text-right font-medium">
                  {formatCurrencyAmount(Number(item.lineTotal))}
                </div>
              </div>
            ))}
            
            <Separator />
            
            {/* Totals */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-10 text-right font-medium">{t('invoice.subtotal')}:</div>
                <div className="col-span-2 text-right text-lg">
                  {formatCurrencyAmount(Number(invoice.subtotal))}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-10 text-right font-medium">{t('invoice.vatAmount')}:</div>
                <div className="col-span-2 text-right text-lg">
                  {formatCurrencyAmount(Number(invoice.vatAmount))}
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 border-t pt-2">
                <div className="col-span-10 text-right font-bold text-lg">{t('invoice.total')}:</div>
                <div className="col-span-2 text-right font-bold text-xl flex items-center justify-end">
                  {formatCurrencyAmount(Number(invoice.total))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => window.print()}>
              {t('actions.printInvoice')}
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? t('actions.downloading') : t('actions.downloadPdf')}
            </Button>
            <Link href="/dashboard">
              <Button>
                {t('invoice.backToDashboard')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}