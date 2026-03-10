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


type BillingParty = { id: number; name: string };
type LRRecord = {
    id: number; lr_no: string; lr_date: string; manifest_no: string;
    vehicle?: { registration_no: string };
    items?: { qty: number; rate: number }[];
    total_amount?: number;
};

type InvoiceItem = {
    id: string; description: string; sac_code: string;
    qty: number; unit: string; unit_rate: number;
    amount: number; cgst: number; sgst: number; total_amount: number;
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
    id: crypto.randomUUID(), description: '', sac_code: '', qty: 0,
    unit: 'KL', unit_rate: 0, amount: 0, cgst: 0, sgst: 0, total_amount: 0
});

// Initialize 5 pre-filled BEIL items
const initializeBEILItems = (): InvoiceItem[] => {
    return STATIC_LINE_ITEMS.map(staticItem => ({
        id: crypto.randomUUID(),
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
    const [businessType, setBusinessType] = useState<'BEIL' | 'PI'>('BEIL');
    const [billingParties, setBillingParties] = useState<BillingParty[]>([]);
    const [states, setStates] = useState<{ id: number; name: string }[]>([]);
    const [lrRecords, setLrRecords] = useState<LRRecord[]>([]);
    const [selectedLRs, setSelectedLRs] = useState<number[]>([]);
    const [showLRPopup, setShowLRPopup] = useState(false);
    const [items, setItems] = useState<InvoiceItem[]>(initializeBEILItems());
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [form, setForm] = useState({
        invoice_no: '', invoice_date: format(new Date(), 'yyyy-MM-dd'),
        billing_party_id: '', delivery_address: '', state_id: '',
        state_code: '', gst_number: '', po_number: '',
        payment_due_date: '', subject: '', hsn_code: '',
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

    const { totalAmount, gstAmount, sgstAmount, cgstAmount, grandTotal, amountWords } = useMemo(() => {
        let totalAmount = 0;
        if (businessType === 'BEIL') {
            totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
        } else {
            totalAmount = lrRecords
                .filter(lr => selectedLRs.includes(lr.id))
                .reduce((s, lr) => s + (lr.total_amount || 0), 0);
        }
        const sgstAmount = totalAmount * 0.09;
        const cgstAmount = totalAmount * 0.09;
        const gstAmount = sgstAmount + cgstAmount;
        const grandTotal = totalAmount + gstAmount;
        const amountWords = numberToIndianWords(Math.round(grandTotal));
        return { totalAmount, gstAmount, sgstAmount, cgstAmount, grandTotal, amountWords };
    }, [items, selectedLRs, businessType, lrRecords]);

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
                selectedLRs.forEach((id, i) => fd.append(`lr_ids[${i}]`, String(id)));
            }

            files.forEach(f => fd.append('attachments[]', f));

            await api.post('/invoices', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
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
                                            <Button onClick={() => setShowLRPopup(false)}>Confirm Selection</Button>
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
                                                    <td style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>₹{item.amount.toFixed(2)}</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>₹{item.cgst.toFixed(2)}</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>₹{item.sgst.toFixed(2)}</td>
                                                    <td style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right', color: '#0f172a' }}>₹{item.total_amount.toFixed(2)}</td>
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
                            {selectedLRs.length > 0 ? (
                                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr><th>Sr.</th><th>Date</th><th>LR No.</th><th>Manifest</th><th>Vehicle No.</th><th>Amount (₹)</th></tr>
                                    </thead>
                                    <tbody>
                                        {lrRecords.filter(lr => selectedLRs.includes(lr.id)).map((lr, idx) => (
                                            <tr key={lr.id}>
                                                <td style={{ padding: '10px 12px' }}>{idx + 1}</td>
                                                <td style={{ padding: '10px 12px' }}>{lr.lr_date}</td>
                                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{lr.lr_no}</td>
                                                <td style={{ padding: '10px 12px' }}>{lr.manifest_no || '-'}</td>
                                                <td style={{ padding: '10px 12px' }}>{lr.vehicle?.registration_no || '-'}</td>
                                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>₹{(lr.total_amount || 0).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                        <span style={{ fontWeight: 600 }}>₹{row.value.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: 'white' }}>
                                    <span style={{ fontWeight: 700, fontSize: 15 }}>Total Amount</span>
                                    <span style={{ fontWeight: 800, fontSize: 17 }}>₹{grandTotal.toFixed(2)}</span>
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
                        {submitting ? 'Saving...' : `Save ${businessType} Invoice`}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Amount:</span><strong>₹{item.amount.toFixed(2)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>CGST 9%:</span><span>₹{item.cgst.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>SGST 9%:</span><span>₹{item.sgst.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}><span>Total:</span><span>₹{item.total_amount.toFixed(2)}</span></div>
            </div>
            <Button className="mt-4 w-full" onClick={() => onAdd(item)} disabled={!item.description}>Add Item</Button>
        </div>
    );
}
