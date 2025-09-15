
import React from 'react';

// Typy z původního kódu
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
  duzp?: string | null;
  description?: string | null;
  clientName: string;
  clientStreet?: string;
  clientCity?: string;
  clientZipCode?: string;
  clientCountry?: string;
  clientIco?: string | null;
  clientDic?: string | null;
  clientAddress: string; // Composed for backward compatibility
  subtotal: number;
  vatAmount: number;
  total: number;
  isReverseCharge?: boolean;
  items: InvoiceItem[];
  supplier: {
    name: string;
    street?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    address: string; // Composed for backward compatibility
    ico?: string | null;
    dic?: string | null;
    isNonVatPayer?: boolean;
    bankAccount?: string | null;
    registrationType?: string | null;
    registrationCourt?: string | null;
    registrationFileNumber?: string | null;
    registrationText?: string | null;
  };
  qrCodeDataUrl?: string;
}

export interface InvoicePDFTemplateProps {
  invoice: InvoiceData;
  translations: { [key: string]: any };
  language: string;
}

// Komponenta šablony
const InvoicePDFTemplate: React.FC<InvoicePDFTemplateProps> = ({ invoice, translations, language }) => {
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
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#333',
      background: 'white',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }} className="invoice-container">
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .invoice-container {
            max-width: 100% !important;
            padding: 10px !important;
            margin: 0 !important;
          }
          
          @page {
            margin: 1cm !important;
            size: A4 !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        
        @media screen {
          .invoice-container {
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
        }
      `}</style>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '25px',
        paddingBottom: '15px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            {invoice.supplier.isNonVatPayer ? 'Faktura' : 'Faktura - daňový doklad'}
          </h1>
        </div>
        <div style={{
          textAlign: 'right',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {t('invoice.invoiceNumber')}<br />
          <strong style={{ fontSize: '18px', color: '#1f2937' }}>
            #{String(invoice.invoiceNumber).padStart(6, '0')}
          </strong>
        </div>
      </div>

      {/* Dodavatel a Odběratel vedle sebe */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '25px'
      }}>
        {/* Dodavatel */}
        <div style={{
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: '#6b7280',
            marginBottom: '12px',
            letterSpacing: '0.5px'
          }}>{t('invoice.from')}</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>{invoice.supplier.name}</div>
          <div style={{
            fontSize: '14px',
            color: '#4b5563',
            whiteSpace: 'pre-line',
            lineHeight: '1.5'
          }}>{invoice.supplier.address}</div>
          <div style={{
            marginTop: '12px',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            {invoice.supplier.ico && <div>IČO: {invoice.supplier.ico}</div>}
            {invoice.supplier.dic && <div>DIČ: {invoice.supplier.dic}</div>}
            {invoice.supplier.isNonVatPayer && (
              <div style={{ fontWeight: 'bold', marginTop: '4px' }}>
                {language === 'cs' ? 'Nejsem plátce DPH' : 'Not a VAT payer'}
              </div>
            )}
          </div>

          {/* Bank Account and Variable Symbol section */}
          <div style={{
            marginTop: '20px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '15px'
          }}>
            {invoice.supplier.bankAccount && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <span style={{ color: '#6b7280' }}>{language === 'cs' ? 'Číslo účtu' : 'Account Number'}</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{invoice.supplier.bankAccount}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px'
            }}>
              <span style={{ color: '#6b7280' }}>{language === 'cs' ? 'Variabilní symbol' : 'Variable Symbol'}</span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>{String(invoice.invoiceNumber).padStart(10, '0')}</span>
            </div>
          </div>
        </div>

        {/* Odběratel s daty v jednom boxu */}
        <div style={{
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: '#6b7280',
            marginBottom: '12px',
            letterSpacing: '0.5px'
          }}>{t('invoice.billTo')}</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>{invoice.clientName}</div>
          <div style={{
            fontSize: '14px',
            color: '#4b5563',
            whiteSpace: 'pre-line',
            lineHeight: '1.5',
            marginBottom: '12px'
          }}>{invoice.clientAddress}</div>
          
          {/* IČO a DIČ odběratele - only display if available */}
          {(invoice.clientIco || invoice.clientDic) && (
            <div style={{
              fontSize: '13px',
              color: '#6b7280',
              marginBottom: '20px'
            }}>
              {invoice.clientIco && <div>IČO: {invoice.clientIco}</div>}
              {invoice.clientDic && <div>DIČ: {invoice.clientDic}</div>}
            </div>
          )}

          {/* Data vystavení a splatnosti */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '15px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              <span style={{ color: '#6b7280' }}>{t('invoice.issueDate')}</span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(invoice.issueDate)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px'
            }}>
              <span style={{ color: '#6b7280' }}>{t('invoice.dueDate')}</span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.duzp && !invoice.supplier.isNonVatPayer && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                marginTop: '8px'
              }}>
                <span style={{ color: '#6b7280' }}>DUZP:</span>
                <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(invoice.duzp)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Description */}
      {invoice.description && (
        <div style={{
          marginBottom: '25px',
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: '#6b7280',
            marginBottom: '12px',
            letterSpacing: '0.5px'
          }}>Popis</div>
          <div style={{
            fontSize: '14px',
            color: '#1f2937',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {invoice.description}
          </div>
        </div>
      )}

      <table style={{
        width: '100%',
        marginBottom: '25px',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr>
            <th style={{
              background: '#f3f4f6',
              padding: '12px',
              textAlign: 'left',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: '#6b7280',
              borderBottom: '2px solid #e5e7eb'
            }}>{t('invoice.description')}</th>
            <th style={{
              background: '#f3f4f6',
              padding: '12px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: '#6b7280',
              borderBottom: '2px solid #e5e7eb'
            }}>{t('invoice.quantity')}</th>
            <th style={{
              background: '#f3f4f6',
              padding: '12px',
              textAlign: 'right',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: '#6b7280',
              borderBottom: '2px solid #e5e7eb'
            }}>{t('invoice.unitPrice')}</th>
            {!invoice.isReverseCharge && (
              <th style={{
                background: '#f3f4f6',
                padding: '12px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: '#6b7280',
                borderBottom: '2px solid #e5e7eb',
                width: '80px'
              }}>{t('invoice.vatRate')}</th>
            )}
            <th style={{
              background: '#f3f4f6',
              padding: '12px',
              textAlign: 'right',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: '#6b7280',
              borderBottom: '2px solid #e5e7eb'
            }}>{t('invoice.total')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: '#1f2937',
                borderBottom: '1px solid #e5e7eb'
              }}>{item.description}</td>
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: '#1f2937',
                borderBottom: '1px solid #e5e7eb',
                textAlign: 'center'
              }}>{item.quantity}</td>
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: '#1f2937',
                borderBottom: '1px solid #e5e7eb',
                textAlign: 'right'
              }}>{formatCurrency(item.unitPrice)}</td>
              {!invoice.isReverseCharge && (
                <td style={{
                  padding: '16px 12px',
                  fontSize: '14px',
                  color: '#1f2937',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>{item.vatRate ? `${item.vatRate}%` : '0%'}</td>
              )}
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: '#1f2937',
                borderBottom: '1px solid #e5e7eb',
                textAlign: 'right',
                fontWeight: '500'
              }}>{formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: '20px'
      }}>
        {invoice.qrCodeDataUrl && (
          <div style={{ flexShrink: 0 }}>
            <img 
              src={invoice.qrCodeDataUrl} 
              alt="SPAYD QR kód" 
              style={{
                width: '150px',
                height: '150px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
                background: 'white'
              }}
            />
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '8px'
            }}>{t('invoice.qrPayment')}</div>
          </div>
        )}
        
        <div style={{
          textAlign: 'right',
          flexGrow: 1,
          marginRight: invoice.qrCodeDataUrl ? '40px' : '0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            <span style={{ color: '#6b7280', marginRight: '20px' }}>{t('invoice.subtotal')}:</span>
            <span style={{
              fontWeight: '500',
              color: '#1f2937',
              minWidth: '120px',
              textAlign: 'right'
            }}>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {!invoice.isReverseCharge && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              <span style={{ color: '#6b7280', marginRight: '20px' }}>{t('invoice.vatAmount')}:</span>
              <span style={{
                fontWeight: '500',
                color: '#1f2937',
                minWidth: '120px',
                textAlign: 'right'
              }}>{formatCurrency(invoice.vatAmount)}</span>
            </div>
          )}
          {invoice.isReverseCharge && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              <span style={{ 
                color: '#d97706', 
                fontWeight: '600',
                marginRight: '20px' 
              }}>Přenesená daňová povinnost:</span>
              <span style={{
                fontWeight: '600',
                color: '#d97706',
                minWidth: '120px',
                textAlign: 'right'
              }}>Daň odvede zákazník</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '2px solid #e5e7eb',
            fontSize: '14px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginRight: '20px'
            }}>{t('invoice.total')}:</span>
            <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1f2937',
              minWidth: '120px',
              textAlign: 'right'
            }}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {invoice.supplier.registrationText && (
        <div style={{
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '11px',
          color: '#6b7280'
        }}>
          {invoice.supplier.registrationText}
        </div>
      )}

      <div style={{
        marginTop: invoice.supplier.registrationText ? '20px' : '40px',
        paddingTop: '15px',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        fontSize: '12px',
        color: '#9ca3af'
      }}>
        {t('invoice.thankYou')}
      </div>
    </div>
  );
};

export { InvoicePDFTemplate };
