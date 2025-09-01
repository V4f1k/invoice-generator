'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../../components/ui/button';
import { Plus, Users, Settings } from 'lucide-react';
import { InvoiceCreationModal } from '@/app/components/invoice/InvoiceCreationModal';
import Link from 'next/link';

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link href="/customers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Users className="h-4 w-4" />
              Customers
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.createNewInvoice')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.totalInvoices')}</h3>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.pending')}</h3>
            <p className="text-3xl font-bold text-yellow-600">0</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.paid')}</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.recentInvoices')}</h2>
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('dashboard.noInvoices')}</p>
          </div>
        </div>

        <InvoiceCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </div>
  );
}