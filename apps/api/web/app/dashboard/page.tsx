'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/auth-store';
import { authApi } from '../lib/api';

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      logout();
      router.push('/login');
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Protected Content
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>This is a protected page that requires authentication.</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">User ID: {user.id}</p>
              <p className="text-sm text-gray-600">Email: {user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}