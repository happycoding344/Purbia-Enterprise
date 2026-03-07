import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomersList from '@/components/CustomersList';
import InvoicesList from '@/components/InvoicesList';

export default function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
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

                <Tabs defaultValue="invoices" className="w-full mt-8">
                    <TabsList className="mb-4">
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        <TabsTrigger value="customers">Customers</TabsTrigger>
                        <TabsTrigger value="trips">Trips Logistics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoices">
                        <InvoicesList />
                    </TabsContent>

                    <TabsContent value="customers">
                        <CustomersList />
                    </TabsContent>

                    <TabsContent value="trips">
                        <div className="rounded-md border bg-white p-8 text-center text-gray-500">
                            Trip tracking components are under development.
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
