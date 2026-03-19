import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/axios';
import { numberToIndianWords } from '@/lib/numberToWords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Plus, Trash2, Download, FileText, Building2,
    ChevronRight, Upload, X
} from 'lucide-react';
import { format } from 'date-fns';
import { InvoicePrint } from './InvoicePrint';
import { MasterSelect } from './MasterSelect';
import { Checkbox } from '@/components/ui/checkbox';
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
    billing_party_id?: number;
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
    qty_display: string; // Display value for user (now string)
    actual_qty: number; // Hidden - actual value for calculation
    unit: string;
    rate: number;
    amount: number;
    detention_days: number;
    detention_rate: number;
    detention_amount: number;
    inward_time?: string;
    outward_time?: string;
};

// Static predefined line items from the invoice template
const STATIC_LINE_ITEMS = [
    {
        description: 'Item code - 45696\nEmpty Cont. Drum - Dahej to Beil Dahej',
        sac_code: '998399',
        unit: 'Per trip'
    },
    {
        description: 'Item code - 45697\nEmpty Cont. Drum - Saykha to Beil Dahej',
        sac_code: '998399',
        unit: 'Per trip'
    },
    {
        description: 'Item code - 45698\nEmpty Cont. Drum - Jhagadiya to Beil Dahej',
        sac_code: '998399',
        unit: 'Per trip'
    },
    {
        description: 'Item code - 45699\nEmpty Cont. Drum - Panoli to Beil Dahej',
        sac_code: '998399',
        unit: 'Per trip'
    },
    {
        description: 'Item code - 45700\nEmpty Cont. Drum - Ankleshwar to Beil Dahej',
        sac_code: '998399',
        unit: 'Per trip'
    },
    {
        description: 'Detention',
        sac_code: '998399',
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

// Sub-component for PI LR Selection Dialog Content
export function PIDialogContent({ availableLRs, filters, setFilters, billingParties, onAdd }: any) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const handleToggle = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleToggleAll = () => {
        if (selectedIds.length === availableLRs.length && availableLRs.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(availableLRs.map((lr: any) => lr.id));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ flex: '1 1 120px' }}>
                    <Label style={{ fontSize: 11 }}>LR No.</Label>
                    <Input 
                        placeholder="Search LR..."
                        value={filters.lr_no} 
                        onChange={e => setFilters({ ...filters, lr_no: e.target.value })}
                        style={{ height: 32, fontSize: 12 }}
                    />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                    <Label style={{ fontSize: 11 }}>Vehicle No.</Label>
                    <Input 
                        placeholder="Search Vehicle..."
                        value={filters.vehicle_no} 
                        onChange={e => setFilters({ ...filters, vehicle_no: e.target.value })}
                        style={{ height: 32, fontSize: 12 }}
                    />
                </div>
                <div style={{ flex: '1 1 150px' }}>
                    <Label style={{ fontSize: 11 }}>Billing Party</Label>
                    <select 
                        value={filters.billing_party_id}
                        onChange={e => setFilters({ ...filters, billing_party_id: e.target.value })}
                        style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                    >
                        <option value="">All Parties</option>
                        {billingParties.map((bp: any) => (
                            <option key={bp.id} value={bp.id}>{bp.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: '1 1 110px' }}>
                    <Label style={{ fontSize: 11 }}>From Date</Label>
                    <Input 
                        type="date"
                        value={filters.date_from} 
                        onChange={e => setFilters({ ...filters, date_from: e.target.value })}
                        style={{ height: 32, fontSize: 12 }}
                    />
                </div>
                <div style={{ flex: '1 1 110px' }}>
                    <Label style={{ fontSize: 11 }}>To Date</Label>
                    <Input 
                        type="date"
                        value={filters.date_to} 
                        onChange={e => setFilters({ ...filters, date_to: e.target.value })}
                        style={{ height: 32, fontSize: 12 }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Button 
                        variant="outline" 
                        onClick={() => setFilters({ lr_no: '', date_from: '', date_to: '', vehicle_no: '', billing_party_id: '' })}
                        style={{ height: 32, fontSize: 12 }}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <tr>
                            <th style={{ padding: '8px 12px', textAlign: 'center', width: 40 }}>
                                <Checkbox 
                                    checked={selectedIds.length === availableLRs.length && availableLRs.length > 0} 
                                    onCheckedChange={handleToggleAll} 
                                />
                            </th>
                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>LR No.</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Vehicle No.</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Items</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {availableLRs.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>No un-invoiced LRs matching filters found.</td></tr>
                        ) : (
                            availableLRs.map((lr: any) => (
                                <tr key={lr.id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedIds.includes(lr.id) ? '#f0fdf4' : 'white' }}>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <Checkbox 
                                            checked={selectedIds.includes(lr.id)} 
                                            onCheckedChange={() => handleToggle(lr.id)} 
                                        />
                                    </td>
                                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{lr.lr_no}</td>
                                    <td style={{ padding: '8px 12px' }}>{lr.lr_date}</td>
                                    <td style={{ padding: '8px 12px' }}>{lr.vehicle?.registration_no || '—'}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{lr.items?.length || 0}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                        {lr.total_amount ? Number(lr.total_amount).toFixed(2) : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                <span style={{ alignSelf: 'center', marginRight: 'auto', fontSize: 13, color: '#64748b' }}>
                    {selectedIds.length} selected
                </span>
                <Button 
                    onClick={() => {
                        onAdd(selectedIds);
                        setSelectedIds([]);
                    }}
                    disabled={selectedIds.length === 0}
                    style={{ background: '#7c3aed', color: 'white' }}
                >
                    Add Selected to Invoice
                </Button>
            </div>
        </div>
    );
}

export default function InvoiceModule({ editInvoiceOverride, onSuccess }: { editInvoiceOverride?: any, onSuccess?: () => void }) {
    // When editInvoiceOverride is passed (from popup), prefer it. Otherwise fall back to localStorage.
    const editInvoice = editInvoiceOverride || (() => {
        const stored = localStorage.getItem('editInvoice');
        return stored ? JSON.parse(stored) : null;
    })();
    const isEditMode = !!editInvoice;

    // The API returns nested objects for billing_party and state, so resolve IDs from either shape
    const resolveBillingPartyId = (inv: any): string => {
        if (!inv) return '';
        if (inv.billing_party_id) return String(inv.billing_party_id);
        if (inv.billing_party?.id) return String(inv.billing_party.id);
        return '';
    };
    const resolveStateId = (inv: any): string => {
        if (!inv) return '';
        if (inv.state_id) return String(inv.state_id);
        if (inv.state?.id) return String(inv.state.id);
        return '';
    };

    const [businessType, setBusinessType] = useState<'BEIL' | 'PI'>(editInvoice?.business_type || 'BEIL');
    const [billingParties, setBillingParties] = useState<BillingParty[]>([]);
    const [states, setStates] = useState<{ id: number; name: string }[]>([]);
    const [lrRecords, setLrRecords] = useState<LRRecord[]>([]);
    const [selectedLRs, _setSelectedLRs] = useState<number[]>(editInvoice?.lrs?.map((lr: any) => lr.id) || []);
    const [showLRPopup, setShowLRPopup] = useState(false);
    const [showPIDialog, setShowPIDialog] = useState(false);
    const [piFilters, setPiFilters] = useState({ lr_no: '', date_from: '', date_to: '', vehicle_no: '', billing_party_id: '' });
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
        billing_party_id: resolveBillingPartyId(editInvoice),
        delivery_address: editInvoice?.delivery_address || '',
        state_id: resolveStateId(editInvoice),
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

    // Update PI line item field (for user-editable fields like qty, rate, detention_rate)
    const updatePILineItem = (id: string, field: keyof PIInvoiceLineItem, val: string | number) => {
        setPiLineItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };
            // Recalculate amount based on actual_qty (not display qty)
            updated.amount = (updated.actual_qty || 0) * (updated.rate || 0);
            // Recalculate detention amount
            updated.detention_amount = (updated.detention_days || 0) * (updated.detention_rate || 0);
            return updated;
        }));
    };

    // When user selects an LR from the dropdown in a row, auto-populate all LR fields
    const handlePILRSelect = (rowId: string, lrId: number) => {
        const lr = lrRecords.find(r => r.id === lrId);
        if (!lr) return;
        const detentionDays = lr.detention_days || calculateDetentionDays(lr.inward_time, lr.outward_time);
        setPiLineItems(prev => prev.map(item => {
            if (item.id !== rowId) return item;
            const updated: PIInvoiceLineItem = {
                ...item,
                lr_id: lr.id,
                lr_no: lr.lr_no,
                lr_date: lr.lr_date,
                manifest_no: lr.manifest_no || '',
                vehicle_no: lr.vehicle?.registration_no || '',
                distance_range: getDistanceRange(lr.distance || 0),
                detention_days: detentionDays,
                detention_rate: lr.detention_rate || 0,
                inward_time: lr.inward_time || '',
                outward_time: lr.outward_time || '',
            };
            updated.amount = (updated.actual_qty || 0) * (updated.rate || 0);
            updated.detention_amount = (updated.detention_days || 0) * (updated.detention_rate || 0);
            return updated;
        }));
    };

    // Filter available LRs for PI dialog
    const filteredPILrs = useMemo(() => {
        return lrRecords.filter(lr => {
            // Only show un-invoiced or currently selected LRs
            // For now, filtering based on simple checks
            if (piLineItems.some(item => item.lr_id === lr.id)) return false; // Already in table
            
            if (piFilters.lr_no && !lr.lr_no.toLowerCase().includes(piFilters.lr_no.toLowerCase())) return false;
            if (piFilters.vehicle_no && !lr.vehicle?.registration_no?.toLowerCase().includes(piFilters.vehicle_no.toLowerCase())) return false;
            if (piFilters.billing_party_id && String(lr.billing_party_id) !== piFilters.billing_party_id) return false;
            if (piFilters.date_from && new Date(lr.lr_date) < new Date(piFilters.date_from)) return false;
            if (piFilters.date_to && new Date(lr.lr_date) > new Date(piFilters.date_to)) return false;
            return true;
        });
    }, [lrRecords, piFilters, piLineItems]);

    const handleSelectPILRs = (selectedIds: number[]) => {
        const newRows = selectedIds.map(lrId => {
            const lr = lrRecords.find(r => r.id === lrId);
            if (!lr) return null;
            const detentionDays = lr.detention_days || calculateDetentionDays(lr.inward_time, lr.outward_time);
            
            // Auto populate logic
            const actualQty = lr.items && lr.items.length > 0 ? lr.items.reduce((s, i) => s + (Number(lr.bill_by === 'Weight' ? i.weight : i.qty) || Number(i.qty) || Number(i.weight) || 0), 0) : 1;
            const rate = lr.items && lr.items.length > 0 ? Number(lr.items[0].rate) || 0 : 0;
            const detRate = Number(lr.detention_rate) || 0;
            const baseAmount = actualQty * rate;
            const detAmount = detentionDays * detRate;

            return {
                id: generateId(),
                lr_id: lr.id,
                lr_no: lr.lr_no,
                lr_date: lr.lr_date,
                manifest_no: lr.manifest_no || '',
                vehicle_no: lr.vehicle?.registration_no || '',
                distance_range: getDistanceRange(lr.distance || 0),
                qty_display: String(actualQty),
                actual_qty: actualQty,
                unit: 'Per trip',
                rate: rate,
                amount: baseAmount,
                detention_days: detentionDays,
                detention_rate: detRate,
                detention_amount: detAmount,
                inward_time: lr.inward_time || '',
                outward_time: lr.outward_time || '',
            };
        }).filter(Boolean) as PIInvoiceLineItem[];

        setPiLineItems(prev => [...prev, ...newRows]);
        setShowPIDialog(false);
    };

    // Add a new empty PI row (Fall back if needed, but not primarily used anymore)
    const addPIRow = () => {
        setPiLineItems(prev => [...prev, {
            id: generateId(),
            lr_id: 0,
            lr_no: '',
            lr_date: '',
            manifest_no: '',
            vehicle_no: '',
            distance_range: '',
            qty_display: '1',
            actual_qty: 1,
            unit: 'Per trip',
            rate: 0,
            amount: 0,
            detention_days: 0,
            detention_rate: 0,
            detention_amount: 0,
            inward_time: '',
            outward_time: '',
        }]);
    };
    
    // Move PI row up
    const movePIRowUp = (index: number) => {
        if (index === 0) return;
        setPiLineItems(prev => {
            const newItems = [...prev];
            [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
            return newItems;
        });
    };

    // Move PI row down
    const movePIRowDown = (index: number) => {
        if (index === piLineItems.length - 1) return;
        setPiLineItems(prev => {
            const newItems = [...prev];
            [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
            return newItems;
        });
    };

    // Remove a PI row
    const removePIRow = (id: string) => {
        setPiLineItems(prev => prev.filter(item => item.id !== id));
    };

    const { totalAmount, gstAmount, sgstAmount, cgstAmount, grandTotal, amountWords } = useMemo(() => {
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
        return { totalAmount, gstAmount, sgstAmount, cgstAmount, grandTotal, amountWords };
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
                // Derive lr_ids from piLineItems to ensure they're always in sync
                const lrIds = piLineItems.map(item => item.lr_id).filter(id => id > 0);
                lrIds.forEach((id, i) => fd.append(`lr_ids[${i}]`, String(id)));

                // Send PI line items with all details
                piLineItems.forEach((item, i) => {
                    fd.append(`pi_items[${i}][lr_id]`, String(item.lr_id));
                    fd.append(`pi_items[${i}][lr_no]`, item.lr_no);
                    fd.append(`pi_items[${i}][manifest_no]`, item.manifest_no || '');
                    fd.append(`pi_items[${i}][vehicle_no]`, item.vehicle_no || '');
                    fd.append(`pi_items[${i}][lr_date]`, item.lr_date || '');
                    fd.append(`pi_items[${i}][inward_date]`, item.inward_time || '');
                    fd.append(`pi_items[${i}][outward_date]`, item.outward_time || '');
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
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Redirect to invoice history after successful save using proper path
                    window.location.href = '/invoice-history';
                }
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
                })) : piLineItems.map(item => ({
                    description: `Transportation for LR ${item.lr_no} (${item.distance_range || ''} Kms)`,
                    sac_code: form.hsn_code,
                    lr_no: item.lr_no,
                    manifest_no: item.manifest_no,
                    vehicle_no: item.vehicle_no,
                    lr_date: item.lr_date,
                    inward_date: item.inward_time,
                    outward_date: item.outward_time,
                    distance_range: item.distance_range,
                    qty: item.actual_qty,
                    qty_display: item.qty_display,
                    actual_qty: item.actual_qty,
                    unit: 'Per trip',
                    rate: item.rate,
                    unit_rate: item.rate,
                    amount: item.amount,
                    cgst: (item.amount || 0) * 0.09,
                    sgst: (item.amount || 0) * 0.09,
                    total_amount: (item.amount || 0) * 1.18,
                    detention_days: item.detention_days,
                    detention_rate: item.detention_rate,
                    detention_amount: item.detention_amount,
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
                            <MasterSelect
                                type="billing_parties"
                                label="Billing Party *"
                                placeholder="Select billing party"
                                value={form.billing_party_id ? +form.billing_party_id : undefined}
                                onChange={(val) => setForm(p => ({ ...p, billing_party_id: String(val) }))}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <MasterSelect
                                type="delivery_places"
                                label="Delivery Address"
                                placeholder="Full delivery address"
                                valueKey="name"
                                value={form.delivery_address}
                                onChange={(val) => setForm(p => ({ ...p, delivery_address: String(val) }))}
                            />
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
                        {businessType === 'BEIL' ? 'LR Data (Line Items)' : 'LR Records'}
                        {businessType === 'BEIL' && (
                            <Dialog open={showLRPopup} onOpenChange={setShowLRPopup}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" type="button" style={{ marginLeft: 'auto' }}>
                                        <Plus size={14} /> Add via Popup
                                    </Button>
                                </DialogTrigger>
                                <DialogContent style={{ maxWidth: 750 }}>
                                    <DialogHeader>
                                        <DialogTitle>Add LR Line Item</DialogTitle>
                                    </DialogHeader>
                                    <BEILItemPopup onAdd={(item) => { setItems(p => [...p, item]); setShowLRPopup(false); }} />
                                </DialogContent>
                            </Dialog>
                        )}
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
                                            const isStaticRow = idx < STATIC_LINE_ITEMS.length; // First n rows are static
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
                        /* ── PI Industries: Row-per-LR table ─────────────────── */
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: 13, color: '#64748b' }}>
                                    {piLineItems.length} LR row(s) added
                                </span>
                                <Dialog open={showPIDialog} onOpenChange={setShowPIDialog}>
                                    <DialogTrigger asChild>
                                        <button type="button"
                                            style={{ padding: '6px 14px', background: '#f5f3ff', color: '#7c3aed', border: '1px dashed #a78bfa', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Plus size={14} /> Add LR Row
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent style={{ maxWidth: 900 }}>
                                        <DialogHeader>
                                            <DialogTitle>Select LRs from Master</DialogTitle>
                                        </DialogHeader>
                                        <PIDialogContent
                                            availableLRs={filteredPILrs}
                                            filters={piFilters}
                                            setFilters={setPiFilters}
                                            billingParties={billingParties}
                                            onAdd={handleSelectPILRs}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {piLineItems.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: 12, fontSize: 13 }}>
                                    Click "Add LR Row" to select and add LR records to this invoice
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, tableLayout: 'auto' }}>
                                        <thead>
                                            <tr style={{ background: '#7c3aed', color: 'white' }}>
                                                <th style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>Sr. No.</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Date</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>L/R No.</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Manifest No</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>Vehicle No.</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actual Quantity</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>Billing<br/>Quantity</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Rate</th>
                                                <th style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                                                <th style={{ padding: '8px 6px', textAlign: 'center', width: 60 }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                let srNo = 0;
                                                return piLineItems.map((item, idx) => {
                                                    srNo++;
                                                    const transportSr = srNo;
                                                    const hasDetention = (item.detention_days || 0) > 0 && (item.detention_rate || 0) > 0;
                                                    if (hasDetention) srNo++; // detention sub-row gets a sr number too

                                                    // Format inward/outward dates for detention row
                                                    const formatShortDate = (d: string | undefined) => {
                                                        if (!d) return '';
                                                        try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch(_e) { return d || ''; }
                                                    };
                                                    const lr = lrRecords.find(r => r.id === item.lr_id);
                                                    const inwardDate = lr?.inward_time ? formatShortDate(lr.inward_time) : '';
                                                    const outwardDate = lr?.outward_time ? formatShortDate(lr.outward_time) : '';
                                                    const detentionDateRange = inwardDate && outwardDate ? `${inwardDate} To ${outwardDate}` : '';
                                                    const detDays = item.detention_days || 0;
                                                    // Detention billing qty formula: e.g. "3-1=2" (total days - 1 free day = chargeable)
                                                    const detBillingQty = detDays > 0 ? `${detDays + 1}-1=${detDays}` : '0';

                                                    return (
                                                        <>
                                                            {/* Transport Row */}
                                                            <tr style={{ background: idx % 2 === 0 ? '#faf5ff' : 'white', borderBottom: hasDetention ? 'none' : '1px solid #ede9fe' }}>
                                                                <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>{transportSr}</td>
                                                                <td style={{ padding: '4px 6px' }}>
                                                                    <Input type="date" value={item.lr_date ? item.lr_date.split('T')[0] : ''} onChange={e => updatePILineItem(item.id, 'lr_date', e.target.value)} style={{ width: 110, height: 32, fontSize: 11 }} title="LR Date" />
                                                                </td>
                                                                <td style={{ padding: '4px 6px' }}>
                                                                    <Input value={item.lr_no} onChange={e => updatePILineItem(item.id, 'lr_no', e.target.value)} style={{ width: 100, height: 32, fontSize: 11, fontWeight: 600 }} placeholder="LR No." />
                                                                </td>
                                                                <td style={{ padding: '4px 6px' }}>
                                                                    <Input value={item.manifest_no} onChange={e => updatePILineItem(item.id, 'manifest_no', e.target.value)} style={{ width: 90, height: 32, fontSize: 11 }} placeholder="Manifest" />
                                                                </td>
                                                                <td style={{ padding: '4px 6px' }}>
                                                                    <Input value={item.vehicle_no} onChange={e => updatePILineItem(item.id, 'vehicle_no', e.target.value)} style={{ width: 100, height: 32, fontSize: 11 }} placeholder="Vehicle No" />
                                                                </td>
                                                                {/* Actual Quantity (String Input) */}
                                                                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                                                    <Input
                                                                        type="text"
                                                                        value={item.qty_display}
                                                                        onChange={e => updatePILineItem(item.id, 'qty_display', e.target.value)}
                                                                        style={{ width: 70, textAlign: 'center', fontSize: 12, height: 32 }}
                                                                        title="Manual text shown on invoice"
                                                                    />
                                                                </td>
                                                                {/* Billing Quantity (Number Input for calc) */}
                                                                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.actual_qty}
                                                                        onChange={e => updatePILineItem(item.id, 'actual_qty', +e.target.value)}
                                                                        style={{ width: 70, textAlign: 'center', fontSize: 12, height: 32 }}
                                                                    />
                                                                </td>
                                                                {/* Rate */}
                                                                <td style={{ padding: '4px 6px' }}>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.rate}
                                                                        onChange={e => updatePILineItem(item.id, 'rate', +e.target.value)}
                                                                        style={{ width: 90, textAlign: 'right', fontSize: 12, height: 32 }}
                                                                    />
                                                                </td>
                                                                {/* Amount */}
                                                                <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#1e1b4b', fontSize: 13 }}>
                                                                    {(item.amount || 0).toFixed(1)}
                                                                </td>
                                                                {/* Actions */}
                                                                <td style={{ padding: '4px 6px', textAlign: 'center', display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                                    <button type="button" onClick={() => movePIRowUp(idx)} disabled={idx === 0}
                                                                        style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#cbd5e1' : '#64748b', padding: 2 }}>
                                                                        <span style={{ fontSize: 16 }}>↑</span>
                                                                    </button>
                                                                    <button type="button" onClick={() => movePIRowDown(idx)} disabled={idx === piLineItems.length - 1}
                                                                        style={{ background: 'none', border: 'none', cursor: idx === piLineItems.length - 1 ? 'default' : 'pointer', color: idx === piLineItems.length - 1 ? '#cbd5e1' : '#64748b', padding: 2 }}>
                                                                        <span style={{ fontSize: 16 }}>↓</span>
                                                                    </button>
                                                                    <button type="button" onClick={() => removePIRow(item.id)}
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2, marginLeft: 4 }}>
                                                                        <X size={16} />
                                                                    </button>
                                                                </td>
                                                            </tr>

                                                            {/* Detention Sub-Row (only if detention exists) */}
                                                            {hasDetention && (
                                                                <tr style={{ background: '#fef3c7', borderBottom: '1px solid #ede9fe' }}>
                                                                    <td style={{ padding: '6px 10px', textAlign: 'center', color: '#92400e', fontWeight: 700 }}>{transportSr + 1}</td>
                                                                    {/* Date range: inward to outward */}
                                                                    <td style={{ padding: '4px 6px', display: 'flex', gap: 4, alignItems: 'center' }}>
                                                                        <Input type="date" value={item.inward_time ? item.inward_time.split('T')[0] : ''} onChange={e => updatePILineItem(item.id, 'inward_time', e.target.value)} style={{ width: 110, height: 28, fontSize: 10, background: '#fef9c3', border: '1px solid #fbbf24' }} title="Inward Date" />
                                                                        <span style={{ color: '#92400e', fontSize: 10 }}>To</span>
                                                                        <Input type="date" value={item.outward_time ? item.outward_time.split('T')[0] : ''} onChange={e => updatePILineItem(item.id, 'outward_time', e.target.value)} style={{ width: 110, height: 28, fontSize: 10, background: '#fef9c3', border: '1px solid #fbbf24' }} title="Outward Date" />
                                                                    </td>
                                                                    <td style={{ padding: '6px 10px', fontSize: 11, color: '#92400e', fontWeight: 600 }}>{item.lr_no || ''}</td>
                                                                    <td style={{ padding: '6px 10px', fontSize: 11, color: '#92400e' }}>{item.manifest_no || ''}</td>
                                                                    <td style={{ padding: '6px 10px', fontSize: 11, color: '#92400e' }}>{item.vehicle_no || ''}</td>
                                                                    {/* Actual Qty: empty for detention */}
                                                                    <td></td>
                                                                    {/* Billing Qty: detention days (editable) */}
                                                                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                                                            <span style={{ fontSize: 10, color: '#b45309' }}>Days:</span>
                                                                            <Input
                                                                                type="number"
                                                                                value={item.detention_days}
                                                                                onChange={e => updatePILineItem(item.id, 'detention_days', +e.target.value)}
                                                                                style={{ width: 60, textAlign: 'center', fontSize: 12, height: 28, background: '#fef9c3', border: '1px solid #fbbf24' }}
                                                                                title="Detention Days"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    {/* Detention Rate */}
                                                                    <td style={{ padding: '4px 6px' }}>
                                                                        <Input
                                                                            type="number"
                                                                            value={item.detention_rate}
                                                                            onChange={e => updatePILineItem(item.id, 'detention_rate', +e.target.value)}
                                                                            style={{ width: 90, textAlign: 'right', fontSize: 12, height: 28, background: '#fef9c3', border: '1px solid #fbbf24' }}
                                                                        />
                                                                    </td>
                                                                    {/* Detention Amount */}
                                                                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#ea580c', fontSize: 13 }}>
                                                                        {(item.detention_amount || 0).toFixed(1)}
                                                                    </td>
                                                                    <td></td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#1e1b4b', color: 'white', fontWeight: 700 }}>
                                                <td colSpan={5} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>Total</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 13 }}>
                                                    {piLineItems.reduce((s, i) => s + (i.actual_qty || 0), 0).toFixed(2)}
                                                </td>
                                                <td></td>
                                                <td></td>
                                                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, color: '#a5f3fc' }}>
                                                    {piLineItems.reduce((s, i) => s + (i.amount || 0) + (i.detention_amount || 0), 0).toLocaleString('en-IN')}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                    <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
                                        <strong>Note:</strong> If an LR has detention days &gt; 0 (or you manually enter days &gt; 0), a detention sub-row is automatically added below it. Detention rows appear in amber.
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <Button type="button" variant="outline" onClick={addPIRow} style={{ fontSize: 12, height: 32 }}>
                                            <Plus size={14} className="mr-2" /> Add Manual Entry
                                        </Button>
                                    </div>
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
                    <Button type="button" variant="outline" onClick={() => {
                        if (onSuccess) onSuccess();
                        else window.history.back();
                    }}>Cancel</Button>
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
