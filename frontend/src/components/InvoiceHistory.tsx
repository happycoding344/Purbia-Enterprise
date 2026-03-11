import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Trash2, Search, FileText, Download, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoicePrint } from './InvoicePrint';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

type Invoice = {
    id: number;
    invoice_no: string;
    invoice_date: string;
    business_type: 'BEIL' | 'PI';
    billing_party?: { name: string };
    state?: { name: string };
    total_amount: number;
    total_amount_words?: string;
    gst_amount: number;
    sgst_amount: number;
    cgst_amount: number;
    amount: number;
    hsn_code?: string;
    items?: any[];
    lrs?: any[];
    created_at: string;
};

export default function InvoiceHistory() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'BEIL' | 'PI'>('ALL');
    const [error, setError] = useState('');
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [previewDialogData, setPreviewDialogData] = useState<any>(null);

    useEffect(() => {
        api.get('/invoices')
            .then(r => setInvoices(r.data))
            .catch(() => setError('Failed to load invoices'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = invoices.filter(inv => {
        const matchesSearch = !search || inv.invoice_no.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'ALL' || inv.business_type === typeFilter;
        return matchesSearch && matchesType;
    });

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this invoice?')) return;
        try {
            await api.delete(`/invoices/${id}`);
            setInvoices(prev => prev.filter(inv => inv.id !== id));
        } catch (err) {
            setError('Failed to delete invoice');
        }
    };

    const mapInvoiceForPrint = (inv: Invoice) => {
        return {
            ...inv,
            billing_party: inv.billing_party?.name || (inv as any).billing_party_id,
            state: inv.state?.name || '',
            amount_in_words: inv.total_amount_words,
            grand_total: inv.total_amount,
            tax_amount: inv.gst_amount,
            cgst_total: inv.cgst_amount,
            sgst_total: inv.sgst_amount,
            total_amount_before_tax: inv.amount,
            items: inv.business_type === 'BEIL' ? inv.items : inv.lrs?.map((lr: any) => ({
                description: `LR No: ${lr.lr_no}, Manifest: ${lr.manifest_no || '-'}`,
                sac_code: inv.hsn_code,
                qty: 1,
                unit: 'Trip',
                unit_rate: lr.total_amount,
                amount: lr.total_amount,
                cgst: (lr.total_amount || 0) * 0.09,
                sgst: (lr.total_amount || 0) * 0.09,
                total_amount: (lr.total_amount || 0) * 1.18
            }))
        };
    };

    const handlePreview = (inv: Invoice) => {
        const printData = mapInvoiceForPrint(inv);
        setPreviewDialogData(printData);
        setShowPreviewDialog(true);
    };

    const handleDownloadFromPreview = async () => {
        if (!previewDialogData) return;

        try {
            // Wait for component to render
            await new Promise(resolve => setTimeout(resolve, 300));

            // Get the invoice container
            const invoiceElement = document.getElementById('invoice-print-container-preview');
            if (!invoiceElement) {
                throw new Error('Invoice element not found');
            }

            // Convert to canvas
            const canvas = await html2canvas(invoiceElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: 794,
                height: 1123
            });

            // Convert canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = 297;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Download PDF
            const fileName = `${previewDialogData.business_type}_Invoice_${previewDialogData.invoice_no}_${format(new Date(previewDialogData.invoice_date), 'yyyyMMdd')}.pdf`;
            pdf.save(fileName);

            // Close preview
            setShowPreviewDialog(false);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleDownloadPDF = async (inv: Invoice) => {
        try {
            const printData = mapInvoiceForPrint(inv);

            // Set preview to render component
            setPreviewInvoice(printData);

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
                width: 794,
                height: 1123
            });

            // Convert canvas to PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = 297;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Download PDF
            const fileName = `${inv.business_type}_Invoice_${inv.invoice_no}_${format(new Date(inv.invoice_date), 'yyyyMMdd')}.pdf`;
            pdf.save(fileName);

            // Close preview
            setPreviewInvoice(null);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleEdit = async (inv: Invoice) => {
        try {
            // Fetch full invoice details
            const response = await api.get(`/invoices/${inv.id}`);
            const fullInvoice = response.data;

            // Store invoice in localStorage for editing
            localStorage.setItem('editInvoice', JSON.stringify(fullInvoice));

            // Navigate to Generate Invoice page
            window.location.hash = '#/generate-invoice';

            // Reload to trigger the edit mode
            window.location.reload();
        } catch (error) {
            console.error('Failed to load invoice for editing:', error);
            alert('Failed to load invoice details for editing');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                Loading invoices...
            </div>
        );
    }

    return (
        <div>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <Input
                        style={{ paddingLeft: 36 }}
                        placeholder="Search by invoice number..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
                    {(['ALL', 'BEIL', 'PI'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            style={{
                                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                background: typeFilter === type ? 'white' : 'transparent',
                                color: typeFilter === type ? '#0f172a' : '#64748b',
                                boxShadow: typeFilter === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                        >
                            {type === 'ALL' ? 'All Invoices' : `${type} Industries`}
                        </button>
                    ))}
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }}>
                    {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {error && (
                <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {/* Table */}
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                        <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p style={{ marginBottom: 16 }}>No invoices found.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Invoice No.', 'Date', 'Business', 'Billing Party', 'Total Amount', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(inv => (
                                <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
                                >
                                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{inv.invoice_no}</td>
                                    <td style={{ padding: '12px 16px', color: '#374151', fontSize: 13 }}>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: inv.business_type === 'BEIL' ? '#eff6ff' : '#f5f3ff',
                                            color: inv.business_type === 'BEIL' ? '#1d4ed8' : '#6d28d9',
                                        }}>
                                            {inv.business_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: '#374151', fontSize: 13 }}>
                                        {inv.billing_party?.name || '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#059669', fontSize: 14 }}>
                                        ₹{(inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => handlePreview(inv)}
                                                style={{ padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#10b981' }}
                                                title="Preview Invoice"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPDF(inv)}
                                                style={{ padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#3b82f6' }}
                                                title="Download PDF"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(inv)}
                                                style={{ padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#8b5cf6' }}
                                                title="Edit Invoice"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(inv.id)}
                                                style={{ padding: '6px', borderRadius: 8, border: '1px solid #fee2e2', background: 'white', cursor: 'pointer', color: '#ef4444' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
                {[
                    { label: 'Total Invoices', value: filtered.length, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'BEIL Invoices', value: filtered.filter(i => i.business_type === 'BEIL').length, color: '#8b5cf6', bg: '#f5f3ff' },
                    { label: 'Grand Total', value: `₹${filtered.reduce((s, i) => s + (Number(i.total_amount) || 0), 0).toLocaleString('en-IN')}`, color: '#059669', bg: '#f0fdf4' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: 16, border: `1px solid ${stat.color}20` }}>
                        <div style={{ fontSize: 12, color: stat.color, fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Invoice Preview - {previewDialogData?.invoice_no}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        {previewDialogData && (
                            <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                                <InvoicePrint invoice={previewDialogData} businessType={previewDialogData.business_type} containerId="invoice-print-container-preview" />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={handleDownloadFromPreview}
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white' }}
                        >
                            <Download size={16} className="mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden invoice component for PDF generation */}
            {previewInvoice && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <InvoicePrint invoice={previewInvoice} businessType={previewInvoice.business_type} />
                </div>
            )}
        </div>
    );
}
