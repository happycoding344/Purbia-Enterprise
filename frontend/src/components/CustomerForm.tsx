import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/axios';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

const customerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    address: z.string().optional(),
    gstin: z.string().max(15, 'GSTIN cannot exceed 15 characters').optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    onSuccess: () => void;
}

export default function CustomerForm({ onSuccess }: CustomerFormProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '',
            address: '',
            gstin: '',
        }
    });

    const onSubmit = async (data: CustomerFormValues) => {
        setIsSubmitting(true);
        try {
            await api.post('/customers', data);
            setOpen(false);
            reset();
            onSuccess(); // Refresh list
        } catch (error) {
            console.error('Failed to create customer', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                        Enter the client details here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Customer Name <span className="text-red-500">*</span></Label>
                        <Input id="name" {...register('name')} placeholder="Reliance Industries" />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address Location</Label>
                        <Input id="address" {...register('address')} placeholder="Mumbai, MH" />
                        {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input id="gstin" {...register('gstin')} placeholder="27XXXX" />
                        {errors.gstin && <p className="text-sm text-red-500">{errors.gstin.message}</p>}
                    </div>

                    <div className="pt-4 flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Customer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
