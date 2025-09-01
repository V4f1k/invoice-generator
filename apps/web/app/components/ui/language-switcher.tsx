'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { useLocale, type Locale } from '@/app/lib/locale-provider';

export function LanguageSwitcher() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();

  const languages: { code: Locale; name: string }[] = [
    { code: 'en', name: t('languages.en') },
    { code: 'cs', name: t('languages.cs') },
  ];

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>{currentLanguage?.name}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className={locale === language.code ? 'bg-accent' : ''}
          >
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}