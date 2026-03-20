import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/axios';
import { numberToIndianWords } from '@/lib/numberToWords';
import { MasterSelect } from './MasterSelect';
import { VehicleSelect } from './VehicleSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const lrSchema = z.object({
    financial_year: z.string().min(1, 'Financial Year is required'),
    lr_date: z.string().min(1, 'LR Date is required'),
    location_from_id: z.number().min(1, 'Location From is required'),
    lr_no: z.string().min(1, 'LR No. is required'),
    to_city_id: z.number().min(1, 'To City is required'),
    from_city_id: z.number().min(1, 'From City is required'),
    state_id: z.number().min(1, 'State is required'),
    delivery_place_id: z.number().min(1, 'Delivery Place is required'),
    tax_paid_by: z.string().min(1, 'Tax Paid By is required'),
    billing_party_id: z.number().min(1, 'Billing Party is required'),
    consignor_id: z.number().min(1, 'Consignor is required'),
    consignee_id: z.number().min(1, 'Consignee is required'),
    vehicle_id: z.number().min(1, 'Vehicle is required'),
    receipt_type: z.string().min(1, 'Receipt Type is required'),

    // Part 2
    manifest_no: z.string().nullable().optional(),
    manifest_date: z.string().nullable().optional(),
    inward_date: z.string().nullable().optional(),
    inward_time_str: z.string().nullable().optional(),
    outward_date: z.string().nullable().optional(),
    outward_time_str: z.string().nullable().optional(),
    // combined (set on submit)
    inward_time: z.string().nullable().optional(),
    outward_time: z.string().nullable().optional(),
    distance: z.string().nullable().optional(),
    delay_hours: z.coerce.number().nullable().optional(),
    detention_rate: z.coerce.number().optional().default(0),

    // Part 3
    items: z.array(z.object({
        item_name: z.string().min(1, 'Item Name is required'),
        unit: z.string().min(1, 'Unit is required'),
        rate_type: z.string().min(1, 'Rate Type is required'),
        qty: z.coerce.number().nullable().optional(),
        weight: z.coerce.number().nullable().optional(),
        rate: z.coerce.number().min(0, 'Rate is required'),
        actual_qty: z.string().nullable().optional(),
    })).min(1, 'At least one item is required'),

    // Part 4
    gst_percent: z.coerce.number().optional().default(18),
});

type LRFormValues = z.infer<typeof lrSchema>;

interface LRFormProps {
    onSuccess: () => void;
    editLR?: any; // LR data for editing
}

export function LRForm({ onSuccess, editLR }: LRFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [activeTab, setActiveTab] = useState('part1');
    const isEditMode = !!editLR;

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LRFormValues>({
        resolver: zodResolver(lrSchema) as any,
        defaultValues: editLR ? {
            ...editLR,
            lr_date: editLR.lr_date ? format(new Date(editLR.lr_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            manifest_date: editLR.manifest_date ? format(new Date(editLR.manifest_date), 'yyyy-MM-dd') : null,
            inward_date: editLR.inward_time ? editLR.inward_time.substring(0, 10) : '',
            inward_time_str: editLR.inward_time ? editLR.inward_time.substring(11, 16) : '',
            outward_date: editLR.outward_time ? editLR.outward_time.substring(0, 10) : '',
            outward_time_str: editLR.outward_time ? editLR.outward_time.substring(11, 16) : '',
            items: editLR.items?.length > 0 ? editLR.items : [{ item_name: '', unit: 'Kl', rate_type: 'Qty', qty: 0, weight: 0, rate: 0, actual_qty: '' }],
        } : {
            financial_year: '2025-2026',
            lr_date: format(new Date(), 'yyyy-MM-dd'),
            tax_paid_by: 'Transporter',
            receipt_type: 'Original',
            delay_hours: null,
            items: [{ item_name: '', unit: 'Kl', rate_type: 'Qty', qty: 0, weight: 0, rate: 0, actual_qty: '' }],
        },
    });

    const { fields } = useFieldArray({
        control,
        name: 'items',
    });

    const watchedValues = watch();

    // Build combined inward/outward strings from split inputs for detention calculation
    const combinedInward = watchedValues.inward_date && watchedValues.inward_time_str
        ? `${watchedValues.inward_date}T${watchedValues.inward_time_str}`
        : watchedValues.inward_date || null;
    const combinedOutward = watchedValues.outward_date && watchedValues.outward_time_str
        ? `${watchedValues.outward_date}T${watchedValues.outward_time_str}`
        : watchedValues.outward_date || null;

    // Detention calculation — computed inline (no useMemo) so it always reflects latest watched values
    const detentionCalc = (() => {
        if (!combinedInward || !combinedOutward) return { diffDays: 0, detentionDays: 0, totalAmount: 0 };
        const start = new Date(combinedInward);
        const end = new Date(combinedOutward);
        const diffDays = differenceInDays(end, start);
        const detentionDays = Math.max(0, diffDays - (watchedValues.delay_hours || 0));
        const totalAmount = detentionDays * (watchedValues.detention_rate || 0);
        return { diffDays, detentionDays, totalAmount };
    })();

    // Items total — computed inline to avoid stale useMemo array reference
    const itemsTotal = watchedValues.items.reduce((acc, item) => {
        const qty = item.rate_type === 'Qty' ? Number(item.qty || 0) : Number(item.weight || 0);
        return acc + qty * Number(item.rate || 0);
    }, 0);

    const grossAmount = detentionCalc.totalAmount + itemsTotal;
    const sgst = (grossAmount * (watchedValues.gst_percent || 0)) / 200;
    const cgst = sgst;
    const finalTotal = grossAmount + sgst + cgst;

    const onSubmit = async (data: LRFormValues) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();

            // Combine split date+time fields into a single ISO string before sending
            const inwardCombined = data.inward_date && data.inward_time_str
                ? `${data.inward_date}T${data.inward_time_str}:00`
                : data.inward_date || null;
            const outwardCombined = data.outward_date && data.outward_time_str
                ? `${data.outward_date}T${data.outward_time_str}:00`
                : data.outward_date || null;

            if (inwardCombined) formData.append('inward_time', inwardCombined);
            if (outwardCombined) formData.append('outward_time', outwardCombined);

            // Skip the split fields themselves — they are only UI helpers
            const skipKeys = new Set(['inward_date', 'inward_time_str', 'outward_date', 'outward_time_str', 'inward_time', 'outward_time']);

            Object.entries(data).forEach(([key, value]) => {
                if (skipKeys.has(key)) return;
                if (key === 'items') {
                    const items = value as any[];
                    items.forEach((item, index) => {
                        Object.entries(item).forEach(([itemKey, itemValue]) => {
                            if (itemValue !== null && itemValue !== undefined && String(itemValue).trim() !== '') {
                                formData.append(`items[${index}][${itemKey}]`, String(itemValue));
                            }
                        });
                    });
                } else {
                    if (value !== null && value !== undefined && String(value).trim() !== '') {
                        formData.append(key, String(value));
                    }
                }
            });

            files.forEach((file) => {
                formData.append('attachments[]', file);
            });

            if (isEditMode) {
                formData.append('_method', 'PUT');
                await api.post(`/lrs/${editLR.id}`, formData);
            } else {
                await api.post('/lrs', formData);
            }
            onSuccess();
        } catch (err: any) {
            console.error('Failed to submit LR', err);
            const serverErrors = err?.response?.data;
            if (serverErrors?.errors) {
                const messages = Object.values(serverErrors.errors).flat().join('\n');
                alert(`Validation errors:\n${messages}`);
            } else if (serverErrors?.message) {
                alert(`Error: ${serverErrors.message}`);
            } else {
                alert(isEditMode ? 'Failed to update LR' : 'Failed to create LR');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    return (
        <Card className="w-full max-w-5xl mx-auto shadow-lg border-t-4 border-t-blue-600">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-800">LR Preparation Form</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-8">
                            <TabsTrigger value="part1">Part 1: Basic Details</TabsTrigger>
                            <TabsTrigger value="part2">Part 2: Manifest & Time</TabsTrigger>
                            <TabsTrigger value="part3">Part 3: Items & Measure</TabsTrigger>
                            <TabsTrigger value="part4">Part 4: Rate & Files</TabsTrigger>
                        </TabsList>

                        {/* Part 1 */}
                        <TabsContent value="part1" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>Financial Year</Label>
                                    <select {...register('financial_year')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="2025-2026">1 April 2025 to 31 March 2026</option>
                                        <option value="2026-2027">1 April 2026 to 31 March 2027</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>LR Date</Label>
                                    <Input type="date" {...register('lr_date')} />
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="locations"
                                        label="Location From"
                                        value={watchedValues.location_from_id}
                                        onChange={(v) => setValue('location_from_id', v)}
                                        error={errors.location_from_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>LR No.</Label>
                                    <Input {...register('lr_no')} placeholder="LR-XXXX" />
                                    {errors.lr_no && <p className="text-xs text-destructive">{errors.lr_no.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="cities"
                                        label="From City"
                                        value={watchedValues.from_city_id}
                                        onChange={(v) => setValue('from_city_id', v)}
                                        error={errors.from_city_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="cities"
                                        label="To City"
                                        value={watchedValues.to_city_id}
                                        onChange={(v) => setValue('to_city_id', v)}
                                        error={errors.to_city_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="states"
                                        label="State"
                                        value={watchedValues.state_id}
                                        onChange={(v) => setValue('state_id', v)}
                                        error={errors.state_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="delivery_places"
                                        label="Delivery Place"
                                        value={watchedValues.delivery_place_id}
                                        onChange={(v) => setValue('delivery_place_id', v)}
                                        error={errors.delivery_place_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tax Paid By</Label>
                                    <select {...register('tax_paid_by')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="Transporter">Transporter</option>
                                        <option value="Consigner">Consigner</option>
                                        <option value="Consignee">Consignee</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="billing_parties"
                                        label="Billing Party"
                                        value={watchedValues.billing_party_id}
                                        onChange={(v) => setValue('billing_party_id', v)}
                                        error={errors.billing_party_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="consignors"
                                        label="Consignor (Loaded From)"
                                        value={watchedValues.consignor_id}
                                        onChange={(v) => setValue('consignor_id', v)}
                                        error={errors.consignor_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <MasterSelect
                                        type="consignees"
                                        label="Consignee (Unloaded At)"
                                        value={watchedValues.consignee_id}
                                        onChange={(v) => setValue('consignee_id', v)}
                                        error={errors.consignee_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <VehicleSelect
                                        value={watchedValues.vehicle_id}
                                        onChange={(v) => setValue('vehicle_id', v)}
                                        error={errors.vehicle_id?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Receipt Type</Label>
                                    <select {...register('receipt_type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="Original">Original</option>
                                        <option value="Duplicate">Duplicate</option>
                                        <option value="Extra">Extra</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="button" onClick={() => setActiveTab('part2')}>Next Step</Button>
                            </div>
                        </TabsContent>

                        {/* Part 2 */}
                        <TabsContent value="part2" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>Manifest Number</Label>
                                    <Input {...register('manifest_no')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Manifest Date</Label>
                                    <Input type="date" {...register('manifest_date')} />
                                </div>
                            </div>

                                {/* Inward Date + Time */}
                            <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-4">
                                <p className="text-xs font-semibold text-blue-700 uppercase mb-3">Inward Date &amp; Time</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Inward Date</Label>
                                        <Input type="date" {...register('inward_date')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Inward Time <span className="text-xs font-normal text-blue-600">(24-hr, e.g. 14:30)</span></Label>
                                        <Input
                                            type="text"
                                            placeholder="HH:MM"
                                            maxLength={5}
                                            pattern="^([01]\d|2[0-3]):[0-5]\d$"
                                            {...register('inward_time_str')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Outward Date + Time */}
                            <div className="rounded-lg border border-orange-100 bg-orange-50/30 p-4">
                                <p className="text-xs font-semibold text-orange-700 uppercase mb-3">Outward Date &amp; Time</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Outward Date</Label>
                                        <Input type="date" {...register('outward_date')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Outward Time <span className="text-xs font-normal text-orange-600">(24-hr, e.g. 23:15)</span></Label>
                                        <Input
                                            type="text"
                                            placeholder="HH:MM"
                                            maxLength={5}
                                            pattern="^([01]\d|2[0-3]):[0-5]\d$"
                                            {...register('outward_time_str')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>Distance (kms)</Label>
                                    <Input {...register('distance')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Delay Hours (Grace)</Label>
                                    <div className="flex gap-4 p-2 border rounded-md bg-gray-50">
                                        {[1, 2, 3, 4].map(v => (
                                            <label key={v} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" value={v} {...register('delay_hours')} defaultChecked={v === 1} />
                                                <span className="text-sm font-medium">{v * 24}h</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Card className="bg-blue-50/50 border-blue-100">
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Difference Days</p>
                                            <p className="text-xl font-bold">{detentionCalc.diffDays}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-semibold">Detention Days</p>
                                            <p className="text-xl font-bold text-orange-600">{detentionCalc.detentionDays}</p>
                                        </div>
                                        <div className="md:col-span-2 flex flex-col items-center">
                                            <Label className="text-xs mb-1">Detention Rate (₹)</Label>
                                            <Input type="number" {...register('detention_rate')} className="w-32 h-8 text-center" />
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-blue-100 text-center">
                                        <p className="text-sm font-semibold text-blue-800">Total Detention Amount: ₹{detentionCalc.totalAmount.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('part1')}>Previous</Button>
                                <Button type="button" onClick={() => setActiveTab('part3')}>Next Step</Button>
                            </div>
                        </TabsContent>

                        {/* Part 3 */}
                        <TabsContent value="part3" className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-700">Item & Measurements</h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">One item per LR</span>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <Card key={field.id} className="relative bg-gray-50/30">
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                <div className="md:col-span-2 space-y-2">
                                                    <Label>Item Name</Label>
                                                    <Input {...register(`items.${index}.item_name` as const)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Unit</Label>
                                                    <select {...register(`items.${index}.unit` as const)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                        <option value="Kl">Kl</option>
                                                        <option value="MT">MT</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Rate Type</Label>
                                                    <div className="flex gap-4 items-center h-10">
                                                        {['Qty', 'Weight'].map(t => (
                                                            <label key={t} className="flex items-center gap-2 text-xs cursor-pointer">
                                                                <input type="radio" value={t} {...register(`items.${index}.rate_type` as const)} /> {t}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{watchedValues.items?.[index]?.rate_type === 'Qty' ? 'Quantity (Billing)' : 'Weight'}</Label>
                                                    <Input
                                                        type="number"
                                                        {...register(watchedValues.items?.[index]?.rate_type === 'Qty' ? `items.${index}.qty` : `items.${index}.weight` as any)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Rate (₹)</Label>
                                                    <Input type="number" {...register(`items.${index}.rate` as const)} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div className="space-y-2">
                                                    <Label className="text-blue-700 font-semibold">Actual Quantity (User Defined - String)</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. 10 Kl, 2 Loads, etc."
                                                        {...register(`items.${index}.actual_qty` as const)}
                                                    />
                                                    <p className="text-xs text-gray-400">This will appear as 'Actual Quantity' in PI Industries invoice table.</p>
                                                </div>
                                                <div className="mt-6 text-right text-sm">
                                                    <span className="text-gray-500">Net Amount:</span>
                                                    <span className="ml-2 font-bold font-mono">
                                                        ₹{(((watchedValues.items?.[index]?.rate_type === 'Qty' ? watchedValues.items?.[index]?.qty : watchedValues.items?.[index]?.weight) || 0) * (watchedValues.items?.[index]?.rate || 0)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setActiveTab('part2')}>Previous</Button>
                                <Button type="button" onClick={() => setActiveTab('part4')}>Next Step</Button>
                            </div>
                        </TabsContent>

                        {/* Part 4 */}
                        <TabsContent value="part4" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-lg font-semibold">Documents Upload</Label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                id="file-upload"
                                                onChange={handleFileChange}
                                            />
                                            <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                                                <Upload className="h-10 w-10 text-gray-400 group-hover:text-blue-500 mb-2" />
                                                <span className="text-sm font-medium text-gray-600">Click to upload files (max 50MB)</span>
                                                <span className="text-xs text-gray-400 mt-1">Images, PDFs, etc. up to 10 files</span>
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 bg-white border rounded-md text-sm">
                                                    <span className="truncate flex-1">{f.name} ({(f.size / 1024 / 1024).toFixed(2)}MB)</span>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Card className="bg-gray-900 text-white overflow-hidden border-none shadow-xl">
                                        <div className="bg-blue-600 px-6 py-3">
                                            <h4 className="font-bold uppercase tracking-wider text-xs">Summary & Rate Calculation</h4>
                                        </div>
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex justify-between items-center text-gray-400">
                                                <span>Gross Amount (Items + Detention)</span>
                                                <span className="font-mono text-white">₹{grossAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-gray-400">GST %</span>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        {...register('gst_percent')}
                                                        className="w-16 h-8 text-right bg-gray-800 border-gray-700 text-white"
                                                    />
                                                    <span>%</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400 text-sm">
                                                <span>SGST ({(watchedValues.gst_percent || 0) / 2}%)</span>
                                                <span className="font-mono text-white">₹{sgst.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-400 text-sm">
                                                <span>CGST ({(watchedValues.gst_percent || 0) / 2}%)</span>
                                                <span className="font-mono text-white">₹{cgst.toLocaleString()}</span>
                                            </div>
                                            <div className="pt-4 border-t border-gray-800 flex justify-between items-center text-xl font-bold">
                                                <span className="text-blue-400">Total Amount</span>
                                                <span className="text-2xl">₹{finalTotal.toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 italic mt-2 text-right">
                                                {numberToIndianWords(finalTotal)}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <div className="pt-4 space-y-2">
                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold" disabled={isSubmitting}>
                                            {isSubmitting ? (isEditMode ? 'Updating LR...' : 'Processing LR...') : (isEditMode ? 'Update LR' : 'Save & Generate LR')}
                                        </Button>
                                        <Button type="button" variant="outline" className="w-full" onClick={() => setActiveTab('part3')}>
                                            Back to Items
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </form>
            </CardContent>
        </Card>
    );
}
