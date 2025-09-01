import React from 'react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  vatRate?: number | null;
}

interface InvoiceData {
  invoiceNumber: number;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  items: InvoiceItem[];
  supplier: {
    name: string;
    address: string;
    ico?: string | null;
    dic?: string | null;
    isNonVatPayer?: boolean;
  };
  qrCodeDataUrl?: string;
}

export interface InvoicePDFTemplateProps {
  invoice: InvoiceData;
  translations: { [key: string]: any };
  language: string;
}

export const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({ invoice, translations, language }) => {
  // Helper function to get translation
  const t = (key: string, fallback?: string): string => {
    const keyParts = key.split('.');
    let value: any = translations;
    
    for (const part of keyParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }
    
    return typeof value === 'string' ? value : (fallback || key);
  };
  const formatCurrency = (amount: number): string => {
    // Use locale-appropriate number formatting
    const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
    const currency = language === 'cs' ? 'CZK' : 'USD';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const locale = language === 'cs' ? 'cs-CZ' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale);
  };

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            background: white;
            padding: 40px;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
          }
          
          .invoice-number {
            text-align: right;
            font-size: 14px;
            color: #6b7280;
          }
          
          .invoice-number strong {
            font-size: 18px;
            color: #1f2937;
          }
          
          .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          
          .party {
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
          }
          
          .party-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
          }
          
          .party-name {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
          }
          
          .party-address {
            font-size: 14px;
            color: #4b5563;
            white-space: pre-line;
            line-height: 1.5;
          }
          
          .party-details {
            margin-top: 12px;
            font-size: 13px;
            color: #6b7280;
          }
          
          .dates {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
          }
          
          .date-item {
            font-size: 14px;
          }
          
          .date-label {
            color: #6b7280;
            margin-bottom: 4px;
          }
          
          .date-value {
            font-weight: 600;
            color: #1f2937;
          }
          
          .items-table {
            width: 100%;
            margin-bottom: 40px;
            border-collapse: collapse;
          }
          
          .items-table th {
            background: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #6b7280;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .items-table th:last-child {
            text-align: right;
          }
          
          .items-table td {
            padding: 16px 12px;
            font-size: 14px;
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .items-table td:last-child {
            text-align: right;
            font-weight: 500;
          }
          
          .quantity-cell {
            text-align: center;
          }
          
          .unit-price-cell {
            text-align: right;
          }
          
          .vat-rate-cell {
            text-align: center;
            width: 80px;
          }
          
          .totals {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 40px;
          }
          
          .qr-code {
            flex-shrink: 0;
          }
          
          .qr-code img {
            width: 150px;
            height: 150px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px;
            background: white;
          }
          
          .qr-label {
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            margin-top: 8px;
          }
          
          .totals-summary {
            text-align: right;
            flex-grow: 1;
            margin-right: 40px;
          }
          
          .total-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .total-label {
            color: #6b7280;
            margin-right: 20px;
          }
          
          .total-value {
            font-weight: 500;
            color: #1f2937;
            min-width: 120px;
            text-align: right;
          }
          
          .grand-total {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #e5e7eb;
          }
          
          .grand-total .total-label {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .grand-total .total-value {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
          }
          
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .invoice-container {
              max-width: 100%;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="invoice-container">
          <div className="header">
            <div>
              <h1 className="invoice-title">{t('invoice.invoiceTitle')}</h1>
            </div>
            <div className="invoice-number">
              {t('invoice.invoiceNumber')}<br />
              <strong>#{String(invoice.invoiceNumber).padStart(6, '0')}</strong>
            </div>
          </div>

          <div className="parties">
            <div className="party">
              <div className="party-label">{t('invoice.from')}</div>
              <div className="party-name">{invoice.supplier.name}</div>
              <div className="party-address">{invoice.supplier.address}</div>
              <div className="party-details">
                {invoice.supplier.ico && <div>IČO: {invoice.supplier.ico}</div>}
                {invoice.supplier.dic && <div>DIČ: {invoice.supplier.dic}</div>}
                {invoice.supplier.isNonVatPayer && (
                  <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
                    {language === 'cs' ? 'Nejsem plátce DPH' : 'Not a VAT payer'}
                  </div>
                )}
              </div>
            </div>

            <div className="party">
              <div className="party-label">{t('invoice.billTo')}</div>
              <div className="party-name">{invoice.clientName}</div>
              <div className="party-address">{invoice.clientAddress}</div>
            </div>
          </div>

          <div className="dates">
            <div className="date-item">
              <div className="date-label">{t('invoice.issueDate')}</div>
              <div className="date-value">{formatDate(invoice.issueDate)}</div>
            </div>
            <div className="date-item">
              <div className="date-label">{t('invoice.dueDate')}</div>
              <div className="date-value">{formatDate(invoice.dueDate)}</div>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>{t('invoice.description')}</th>
                <th className="quantity-cell">{t('invoice.quantity')}</th>
                <th className="unit-price-cell">{t('invoice.unitPrice')}</th>
                <th className="vat-rate-cell">{t('invoice.vatRate')}</th>
                <th>{t('invoice.total')}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td className="quantity-cell">{item.quantity}</td>
                  <td className="unit-price-cell">{formatCurrency(item.unitPrice)}</td>
                  <td className="vat-rate-cell">{item.vatRate ? `${item.vatRate}%` : '0%'}</td>
                  <td>{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            {invoice.qrCodeDataUrl && (
              <div className="qr-code">
                <img src={invoice.qrCodeDataUrl} alt="SPAYD QR kód" />
                <div className="qr-label">{t('invoice.qrPayment')}</div>
              </div>
            )}
            
            <div className="totals-summary">
              <div className="total-row">
                <span className="total-label">{t('invoice.subtotal')}:</span>
                <span className="total-value">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">{t('invoice.vatAmount')}:</span>
                <span className="total-value">{formatCurrency(invoice.vatAmount)}</span>
              </div>
              <div className="grand-total total-row">
                <span className="total-label">{t('invoice.total')}:</span>
                <span className="total-value">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          <div className="footer">
            {t('invoice.thankYou')}
          </div>
        </div>
      </body>
    </html>
  );
};