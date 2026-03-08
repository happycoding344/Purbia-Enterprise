import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Eye, Trash2, Search, FileText } from 'lucide-react';

type Invoice = {
    id: number;
    invoice_no: string;
    invoice_date: string;
    business_type: 'BEIL' | 'PI';
    billing_party?: { name: string };
    total_amount: number;
    created_at: string;
};

export default function InvoiceHistory() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'BEIL' | 'PI'>('ALL');
    const [error, setError] = useState('');

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
        await api.delete(`/invoices/${id}`);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
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
                                    <td style={{ padding: '12px 16px', color: '#374151', fontSize: 13 }}>{inv.invoice_date}</td>
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
                                                style={{ padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#3b82f6' }}
                                                title="View"
                                            >
                                                <Eye size={14} />
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
                    { label: 'Grand Total', value: `₹${filtered.reduce((s, i) => s + (i.total_amount || 0), 0).toLocaleString('en-IN')}`, color: '#059669', bg: '#f0fdf4' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: 16, border: `1px solid ${stat.color}20` }}>
                        <div style={{ fontSize: 12, color: stat.color, fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
