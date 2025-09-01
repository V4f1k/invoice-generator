/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import enMessages from '../../messages/en.json';
import csMessages from '../../messages/cs.json';

// Simple test component that uses translations
const TestComponent = ({ translationKey }: { translationKey: string }) => {
  // Mock the useTranslations hook with actual data
  const messages = enMessages;
  const keys = translationKey.split('.');
  let value = messages;
  for (const key of keys) {
    value = value[key as keyof typeof value];
  }
  
  return <div data-testid="translation">{value as string}</div>;
};

describe('Internationalization', () => {
  it('loads English translation messages correctly', () => {
    expect(enMessages.auth.signIn).toBe('Sign In');
    expect(enMessages.dashboard.title).toBe('Dashboard');
    expect(enMessages.invoice.createNewInvoice).toBe('Create New Invoice');
  });

  it('loads Czech translation messages correctly', () => {
    expect(csMessages.auth.signIn).toBe('Přihlásit se');
    expect(csMessages.dashboard.title).toBe('Přehled');
    expect(csMessages.invoice.createNewInvoice).toBe('Vytvořit novou fakturu');
  });

  it('has matching keys between English and Czech translations', () => {
    const checkKeys = (enObj: Record<string, unknown>, csObj: Record<string, unknown>, path = '') => {
      for (const key in enObj) {
        const currentPath = path ? `${path}.${key}` : key;
        expect(csObj).toHaveProperty(key, expect.anything());
        
        if (typeof enObj[key] === 'object' && enObj[key] !== null) {
          checkKeys(enObj[key], csObj[key], currentPath);
        }
      }
    };
    
    checkKeys(enMessages, csMessages);
  });

  it('renders English text correctly', () => {
    render(<TestComponent translationKey="auth.signIn" />);
    expect(screen.getByTestId('translation')).toHaveTextContent('Sign In');
  });

  it('provides complete coverage for all UI sections', () => {
    // Verify all major sections have translations
    expect(enMessages.auth).toBeDefined();
    expect(enMessages.dashboard).toBeDefined();
    expect(enMessages.invoice).toBeDefined();
    expect(enMessages.actions).toBeDefined();
    expect(enMessages.settings).toBeDefined();
    expect(enMessages.common).toBeDefined();
    expect(enMessages.languages).toBeDefined();
    
    // Verify Czech has the same sections
    expect(csMessages.auth).toBeDefined();
    expect(csMessages.dashboard).toBeDefined();
    expect(csMessages.invoice).toBeDefined();
    expect(csMessages.actions).toBeDefined();
    expect(csMessages.settings).toBeDefined();
    expect(csMessages.common).toBeDefined();
    expect(csMessages.languages).toBeDefined();
  });
});