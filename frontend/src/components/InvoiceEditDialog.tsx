import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/axios';
import { numberToIndianWords } from '@/lib/numberToWords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Save, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { MasterSelect } from './MasterSelect';

// ─── Types ────────────────────────────────────────────────────────────────────

type StateItem = { id: number; name: string };

type LineItem = {
    id: string | number;
    description: string;
    sac_code: string;
    qty: number;
    unit: string;
    unit_rate: number;
    amount: number;
    cgst: number;
    sgst: number;
    total_amount: number;
};

type PILineItem = {
    id: string | number;
    lr_no: string;
    distance_range: string;
    qty_display: number;
    actual_qty: number;
    unit: string;
    rate: number;
    amount: number;
    detention_days: number;
    detention_rate: number;
    detention_amount: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = () => 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

const calcItem = (item: LineItem): LineItem => {
    const amount = (item.qty || 0) * (item.unit_rate || 0);
    const cgst = amount * 0.09;
    const sgst = amount * 0.09;
    return { ...item, amount, cgst, sgst, total_amount: amount + cgst + sgst };
};

const calcPIItem = (item: PILineItem): PILineItem => {
    const amount = (item.actual_qty || 0) * (item.rate || 0);
    const detention_amount = (item.detention_days || 0) * (item.detention_rate || 0);
    return { ...item, amount, detention_amount };
};

// ─── Component ────────────────────────────────────────────────────────────────

interface InvoiceEditDialogProps {
    invoice: any;           // the full invoice object from GET /invoices/{id}
    open: boolean;
    onClose: () => void;    // called when dialog should close (cancel or after save)
    onSaved: () => void;    // called after successful save to refresh list
}

export default function InvoiceEditDialog({ invoice, open, onClose, onSaved }: InvoiceEditDialogProps) {
    const businessType: 'BEIL' | 'PI' = invoice?.business_type || 'BEIL';

    // ── State ────────────────────────────────────────────────────────────────
    const [states, setStates] = useState<StateItem[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataError, setDataError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState(false);

    // Resolve IDs from nested objects (API returns billing_party: {id, name})
    const resolveId = (inv: any, flatKey: string, nestedKey: string): string => {
        if (!inv) return '';
        if (inv[flatKey]) return String(inv[flatKey]);
        if (inv[nestedKey]?.id) return String(inv[nestedKey].id);
        return '';
    };

    const [form, setForm] = useState({
        invoice_no: invoice?.invoice_no || '',
        invoice_date: invoice?.invoice_date
            ? format(new Date(invoice.invoice_date), 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd'),
        billing_party_id: resolveId(invoice, 'billing_party_id', 'billing_party'),
        state_id: resolveId(invoice, 'state_id', 'state'),
        delivery_address: invoice?.delivery_address || '',
        state_code: invoice?.state_code || '',
        gst_number: invoice?.gst_number || '',
        po_number: invoice?.po_number || '',
        payment_due_date: invoice?.payment_due_date
            ? format(new Date(invoice.payment_due_date), 'yyyy-MM-dd')
            : '',
        subject: invoice?.subject || '',
        hsn_code: invoice?.hsn_code || '',
    });

    // BEIL line items
    const [items, setItems] = useState<LineItem[]>(() => {
        if (businessType === 'BEIL' && invoice?.items?.length) {
            return invoice.items.map((it: any): LineItem => ({
                id: it.id || genId(),
                description: it.description || '',
                sac_code: it.sac_code || '996511',
                qty: Number(it.qty) || 0,
                unit: it.unit || 'Per trip',
                unit_rate: Number(it.rate ?? it.unit_rate) || 0,
                amount: Number(it.amount) || 0,
                cgst: Number(it.cgst) || 0,
                sgst: Number(it.sgst) || 0,
                total_amount: Number(it.total ?? it.total_amount) || 0,
            }));
        }
        return [];
    });

    // PI line items
    const [piItems, setPiItems] = useState<PILineItem[]>(() => {
        if (businessType === 'PI' && invoice?.items?.length) {
            return invoice.items.map((it: any): PILineItem => ({
                id: it.id || genId(),
                lr_no: it.lr_no || '',
                distance_range: it.distance_range || '',
                qty_display: Number(it.qty_display ?? it.qty) || 0,
                actual_qty: Number(it.actual_qty ?? it.qty) || 0,
                unit: it.unit || 'Per trip',
                rate: Number(it.rate) || 0,
                amount: Number(it.amount) || 0,
                detention_days: Number(it.detention_days) || 0,
                detention_rate: Number(it.detention_rate) || 0,
                detention_amount: Number(it.detention_amount) || 0,
            }));
        }
        return [];
    });

    // ── Load dropdown data ────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setDataLoading(true);
        setDataError('');
        api.get('/masters/states').then(res => {
            setStates(Array.isArray(res.data) ? res.data : []);
            setDataLoading(false);
        }).catch(() => {
            setDataError('Failed to load dropdown data. Please refresh.');
            setDataLoading(false);
        });
    }, [open]);

    // ── Totals ────────────────────────────────────────────────────────────────
    const { totalAmount, gstAmount, grandTotal, amountWords } = useMemo(() => {
        let totalAmount = 0;
        if (businessType === 'BEIL') {
            totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
        } else {
            const transport = piItems.reduce((s, i) => s + (i.amount || 0), 0);
            const detention = piItems.reduce((s, i) => s + (i.detention_amount || 0), 0);
            totalAmount = transport + detention;
        }
        const sgst = totalAmount * 0.09;
        const cgst = totalAmount * 0.09;
        const gstAmount = sgst + cgst;
        const grandTotal = totalAmount + gstAmount;
        const amountWords = isNaN(grandTotal) ? 'ZERO ONLY' : numberToIndianWords(Math.round(grandTotal));
        return { totalAmount, gstAmount, sgstAmount: sgst, cgstAmount: cgst, grandTotal, amountWords };
    }, [items, piItems, businessType]);

    // ── Item helpers ──────────────────────────────────────────────────────────
    const updateItem = (id: string | number, field: keyof LineItem, val: string | number) => {
        setItems(prev => prev.map(item => item.id === id ? calcItem({ ...item, [field]: val }) : item));
    };

    const updatePIItem = (id: string | number, field: keyof PILineItem, val: string | number) => {
        setPiItems(prev => prev.map(item => item.id === id ? calcPIItem({ ...item, [field]: val }) : item));
    };

    const addBEILItem = () => {
        setItems(prev => [...prev, calcItem({
            id: genId(), description: '', sac_code: '996511', qty: 0,
            unit: 'Per trip', unit_rate: 0, amount: 0, cgst: 0, sgst: 0, total_amount: 0,
        })]);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSubmitting(true);
        setSubmitError('');
        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append('business_type', businessType);
            Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
            fd.append('amount', String(totalAmount));
            fd.append('gst_amount', String(gstAmount));
            fd.append('sgst_amount', String(totalAmount * 0.09));
            fd.append('cgst_amount', String(totalAmount * 0.09));
            fd.append('total_amount', String(grandTotal));
            fd.append('total_amount_words', amountWords);

            if (businessType === 'BEIL') {
                items.forEach((item, i) => {
                    fd.append(`items[${i}][description]`, item.description);
                    fd.append(`items[${i}][sac_code]`, item.sac_code);
                    fd.append(`items[${i}][qty]`, String(item.qty));
                    fd.append(`items[${i}][unit]`, item.unit);
                    fd.append(`items[${i}][rate]`, String(item.unit_rate));
                    fd.append(`items[${i}][amount]`, String(item.amount));
                    fd.append(`items[${i}][cgst]`, String(item.cgst));
                    fd.append(`items[${i}][sgst]`, String(item.sgst));
                    fd.append(`items[${i}][total]`, String(item.total_amount));
                });
            } else {
                piItems.forEach((item, i) => {
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

            await api.post(`/invoices/${invoice.id}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSaved();
                onClose();
            }, 1500);
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || 'Failed to save invoice. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: 4 };
    const inputStyle = { fontSize: 13 };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle style={{ fontSize: 18, fontWeight: 700 }}>
                        Edit {businessType} Invoice —{' '}
                        <span style={{ color: businessType === 'BEIL' ? '#3b82f6' : '#8b5cf6' }}>
                            {invoice?.invoice_no}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                {/* Loading / Error states for dropdown data */}
                {dataLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#64748b' }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Loading form data...
                    </div>
                )}
                {dataError && (
                    <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 12 }}>
                        {dataError}
                    </div>
                )}

                {!dataLoading && !dataError && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8 }}>

                        {/* ── Success / Error banners ────────────────────────── */}
                        {success && (
                            <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, fontWeight: 600 }}>
                                ✓ Invoice updated successfully!
                            </div>
                        )}
                        {submitError && (
                            <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: 8 }}>
                                {submitError}
                            </div>
                        )}

                        {/* ── Section 1: Basic Details ───────────────────────── */}
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
                                Invoice Details
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>Invoice Number *</Label>
                                    <Input style={inputStyle} value={form.invoice_no}
                                        onChange={e => setForm(p => ({ ...p, invoice_no: e.target.value }))} />
                                </div>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>Invoice Date *</Label>
                                    <Input style={inputStyle} type="date" value={form.invoice_date}
                                        onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} />
                                </div>
                                <div style={fieldStyle}>
                                    <MasterSelect
                                        type="billing_parties"
                                        label="Billing Party *"
                                        placeholder="Select billing party"
                                        value={form.billing_party_id ? +form.billing_party_id : undefined}
                                        onChange={(val) => setForm(p => ({ ...p, billing_party_id: String(val) }))}
                                    />
                                </div>
                                <div style={{ ...fieldStyle, gridColumn: 'span 3' }}>
                                    <MasterSelect
                                        type="delivery_places"
                                        label="Delivery Address"
                                        placeholder="Full delivery address"
                                        valueKey="name"
                                        value={form.delivery_address}
                                        onChange={(val) => setForm(p => ({ ...p, delivery_address: String(val) }))}
                                    />
                                </div>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>State</Label>
                                    <select
                                        style={{ height: 36, width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0 8px', fontSize: 13 }}
                                        value={form.state_id}
                                        onChange={e => setForm(p => ({ ...p, state_id: e.target.value }))}
                                    >
                                        <option value="">Select state</option>
                                        {states.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>State Code</Label>
                                    <Input style={inputStyle} value={form.state_code}
                                        onChange={e => setForm(p => ({ ...p, state_code: e.target.value }))} />
                                </div>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>GST Number</Label>
                                    <Input style={inputStyle} value={form.gst_number}
                                        onChange={e => setForm(p => ({ ...p, gst_number: e.target.value }))} />
                                </div>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>PO Number</Label>
                                    <Input style={inputStyle} value={form.po_number}
                                        onChange={e => setForm(p => ({ ...p, po_number: e.target.value }))} />
                                </div>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>Payment Due Date</Label>
                                    <Input style={inputStyle} type="date" value={form.payment_due_date}
                                        onChange={e => setForm(p => ({ ...p, payment_due_date: e.target.value }))} />
                                </div>
                                <div style={fieldStyle}>
                                    <Label style={inputStyle}>HSN Code</Label>
                                    <Input style={inputStyle} value={form.hsn_code}
                                        onChange={e => setForm(p => ({ ...p, hsn_code: e.target.value }))} />
                                </div>
                                <div style={{ ...fieldStyle, gridColumn: 'span 3' }}>
                                    <Label style={inputStyle}>Subject</Label>
                                    <Input style={inputStyle} value={form.subject}
                                        onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Line Items ──────────────────────────── */}
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{businessType === 'BEIL' ? 'Line Items' : 'PI Invoice Line Items'}</span>
                                {businessType === 'BEIL' && (
                                    <button type="button" onClick={addBEILItem}
                                        style={{ padding: '5px 12px', background: '#eff6ff', color: '#3b82f6', border: '1px dashed #3b82f6', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                        + Add Row
                                    </button>
                                )}
                            </div>

                            {businessType === 'BEIL' ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                {['#', 'Description', 'SAC', 'Qty', 'Unit', 'Rate (₹)', 'Amount', 'CGST 9%', 'SGST 9%', 'Total', ''].map(h => (
                                                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => {
                                                const isStatic = idx < 5;
                                                return (
                                                    <tr key={item.id} style={{ background: isStatic ? '#f8fafc' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '6px 10px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                                                        <td style={{ padding: '4px 6px', minWidth: 200 }}>
                                                            {isStatic
                                                                ? <span style={{ fontSize: 11 }}>{item.description}</span>
                                                                : <Input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} style={{ fontSize: 11, height: 32 }} />
                                                            }
                                                        </td>
                                                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{item.sac_code}</td>
                                                        <td style={{ padding: '4px 6px' }}>
                                                            <Input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', +e.target.value)} style={{ width: 70, height: 32, fontSize: 12 }} />
                                                        </td>
                                                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{item.unit}</td>
                                                        <td style={{ padding: '4px 6px' }}>
                                                            <Input type="number" value={item.unit_rate} onChange={e => updateItem(item.id, 'unit_rate', +e.target.value)} style={{ width: 90, height: 32, fontSize: 12 }} />
                                                        </td>
                                                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>₹{(item.amount || 0).toFixed(0)}</td>
                                                        <td style={{ padding: '6px 10px', color: '#64748b' }}>₹{(item.cgst || 0).toFixed(0)}</td>
                                                        <td style={{ padding: '6px 10px', color: '#64748b' }}>₹{(item.sgst || 0).toFixed(0)}</td>
                                                        <td style={{ padding: '6px 10px', fontWeight: 700 }}>₹{(item.total_amount || 0).toFixed(0)}</td>
                                                        <td style={{ padding: '4px 6px' }}>
                                                            {!isStatic && (
                                                                <button type="button" onClick={() => setItems(p => p.filter(i => i.id !== item.id))}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {items.length === 0 && (
                                        <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                            No line items. Click "+ Add Row" to add items.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* PI Items Table */
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ background: '#f5f3ff' }}>
                                                {['LR No.', 'Distance Range', 'Qty (Display)', 'Actual Qty', 'Unit', 'Rate (₹)', 'Amount', 'Det. Days', 'Det. Rate', 'Det. Amt'].map(h => (
                                                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#6d28d9', borderBottom: '1px solid #ede9fe', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {piItems.map((item) => (
                                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{item.lr_no}</td>
                                                    <td style={{ padding: '6px 10px', color: '#64748b' }}>{item.distance_range}</td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input type="number" value={item.qty_display} onChange={e => updatePIItem(item.id, 'qty_display', +e.target.value)} style={{ width: 70, height: 32, fontSize: 12 }} />
                                                    </td>
                                                    <td style={{ padding: '4px 6px', background: '#fefce8' }}>
                                                        <Input type="number" value={item.actual_qty} onChange={e => updatePIItem(item.id, 'actual_qty', +e.target.value)} style={{ width: 70, height: 32, fontSize: 12, background: '#fef9c3' }} />
                                                    </td>
                                                    <td style={{ padding: '6px 10px', color: '#64748b' }}>{item.unit}</td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input type="number" value={item.rate} onChange={e => updatePIItem(item.id, 'rate', +e.target.value)} style={{ width: 90, height: 32, fontSize: 12 }} />
                                                    </td>
                                                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>₹{(item.amount || 0).toFixed(0)}</td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input type="number" value={item.detention_days} onChange={e => updatePIItem(item.id, 'detention_days', +e.target.value)} style={{ width: 70, height: 32, fontSize: 12 }} />
                                                    </td>
                                                    <td style={{ padding: '4px 6px' }}>
                                                        <Input type="number" value={item.detention_rate} onChange={e => updatePIItem(item.id, 'detention_rate', +e.target.value)} style={{ width: 70, height: 32, fontSize: 12 }} />
                                                    </td>
                                                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>₹{(item.detention_amount || 0).toFixed(0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {piItems.length === 0 && (
                                        <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                            No PI line items found for this invoice.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Section 3: Totals ──────────────────────────────── */}
                        <div style={{ background: '#0f172a', color: 'white', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Amount in Words</div>
                                <div style={{ fontSize: 12, fontStyle: 'italic', color: '#cbd5e1' }}>{amountWords}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 24 }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Subtotal</div>
                                    <div style={{ fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>GST (18%)</div>
                                    <div style={{ fontWeight: 700 }}>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Grand Total</div>
                                    <div style={{ fontWeight: 800, fontSize: 18, color: '#38bdf8' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>

                        {/* ── Actions ────────────────────────────────────────── */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                                <X size={16} className="mr-2" /> Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={submitting || success}
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none', padding: '10px 28px' }}
                            >
                                {submitting
                                    ? <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</>
                                    : <><Save size={16} className="mr-2" /> Update {businessType} Invoice</>
                                }
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
