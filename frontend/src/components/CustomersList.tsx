import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    address: string | null;
    gstin: string | null;
}

export default function CustomersList() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="py-10 text-center text-gray-500">Loading customers...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Customer List</h3>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Customer Name</TableHead>
                            <TableHead>Location/Address</TableHead>
                            <TableHead>GSTIN</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                                    No customers found. Click 'Add Customer' to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium text-gray-900">{customer.name}</TableCell>
                                    <TableCell className="text-gray-600 max-w-xs truncate">{customer.address || '-'}</TableCell>
                                    <TableCell className="text-gray-600 font-mono text-sm">{customer.gstin || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
