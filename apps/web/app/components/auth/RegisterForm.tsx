'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { authApi } from '@/app/lib/api';
import { registerSchema, type RegisterFormData } from '@/app/lib/schemas';
import { useAuthStore } from '@/app/lib/auth-store';

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const t = useTranslations();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApi.register({
        email: data.email,
        password: data.password,
      });
      
      setUser(response.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data ? String(err.response.data.error) : 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t('auth.createAccount')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder={t('auth.email')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={t('auth.password')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={t('auth.confirmPassword')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}