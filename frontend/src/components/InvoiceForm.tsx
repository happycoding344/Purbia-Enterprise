import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/axios';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

const invoiceSchema = z.object({
    customer_id: z.coerce.number().min(1, 'Please select a customer'),
    invoice_no: z.string().min(1, 'Invoice Number is required'),
    invoice_date: z.string().min(1, 'Invoice Date is required'),
    due_date: z.string().optional(),
    items: z.array(z.object({
        description: z.string().min(1, 'Description required'),
        sac_code: z.string().optional(),
        qty: z.coerce.number().min(0.01, 'Qty must be > 0'),
        rate: z.coerce.number().min(0, 'Rate must be >= 0'),
    })).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    onSuccess: () => void;
}

export default function InvoiceForm({ onSuccess }: InvoiceFormProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState<{ id: number, name: string }[]>([]);

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            customer_id: 0,
            invoice_no: `INV-${new Date().getTime().toString().slice(-6)}`,
            invoice_date: new Date().toISOString().split('T')[0],
            items: [{ description: '', sac_code: '', qty: 1, rate: 0 }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    useEffect(() => {
        if (open) {
            fetchCustomers();
        }
    }, [open]);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const onSubmit = async (data: InvoiceFormValues) => {
        setIsSubmitting(true);
        try {
            await api.post('/invoices', data);
            setOpen(false);
            reset();
            onSuccess();
        } catch (error) {
            console.error('Failed to create invoice', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const watchItems = watch('items');
    const calculateTotal = () => {
        let total = 0;
        watchItems.forEach(item => {
            const amt = (item.qty || 0) * (item.rate || 0);
            const gst = amt * 0.18; // 9% CGST + 9% SGST
            total += amt + gst;
        });
        return total.toFixed(2);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Customer <span className="text-red-500">*</span></Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                {...register('customer_id')}
                            >
                                <option value="0" disabled>Select Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="text-sm text-red-500">{errors.customer_id.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Invoice No. <span className="text-red-500">*</span></Label>
                            <Input {...register('invoice_no')} />
                            {errors.invoice_no && <p className="text-sm text-red-500">{errors.invoice_no.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Invoice Date <span className="text-red-500">*</span></Label>
                            <Input type="date" {...register('invoice_date')} />
                            {errors.invoice_date && <p className="text-sm text-red-500">{errors.invoice_date.message}</p>}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-700">Line Items</h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ description: '', sac_code: '', qty: 1, rate: 0 })}
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add Row
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start p-3 border rounded-md bg-gray-50/50">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs">Description</Label>
                                        <Input {...register(`items.${index}.description` as const)} placeholder="Service Details" />
                                        {errors?.items?.[index]?.description && <p className="text-xs text-red-500">{errors.items[index]?.description?.message}</p>}
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <Label className="text-xs">SAC Code</Label>
                                        <Input {...register(`items.${index}.sac_code` as const)} placeholder="9967" />
                                    </div>
                                    <div className="w-20 space-y-2">
                                        <Label className="text-xs">Qty</Label>
                                        <Input type="number" step="0.01" {...register(`items.${index}.qty` as const)} />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label className="text-xs">Rate</Label>
                                        <Input type="number" step="0.01" {...register(`items.${index}.rate` as const)} />
                                    </div>
                                    <div className="pt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t pt-4">
                        <div className="text-lg font-medium text-gray-700">
                            Estimated Total (inc 18% GST): <span className="text-black font-bold">₹{calculateTotal()}</span>
                        </div>
                        <div className="flex space-x-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Generate Invoice'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
