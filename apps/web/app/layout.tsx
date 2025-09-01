import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { LocaleProvider } from "./lib/locale-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice Generator",
  description: "Professional invoice generation system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
