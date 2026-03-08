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
import { Plus, Download } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';

interface Invoice {
    id: number;
    invoice_no: string;
    invoice_date: string;
    customer_id: number;
    grand_total: number;
    customer?: {
        name: string;
    };
}

export default function InvoicesList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const response = await api.get('/invoices');
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="py-10 text-center text-gray-500">Loading invoices...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Invoice History</h3>
                <InvoiceForm onSuccess={fetchInvoices} />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Invoice No.</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Total Amount (₹)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                    No invoices generated yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium text-gray-900">{invoice.invoice_no}</TableCell>
                                    <TableCell className="text-gray-600">{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-gray-900">{invoice.customer?.name || 'Unknown'}</TableCell>
                                    <TableCell className="text-right font-medium text-gray-900">
                                        ₹{parseFloat(String(invoice.grand_total)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 hover:bg-green-50">
                                            <Download className="h-4 w-4 mr-1" /> PDF
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
