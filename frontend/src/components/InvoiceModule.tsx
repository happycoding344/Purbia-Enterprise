import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/axios';
import { numberToIndianWords } from '@/lib/numberToWords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Plus, Trash2, Download, FileText, Building2,
    ChevronRight, Upload, X, CheckSquare, Square
} from 'lucide-react';
import { format } from 'date-fns';
import { InvoicePrint } from './InvoicePrint';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


// Safe UUID fallback for non-secure contexts or older browsers
const generateId = () => {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        throw new Error('crypto.randomUUID not available');
    } catch (e) {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    }
};

type BillingParty = { id: number; name: string };
type LRRecord = {
    id: number; lr_no: string; lr_date: string; manifest_no: string;
    vehicle?: { registration_no: string };
    items?: { qty: number; rate: number }[];
    total_amount?: number;
    detention_days?: number;
    detention_rate?: number;
    total_detention_amount?: number;
    distance?: number;
    inward_time?: string;
    outward_time?: string;
};

type InvoiceItem = {
    id: string; description: string; sac_code: string;
    qty: number; unit: string; unit_rate: number;
    amount: number; cgst: number; sgst: number; total_amount: number;
    actual_qty?: number; // Hidden field for PI - actual quantity used in calculation
};

type PIInvoiceLineItem = {
    id: string;
    lr_id: number;
    lr_no: string;
    lr_date: string;
    manifest_no: string;
    vehicle_no: string;
    distance_range: string;
    qty_display: number; // Display value for user
    actual_qty: number; // Hidden - actual value for calculation
    unit: string;
    rate: number;
    amount: number;
    detention_days: number;
    detention_rate: number;
    detention_amount: number;
};

// Static predefined line items from the invoice template
const STATIC_LINE_ITEMS = [
    {
        description: 'Transportation & Loading / Unloading of empty contaminated drums in range of 10-20 Kms (one side).',
        sac_code: '996511',
        unit: 'Per trip'
    },
    {
        description: 'Transportation & Loading / Unloading of empty contaminated drums in range of 50-60 Kms (one side).',
        sac_code: '996511',
        unit: 'Per trip'
    },
    {
        description: 'Transportation & Loading / Unloading of empty contaminated drums in range of 70-80 Kms (one side).',
        sac_code: '996511',
        unit: 'Per trip'
    },
    {
        description: 'Transportation & Loading / Unloading of empty contaminated drums in range of 80-90 Kms (one side).',
        sac_code: '996511',
        unit: 'Per trip'
    },
    {
        description: 'Detention',
        sac_code: '996511',
        unit: 'Per day'
    }
];

const emptyItem = (): InvoiceItem => ({
    id: generateId(), description: '', sac_code: '', qty: 0,
    unit: 'KL', unit_rate: 0, amount: 0, cgst: 0, sgst: 0, total_amount: 0
});

// Initialize 5 pre-filled BEIL items
const initializeBEILItems = (): InvoiceItem[] => {
    return STATIC_LINE_ITEMS.map(staticItem => ({
        id: generateId(),
        description: staticItem.description,
        sac_code: staticItem.sac_code,
        unit: staticItem.unit,
        qty: 0,
        unit_rate: 0,
        amount: 0,
        cgst: 0,
        sgst: 0,
        total_amount: 0
    }));
};

export default function InvoiceModule() {
    // Check for edit invoice from localStorage
    const editInvoiceData = localStorage.getItem('editInvoice');
    const editInvoice = editInvoiceData ? JSON.parse(editInvoiceData) : null;
    const isEditMode = !!editInvoice;

    const [businessType, setBusinessType] = useState<'BEIL' | 'PI'>(editInvoice?.business_type || 'BEIL');
    const [billingParties, setBillingParties] = useState<BillingParty[]>([]);
    const [states, setStates] = useState<{ id: number; name: string }[]>([]);
    const [lrRecords, setLrRecords] = useState<LRRecord[]>([]);
    const [selectedLRs, setSelectedLRs] = useState<number[]>(editInvoice?.lrs?.map((lr: any) => lr.id) || []);
    const [showLRPopup, setShowLRPopup] = useState(false);
    const [items, setItems] = useState<InvoiceItem[]>(
        editInvoice?.items && editInvoice.business_type === 'BEIL'
            ? editInvoice.items.map((item: any) => ({
                id: item.id || generateId(),
                description: item.description || '',
                sac_code: item.sac_code || '',
                qty: item.qty || 0,
                unit: item.unit || '',
                unit_rate: item.rate || item.unit_rate || 0,
                amount: item.amount || 0,
                cgst: item.cgst || 0,
                sgst: item.sgst || 0,
                total_amount: item.total || item.total_amount || 0
            }))
            : initializeBEILItems()
    );
    const [piLineItems, setPiLineItems] = useState<PIInvoiceLineItem[]>(
        editInvoice?.items && editInvoice.business_type === 'PI'
            ? editInvoice.items.map((item: any) => {
                const lrData = editInvoice.lrs?.find((lr: any) => lr.id === item.lr_id);
                return {
                    id: item.id || generateId(),
                    lr_id: item.lr_id,
                    lr_no: item.lr_no,
                    lr_date: lrData?.lr_date || '',
                    manifest_no: lrData?.manifest_no || '',
                    vehicle_no: lrData?.vehicle?.registration_no || lrData?.vehicle_no || '',
                    distance_range: item.distance_range || '',
                    qty_display: item.qty_display || item.qty || 0,
                    actual_qty: item.actual_qty || item.qty || 0,
                    unit: item.unit || 'Per trip',
                    rate: item.rate || 0,
                    amount: item.amount || 0,
                    detention_days: item.detention_days || 0,
                    detention_rate: item.detention_rate || 0,
                    detention_amount: item.detention_amount || 0,
                };
            })
            : []
    );
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [form, setForm] = useState({
        invoice_no: editInvoice?.invoice_no || '',
        invoice_date: editInvoice?.invoice_date ? format(new Date(editInvoice.invoice_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        billing_party_id: editInvoice?.billing_party_id?.toString() || '',
        delivery_address: editInvoice?.delivery_address || '',
        state_id: editInvoice?.state_id?.toString() || '',
        state_code: editInvoice?.state_code || '',
        gst_number: editInvoice?.gst_number || '',
        po_number: editInvoice?.po_number || '',
        payment_due_date: editInvoice?.payment_due_date ? format(new Date(editInvoice.payment_due_date), 'yyyy-MM-dd') : '',
        subject: editInvoice?.subject || '',
        hsn_code: editInvoice?.hsn_code || '',
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [bpRes, lrRes, stateRes] = await Promise.all([
                    api.get('/masters/billing_parties').catch(e => ({ data: [] })),
                    api.get('/lrs').catch(e => ({ data: [] })),
                    api.get('/masters/states').catch(e => ({ data: [] }))
                ]);

                setBillingParties(Array.isArray(bpRes.data) ? bpRes.data : []);
                setLrRecords(Array.isArray(lrRes.data) ? lrRes.data : []);
                setStates(Array.isArray(stateRes.data) ? stateRes.data : []);
                setLoading(false);
            } catch (err: any) {
                console.error('Failed to load invoice module data:', err);
                setLoadError(err.response?.data?.message || 'Failed to load data');
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const updateItem = (id: string, field: keyof InvoiceItem, val: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };
            updated.amount = updated.qty * updated.unit_rate;
            updated.cgst = updated.amount * 0.09;
            updated.sgst = updated.amount * 0.09;
            updated.total_amount = updated.amount + updated.cgst + updated.sgst;
            return updated;
        }));
    };

    // Helper function to get distance range description
    const getDistanceRange = (distance: number): string => {
        if (distance >= 10 && distance < 20) return '10 To 20';
        if (distance >= 20 && distance < 50) return '20 To 50';
        if (distance >= 50 && distance < 60) return '50 To 60';
        if (distance >= 60 && distance < 70) return '60 To 70';
        if (distance >= 70 && distance < 80) return '70 To 80';
        if (distance >= 80 && distance < 90) return '80 To 90';
        if (distance >= 90) return '90+';
        return 'Unknown';
    };

    // Helper function to calculate detention days from inward and outward times
    const calculateDetentionDays = (inwardTime?: string, outwardTime?: string): number => {
        if (!inwardTime || !outwardTime) return 0;
        const inward = new Date(inwardTime);
        const outward = new Date(outwardTime);
        const diffMs = outward.getTime() - inward.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        // If difference is more than 1 day, detention starts from day 2
        return Math.max(0, Math.floor(diffDays) - 1);
    };

    // Update PI line item
    const updatePILineItem = (id: string, field: keyof PIInvoiceLineItem, val: string | number) => {
        setPiLineItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };
            // Recalculate amount based on actual_qty (not display qty)
            updated.amount = updated.actual_qty * updated.rate;
            // Recalculate detention amount
            updated.detention_amount = updated.detention_days * updated.detention_rate;
            return updated;
        }));
    };

    // Convert selected LRs to PI line items
    const convertLRsToPILineItems = () => {
        try {
            console.log('Converting LRs to PI Line Items. Selected IDs:', selectedLRs);
            console.log('Available LR Records:', lrRecords.length);
            
            const selectedLRData = lrRecords.filter(lr => selectedLRs.includes(lr.id));
            console.log('Found matching LR data:', selectedLRData.length);

            if (selectedLRData.length === 0) {
                console.warn('No LRs matched the selected IDs');
            }

            const lineItems: PIInvoiceLineItem[] = selectedLRData.map(lr => ({
                id: generateId(),
                lr_id: lr.id,
                lr_no: lr.lr_no,
                lr_date: lr.lr_date,
                manifest_no: lr.manifest_no || '',
                vehicle_no: lr.vehicle?.registration_no || '',
                distance_range: getDistanceRange(lr.distance || 0),
                qty_display: 1, // Default to 1 trip
                actual_qty: 1, // Default to 1 for calculation
                unit: 'Per trip',
                rate: 0,
                amount: 0,
                detention_days: lr.detention_days || calculateDetentionDays(lr.inward_time, lr.outward_time),
                detention_rate: lr.detention_rate || 0,
                detention_amount: lr.total_detention_amount || (lr.detention_days || calculateDetentionDays(lr.inward_time, lr.outward_time)) * (lr.detention_rate || 0),
            }));
            
            console.log('Generated PI Line Items:', lineItems);
            setPiLineItems(lineItems);
            setShowLRPopup(false);
        } catch (err) {
            console.error('Error in convertLRsToPILineItems:', err);
            alert('Failed to process selected LRs. Please check the console for details.');
        }
    };

    const { totalAmount, gstAmount, sgstAmount, cgstAmount, grandTotal, amountWords, totalActualQty } = useMemo(() => {
        let totalAmount = 0;
        let totalActualQty = 0;
        if (businessType === 'BEIL') {
            totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
        } else {
            // For PI, calculate from piLineItems (transportation + detention)
            const transportationTotal = piLineItems.reduce((s, i) => s + (i.amount || 0), 0);
            const detentionTotal = piLineItems.reduce((s, i) => s + (i.detention_amount || 0), 0);
            totalAmount = transportationTotal + detentionTotal;
            totalActualQty = piLineItems.reduce((s, i) => s + (i.actual_qty || 0), 0);
        }
        const sgstAmount = totalAmount * 0.09;
        const cgstAmount = totalAmount * 0.09;
        const gstAmount = sgstAmount + cgstAmount;
        const grandTotal = totalAmount + gstAmount;
        const amountWords = isNaN(grandTotal) ? 'ZERO ONLY' : numberToIndianWords(Math.round(grandTotal));
        return { totalAmount, gstAmount, sgstAmount, cgstAmount, grandTotal, amountWords, totalActualQty };
    }, [items, piLineItems, businessType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const fd = new FormData();
            fd.append('business_type', businessType);
            Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
            fd.append('amount', String(totalAmount));
            fd.append('gst_amount', String(gstAmount));
            fd.append('sgst_amount', String(sgstAmount));
            fd.append('cgst_amount', String(cgstAmount));
            fd.append('total_amount', String(grandTotal));
            fd.append('total_amount_words', amountWords);

            if (businessType === 'BEIL') {
                items.forEach((item, i) => {
                    Object.entries(item).forEach(([k, v]) => {
                        if (k !== 'id') {
                            // Map frontend field names to backend field names
                            const fieldName = k === 'unit_rate' ? 'rate' : k === 'total_amount' ? 'total' : k;
                            fd.append(`items[${i}][${fieldName}]`, String(v));
                        }
                    });
                });
            } else {
                // For PI, send both LR IDs and detailed line item data
                selectedLRs.forEach((id, i) => fd.append(`lr_ids[${i}]`, String(id)));

                // Send PI line items with all details
                piLineItems.forEach((item, i) => {
                    fd.append(`pi_items[${i}][lr_id]`, String(item.lr_id));
                    fd.append(`pi_items[${i}][lr_no]`, item.lr_no);
                    fd.append(`pi_items[${i}][distance_range]`, item.distance_range);
                    fd.append(`pi_items[${i}][qty_display]`, String(item.qty_display));
                    fd.append(`pi_items[${i}][actual_qty]`, String(item.actual_qty));
                    fd.append(`pi_items[${i}][rate]`, String(item.rate));
                    fd.append(`pi_items[${i}][amount]`, String(item.amount));
                    fd.append(`pi_items[${i}][detention_days]`, String(item.detention_days));
                    fd.append(`pi_items[${i}][detention_rate]`, String(item.detention_rate));
                    fd.append(`pi_items[${i}][detention_amount]`, String(item.detention_amount));
                });
            }

            files.forEach(f => fd.append('attachments[]', f));

            // Use PUT for edit mode, POST for create mode
            if (isEditMode && editInvoice?.id) {
                fd.append('_method', 'PUT');
                await api.post(`/invoices/${editInvoice.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/invoices', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            // Clear localStorage after successful save
            if (isEditMode) {
                localStorage.removeItem('editInvoice');
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                // Redirect to invoice history after successful save
                window.location.hash = '#/invoice-history';
            }, 2000);
        } catch (err: any) {
            console.error('Invoice save error:', err);
            setError(err.response?.data?.message || 'Failed to save invoice.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveAsPDF = async () => {
        try {
            // Create invoice data
            const invoiceData = {
                invoice_no: form.invoice_no,
                invoice_date: form.invoice_date,
                billing_party: billingParties.find(bp => bp.id === +form.billing_party_id)?.name || '',
                delivery_address: form.delivery_address,
                state: states.find(s => s.id === +form.state_id)?.name || '',
                state_code: form.state_code,
                gst_number: form.gst_number,
                po_number: form.po_number,
                payment_due_date: form.payment_due_date,
                subject: form.subject,
                hsn_code: form.hsn_code,
                items: businessType === 'BEIL' ? items.map(item => ({
                    description: item.description,
                    sac_code: item.sac_code,
                    qty: item.qty,
                    unit: item.unit,
                    unit_rate: item.unit_rate,
                    amount: item.amount,
                    cgst: item.cgst,
                    sgst: item.sgst,
                    total_amount: item.total_amount
                })) : lrRecords.filter(lr => selectedLRs.includes(lr.id)).map(lr => ({
                    description: `LR No: ${lr.lr_no}, Manifest: ${lr.manifest_no || '-'}`,
                    sac_code: form.hsn_code,
                    qty: 1,
                    unit: 'Trip',
                    unit_rate: lr.total_amount,
                    amount: lr.total_amount,
                    cgst: (lr.total_amount || 0) * 0.09,
                    sgst: (lr.total_amount || 0) * 0.09,
                    total_amount: (lr.total_amount || 0) * 1.18
                })),
                total_amount_before_tax: totalAmount,
                tax_amount: gstAmount,
                cgst_total: cgstAmount,
                sgst_total: sgstAmount,
                grand_total: grandTotal,
                amount_in_words: amountWords
            };

            // Set preview to render component
            setPreviewInvoice(invoiceData);

            // Wait for component to render
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get the invoice container
            const invoiceElement = document.getElementById('invoice-print-container');
            if (!invoiceElement) {
                throw new Error('Invoice element not found');
            }

            // Convert to canvas
            const canvas = await html2canvas(invoiceElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: 794, // A4 width in pixels at 96 DPI
                height: 1123 // A4 height in pixels at 96 DPI
            });

            // Convert canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210; // A4 width in mm
            const pdfHeight = 297; // A4 height in mm

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Download PDF
            const fileName = `${businessType}_Invoice_${form.invoice_no || 'draft'}_${format(new Date(), 'yyyyMMdd')}.pdf`;
            pdf.save(fileName);

            // Close preview
            setPreviewInvoice(null);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 16, color: '#64748b', marginBottom: 12 }}>Loading Invoice Module...</div>
                <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 18, color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>
                    ⚠️ Failed to Load Invoice Module
                </div>
                <div style={{ padding: 20, background: '#fee2e2', borderRadius: 12, color: '#991b1b', marginBottom: 16 }}>
                    {loadError}
                </div>
                <Button onClick={() => window.location.reload()}>Reload Page</Button>
            </div>
        );
    }

    return (
        <div>
            {/* Business Type Selector */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {(['BEIL', 'PI'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setBusinessType(type)}
                        style={{
                            flex: 1, padding: '16px 24px', borderRadius: 16, cursor: 'pointer',
                            border: businessType === type ? 'none' : '2px solid #e2e8f0',
                            background: businessType === type
                                ? type === 'BEIL'
                                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                                    : 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                                : 'white',
                            color: businessType === type ? 'white' : '#64748b',
                            transition: 'all 0.2s',
                            boxShadow: businessType === type ? '0 8px 24px rgba(59,130,246,0.3)' : 'none',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Building2 size={20} />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{type} Industries</div>
                                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                                    {type === 'BEIL' ? 'Manual line item entry' : 'Select from LR records'}
                                </div>
                            </div>
                            {businessType === type && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
                        </div>
                    </button>
                ))}
            </div>

            {success && (
                <div style={{ padding: '14px 20px', borderRadius: 12, background: '#dcfce7', color: '#166534', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ✓ Invoice saved successfully!
                </div>
            )}
            {error && (
                <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', marginBottom: 16 }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Section 1: Basic Invoice Details */}
                <div className="form-section">
                    <div className="form-section-title">
                        <FileText size={16} color="#3b82f6" />
                        Invoice Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <div>
                            <Label>Invoice Number *</Label>
                            <Input className="mt-1" placeholder="INV-2025-001" value={form.invoice_no}
                                onChange={e => setForm(p => ({ ...p, invoice_no: e.target.value }))} required />
                        </div>
                        <div>
                            <Label>Invoice Date *</Label>
                            <Input className="mt-1" type="date" value={form.invoice_date}
                                onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} required />
                        </div>
                        <div>
                            <Label>Billing Party *</Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                                value={form.billing_party_id}
                                onChange={e => setForm(p => ({ ...p, billing_party_id: e.target.value }))} required
                            >
                                <option value="">Select billing party</option>
                                {billingParties.map(bp => <option key={bp.id} value={bp.id}>{bp.name}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <Label>Delivery Address</Label>
                            <Input className="mt-1" placeholder="Full delivery address" value={form.delivery_address}
                                onChange={e => setForm(p => ({ ...p, delivery_address: e.target.value }))} />
                        </div>
                        <div>
                            <Label>State *</Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                                value={form.state_id}
                                onChange={e => setForm(p => ({ ...p, state_id: e.target.value }))} required
                            >
                                <option value="">Select state</option>
                                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label>State Code</Label>
                            <Input className="mt-1" placeholder="e.g. 24" value={form.state_code}
                                onChange={e => setForm(p => ({ ...p, state_code: e.target.value }))} />
                        </div>
                        <div>
                            <Label>GST Number</Label>
                            <Input className="mt-1" placeholder="GSTIN" value={form.gst_number}
                                onChange={e => setForm(p => ({ ...p, gst_number: e.target.value }))} />
                        </div>
                        <div>
                            <Label>PO Number</Label>
                            <Input className="mt-1" placeholder="PO-XXXX" value={form.po_number}
                                onChange={e => setForm(p => ({ ...p, po_number: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Payment Due Date</Label>
                            <Input className="mt-1" type="date" value={form.payment_due_date}
                                onChange={e => setForm(p => ({ ...p, payment_due_date: e.target.value }))} />
                        </div>
                        <div>
                            <Label>HSN Code</Label>
                            <Input className="mt-1" placeholder="HSN/SAC code" value={form.hsn_code}
                                onChange={e => setForm(p => ({ ...p, hsn_code: e.target.value }))} />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <Label>Subject</Label>
                            <Input className="mt-1" placeholder="Invoice subject/description" value={form.subject}
                                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                        </div>
                    </div>
                </div>

                {/* Rest of the form... (keeping original code for LR Data, Totals, etc.) */}
                {/* For brevity, I'm truncating here - the full component would include all sections */}

                <div className="form-section">
                    <div className="form-section-title">
                        <FileText size={16} color="#8b5cf6" />
                        {businessType === 'BEIL' ? 'LR Data (Line Items)' : 'Select LR Records'}
                        <Dialog open={showLRPopup} onOpenChange={setShowLRPopup}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" type="button" style={{ marginLeft: 'auto' }}>
                                    <Plus size={14} />
                                    {businessType === 'BEIL' ? 'Add via Popup' : 'Select LRs'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent style={{ maxWidth: 750 }}>
                                <DialogHeader>
                                    <DialogTitle>
                                        {businessType === 'BEIL' ? 'Add LR Line Item' : 'Select LR Records for Invoice'}
                                    </DialogTitle>
                                </DialogHeader>
                                {businessType === 'PI' ? (
                                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead>
                                                <tr style={{ background: '#f8fafc' }}>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left', width: 40 }}>#</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Date</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>LR No.</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Manifest</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Vehicle</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lrRecords.map(lr => {
                                                    const checked = selectedLRs.includes(lr.id);
                                                    return (
                                                        <tr key={lr.id}
                                                            onClick={() => setSelectedLRs(p => checked ? p.filter(id => id !== lr.id) : [...p, lr.id])}
                                                            style={{ cursor: 'pointer', background: checked ? '#eff6ff' : 'white', borderBottom: '1px solid #f1f5f9' }}
                                                        >
                                                            <td style={{ padding: '10px 12px' }}>
                                                                {checked ? <CheckSquare size={16} color="#3b82f6" /> : <Square size={16} color="#94a3b8" />}
                                                            </td>
                                                            <td style={{ padding: '10px 12px' }}>{lr.lr_date}</td>
                                                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{lr.lr_no}</td>
                                                            <td style={{ padding: '10px 12px' }}>{lr.manifest_no || '-'}</td>
                                                            <td style={{ padding: '10px 12px' }}>{lr.vehicle?.registration_no || '-'}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                                                                ₹{(lr.total_amount || 0).toLocaleString('en-IN')}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 13, color: '#64748b' }}>{selectedLRs.length} LRs selected</span>
                                            <Button onClick={convertLRsToPILineItems}>Confirm Selection</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <BEILItemPopup onAdd={(item) => { setItems(p => [...p, item]); setShowLRPopup(false); }} />
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    {businessType === 'BEIL' ? (
                        <div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th>Sr.</th><th>Item Description</th><th>SAC Code</th>
                                            <th>Qty</th><th>Unit</th><th>Unit Rate (₹)</th>
                                            <th>Amount (₹)</th><th>CGST 9%</th><th>SGST 9%</th><th>Total (₹)</th><th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => {
                                            const isStaticRow = idx < 5; // First 5 rows are static
                                            return (
                                                <tr key={item.id} style={{ background: isStaticRow ? '#f8fafc' : 'white' }}>
                                                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: isStaticRow ? 600 : 400 }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px 12px', fontSize: 11, color: '#374151', lineHeight: 1.4 }}>
                                                        {isStaticRow ? (
                                                            <span style={{ fontWeight: 500 }}>{item.description}</span>
                                                        ) : (
                                                            <Input
                                                                value={item.description}
                                                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                                                placeholder="Enter description"
                                                                style={{ fontSize: 11 }}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                                        {isStaticRow ? item.sac_code : (
                                                            <Input
                                                                value={item.sac_code}
                                                                onChange={e => updateItem(item.id, 'sac_code', e.target.value)}
                                                                style={{ width: 80, textAlign: 'center' }}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '4px 8px' }}>
                                                        <Input
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={e => updateItem(item.id, 'qty', +e.target.value)}
                                                            style={{ width: 70 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                                                        {isStaticRow ? item.unit : (
                                                            <Input
                                                                value={item.unit}
                                                                onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                                                style={{ width: 80, textAlign: 'center' }}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '4px 8px' }}>
                                                        <Input
                                                            type="number"
                                                            value={item.unit_rate}
                                                            onChange={e => updateItem(item.id, 'unit_rate', +e.target.value)}
                                                            style={{ width: 100 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>₹{(item.amount || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>₹{(item.cgst || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>₹{(item.sgst || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right', color: '#0f172a' }}>₹{(item.total_amount || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                                        {!isStaticRow && (
                                                            <button type="button" onClick={() => setItems(p => p.filter(i => i.id !== item.id))}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" onClick={() => setItems(p => [...p, emptyItem()])}
                                style={{ marginTop: 12, padding: '10px 20px', borderRadius: 8, border: '2px dashed #3b82f6', background: '#eff6ff', cursor: 'pointer', color: '#3b82f6', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                                <Plus size={16} /> Add Extra Line Item
                            </button>
                        </div>
                    ) : (
                        <div>
                            {piLineItems.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr>
                                                <th>Sr.</th>
                                                <th>Date</th>
                                                <th>LR No.</th>
                                                <th>Manifest</th>
                                                <th>Vehicle No.</th>
                                                <th>Distance</th>
                                                <th>Qty<br/><small style={{fontWeight: 400, color: '#94a3b8'}}>(Display)</small></th>
                                                <th>Actual Qty<br/><small style={{fontWeight: 400, color: '#94a3b8'}}>(Hidden)</small></th>
                                                <th>Rate (₹)</th>
                                                <th>Amount (₹)</th>
                                                <th>Detention<br/>(Days)</th>
                                                <th>Det. Rate<br/>(₹/day)</th>
                                                <th>Det. Amt<br/>(₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {piLineItems.map((item, idx) => (
                                                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                                                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{item.lr_date}</td>
                                                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#3b82f6' }}>{item.lr_no}</td>
                                                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{item.manifest_no || '-'}</td>
                                                    <td style={{ padding: '8px 10px', fontSize: 11 }}>{item.vehicle_no || '-'}</td>
                                                    <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'center' }}>{item.distance_range}</td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input
                                                            type="number"
                                                            value={item.qty_display}
                                                            onChange={(e) => updatePILineItem(item.id, 'qty_display', +e.target.value)}
                                                            style={{ width: 60, textAlign: 'center', fontSize: 11 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input
                                                            type="number"
                                                            value={item.actual_qty}
                                                            onChange={(e) => updatePILineItem(item.id, 'actual_qty', +e.target.value)}
                                                            style={{ width: 70, textAlign: 'center', fontSize: 11, background: '#fef3c7', border: '1px solid #fbbf24' }}
                                                            title="This value is used for calculation"
                                                        />
                                                    </td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => updatePILineItem(item.id, 'rate', +e.target.value)}
                                                            style={{ width: 80, textAlign: 'right', fontSize: 11 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>₹{(item.amount || 0).toFixed(2)}</td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input
                                                            type="number"
                                                            value={item.detention_days}
                                                            onChange={(e) => updatePILineItem(item.id, 'detention_days', +e.target.value)}
                                                            style={{ width: 55, textAlign: 'center', fontSize: 11 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input
                                                            type="number"
                                                            value={item.detention_rate}
                                                            onChange={(e) => updatePILineItem(item.id, 'detention_rate', +e.target.value)}
                                                            style={{ width: 70, textAlign: 'right', fontSize: 11 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#ea580c' }}>₹{(item.detention_amount || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                                                <td colSpan={6} style={{ padding: '10px 12px', textAlign: 'right' }}>Totals:</td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    {piLineItems.reduce((s, i) => s + (i.qty_display || 0), 0)}
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    {piLineItems.reduce((s, i) => s + (i.actual_qty || 0), 0)}
                                                </td>
                                                <td></td>
                                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                                    ₹{piLineItems.reduce((s, i) => s + (i.amount || 0), 0).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    {piLineItems.reduce((s, i) => s + (i.detention_days || 0), 0)}
                                                </td>
                                                <td></td>
                                                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ea580c' }}>
                                                    ₹{piLineItems.reduce((s, i) => s + (i.detention_amount || 0), 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                    <div style={{ marginTop: 12, padding: 12, background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                                        <strong>Note:</strong> The "Actual Qty" column (highlighted in yellow) is used for amount calculation (Actual Qty × Rate).
                                        The "Qty (Display)" is shown to users for reference. Detention is auto-calculated from LR inward/outward times.
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: 12 }}>
                                    Click "Select LRs" to choose LR records for this invoice
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Totals Section */}
                <div className="form-section">
                    <div className="form-section-title">Financial Summary</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <div style={{ background: '#f8fafc', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                {[
                                    { label: 'Amount (Subtotal)', value: totalAmount },
                                    { label: 'SGST @ 9%', value: sgstAmount },
                                    { label: 'CGST @ 9%', value: cgstAmount },
                                    { label: 'GST Total (18%)', value: gstAmount },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                                        <span style={{ color: '#64748b' }}>{row.label}</span>
                                        <span style={{ fontWeight: 600 }}>₹{(row.value || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: 'white' }}>
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>Total Amount</span>
                                    <span style={{ fontWeight: 800, fontSize: 17 }}>₹{(grandTotal || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div style={{ marginTop: 12, padding: 14, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd', fontSize: 12, color: '#0369a1' }}>
                                <strong>In Words:</strong> {amountWords}
                            </div>
                        </div>
                        <div>
                            <Label>Document Uploads</Label>
                            <div
                                style={{ marginTop: 8, border: '2px dashed #cbd5e0', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                                onClick={() => document.getElementById('invoice-files')?.click()}
                            >
                                <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: 13, color: '#64748b' }}>Click to upload files (max 50MB each)</div>
                                <input id="invoice-files" type="file" multiple hidden
                                    onChange={e => setFiles(Array.from(e.target.files || []))} />
                            </div>
                            {files.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                    {files.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 6, fontSize: 12 }}>
                                            <span style={{ color: '#374151' }}>{f.name}</span>
                                            <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <Button type="button" variant="outline" onClick={handleSaveAsPDF} disabled={!form.invoice_no}>
                        <Download size={16} className="mr-2" />
                        Save as PDF
                    </Button>
                    <Button type="button" variant="outline">Cancel</Button>
                    <Button type="submit" disabled={submitting}
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', padding: '10px 28px' }}>
                        {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? `Update ${businessType} Invoice` : `Save ${businessType} Invoice`)}
                    </Button>
                </div>
            </form>

            {/* Hidden invoice component for PDF generation */}
            {previewInvoice && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <InvoicePrint invoice={previewInvoice} businessType={businessType} />
                </div>
            )}
        </div>
    );
}

function BEILItemPopup({ onAdd }: { onAdd: (item: InvoiceItem) => void }) {
    const [item, setItem] = useState(emptyItem());
    const updateField = (field: keyof InvoiceItem, val: string | number) => {
        setItem(prev => {
            const updated = { ...prev, [field]: val };
            updated.amount = updated.qty * updated.unit_rate;
            updated.cgst = updated.amount * 0.09;
            updated.sgst = updated.amount * 0.09;
            updated.total_amount = updated.amount + updated.cgst + updated.sgst;
            return updated;
        });
    };
    return (
        <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <Label>Item Description *</Label>
                    <Input className="mt-1" value={item.description} onChange={e => updateField('description', e.target.value)} placeholder="e.g. HSD Transportation" />
                </div>
                <div><Label>SAC Code</Label><Input className="mt-1" value={item.sac_code} onChange={e => updateField('sac_code', e.target.value)} /></div>
                <div><Label>Unit</Label><Input className="mt-1" value={item.unit} onChange={e => updateField('unit', e.target.value)} /></div>
                <div><Label>Quantity</Label><Input className="mt-1" type="number" value={item.qty} onChange={e => updateField('qty', +e.target.value)} /></div>
                <div><Label>Unit Rate (₹)</Label><Input className="mt-1" type="number" value={item.unit_rate} onChange={e => updateField('unit_rate', +e.target.value)} /></div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 10, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Amount:</span><strong>₹{(item.amount || 0).toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>CGST 9%:</span><span>₹{(item.cgst || 0).toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>SGST 9%:</span><span>₹{(item.sgst || 0).toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}><span>Total:</span><span>₹{(item.total_amount || 0).toFixed(2)}</span></div>
            </div>
            <Button className="mt-4 w-full" onClick={() => onAdd(item)} disabled={!item.description}>Add Item</Button>
        </div>
    );
}
