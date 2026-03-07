import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
            {/* Header Navbar */}
            <header className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:flex sm:items-center sm:justify-between px-6 py-4">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Purbia Enterprise</h1>
                </div>
                <div className="flex items-center space-x-6">
                    <span className="text-sm font-medium text-gray-500">Welcome, {user?.name}</span>
                    <Button variant="outline" size="sm" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 border-b border-gray-200 pb-5">
                    <h3 className="text-2xl font-semibold leading-6 text-gray-900">Dashboard Overview</h3>
                </div>

                {/* Dashboard Stats / Grid Placeholder */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Total Invoices</dt>
                        <dd className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">0</dd>
                    </div>
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Total Customers</dt>
                        <dd className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">0</dd>
                    </div>
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Active Trips</dt>
                        <dd className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">0</dd>
                    </div>
                </div>

                {/* Space for future components like Tables */}
                <div className="mt-8 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
                    <p className="text-gray-500 text-center py-10">Data tables will be rendered here...</p>
                </div>
            </main>
        </div>
    );
}
