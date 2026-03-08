import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Download, Printer, X, Building2 } from 'lucide-react';

type LRRecord = {
    id: number;
    lr_no: string;
    lr_date: string;
    manifest_no: string;
    manifest_date: string;
    inward_time: string;
    outward_time: string;
    distance: number;
    detention_rate: number;
    total_detention_amount: number;
    total_amount: number;
    vehicle?: { registration_no: string };
    fromCity?: { name: string };
    toCity?: { name: string };
    location?: { name: string };
};

const BEIL_COLUMNS = [
    { key: 'vehicle', label: 'Vehicle Number' },
    { key: 'manifest_no', label: 'Manifest Number' },
    { key: 'inward_time', label: 'Inward Date & Time' },
    { key: 'outward_time', label: 'Outward Date & Time' },
    { key: 'location', label: 'Company/Location' },
    { key: 'lr_no', label: 'LR No.' },
    { key: 'distance', label: 'Distance (kms)' },
    { key: 'detention_rate', label: 'Rate' },
    { key: 'total_detention_amount', label: 'Detention Amount' },
    { key: 'total_amount', label: 'Total Amount' },
];

const PI_COLUMNS = [
    { key: 'vehicle', label: 'Vehicle Number' },
    { key: 'manifest_no', label: 'Manifest Number' },
    { key: 'inward_time', label: 'Inward Date & Time' },
    { key: 'outward_time', label: 'Outward Date & Time' },
    { key: 'difference_days', label: 'Difference (Days)' },
    { key: 'detention_charges', label: 'Detention Charges (After 24h)' },
];

export default function PrintLRModule() {
    const [businessType, setBusinessType] = useState<'BEIL' | 'PI'>('BEIL');
    const [records, setRecords] = useState<LRRecord[]>([]);
    const [filtered, setFiltered] = useState<LRRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [filters, setFilters] = useState({
        dateFrom: '', dateTo: '',
        lrNo: '', manifestNo: '',
        vehicleNo: '', locationFrom: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        api.get('/lrs').then(r => {
            setRecords(r.data);
            setFiltered(r.data);
        }).finally(() => setLoading(false));
    }, []);

    const applyFilters = useCallback(() => {
        let result = [...records];
        if (filters.dateFrom) result = result.filter(r => r.lr_date >= filters.dateFrom);
        if (filters.dateTo) result = result.filter(r => r.lr_date <= filters.dateTo);
        if (filters.lrNo) result = result.filter(r => r.lr_no?.toLowerCase().includes(filters.lrNo.toLowerCase()));
        if (filters.manifestNo) result = result.filter(r => r.manifest_no?.toLowerCase().includes(filters.manifestNo.toLowerCase()));
        if (filters.vehicleNo) result = result.filter(r => r.vehicle?.registration_no?.toLowerCase().includes(filters.vehicleNo.toLowerCase()));
        setFiltered(result);
    }, [records, filters]);

    const clearFilters = () => {
        setFilters({ dateFrom: '', dateTo: '', lrNo: '', manifestNo: '', vehicleNo: '', locationFrom: '' });
        setFiltered(records);
    };

    const handlePrint = () => {
        window.print();
    };

    const getColValue = (lr: LRRecord, key: string) => {
        switch (key) {
            case 'vehicle': return lr.vehicle?.registration_no || '-';
            case 'location': return lr.location?.name || '-';
            case 'difference_days': {
                if (!lr.inward_time || !lr.outward_time) return '-';
                const diff = new Date(lr.outward_time).getTime() - new Date(lr.inward_time).getTime();
                return Math.ceil(diff / (1000 * 60 * 60 * 24)) + ' days';
            }
            case 'detention_charges': return lr.total_detention_amount ? `₹${lr.total_detention_amount.toLocaleString('en-IN')}` : '-';
            case 'total_amount': return lr.total_amount ? `₹${lr.total_amount.toLocaleString('en-IN')}` : '-';
            case 'total_detention_amount': return lr.total_detention_amount ? `₹${lr.total_detention_amount.toLocaleString('en-IN')}` : '-';
            default: return (lr as any)[key] || '-';
        }
    };

    const columns = businessType === 'BEIL' ? BEIL_COLUMNS : PI_COLUMNS;

    return (
        <div>
            {/* Header Controls */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Business Type Toggle */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
                    {(['BEIL', 'PI'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setBusinessType(type)}
                            style={{
                                padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                background: businessType === type ? 'white' : 'transparent',
                                color: businessType === type ? '#0f172a' : '#64748b',
                                boxShadow: businessType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Building2 size={13} style={{ display: 'inline', marginRight: 6 }} />
                            {type} Industries
                        </button>
                    ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={14} /> {showFilters ? 'Hide' : 'Show'} Filters
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="no-print">
                        <Printer size={14} /> Print
                    </Button>
                    <Button variant="outline" className="no-print">
                        <Download size={14} /> Export PDF
                    </Button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Advanced Filters</span>
                        <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <X size={12} /> Clear All
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div>
                            <Label>From Date</Label>
                            <Input type="date" className="mt-1" value={filters.dateFrom}
                                onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
                        </div>
                        <div>
                            <Label>To Date</Label>
                            <Input type="date" className="mt-1" value={filters.dateTo}
                                onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
                        </div>
                        <div>
                            <Label>LR Number</Label>
                            <Input className="mt-1" placeholder="Search LR No." value={filters.lrNo}
                                onChange={e => setFilters(p => ({ ...p, lrNo: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Manifest Number</Label>
                            <Input className="mt-1" placeholder="Search manifest" value={filters.manifestNo}
                                onChange={e => setFilters(p => ({ ...p, manifestNo: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Vehicle Number</Label>
                            <Input className="mt-1" placeholder="Search vehicle" value={filters.vehicleNo}
                                onChange={e => setFilters(p => ({ ...p, vehicleNo: e.target.value }))} />
                        </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <Button onClick={applyFilters}>Apply Filters</Button>
                        <Button variant="outline" onClick={clearFilters}>Reset</Button>
                    </div>
                </div>
            )}

            {/* Result Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                    Showing <strong>{filtered.length}</strong> records for <strong>{businessType} Industries</strong>
                </span>
            </div>

            {/* Data Table */}
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading LR records...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                        <Printer size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p>No LR records found. Adjust your filters or create new LRs.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px 16px', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    Sr. No.
                                </th>
                                {columns.map(col => (
                                    <th key={col.key} style={{ padding: '12px 16px', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((lr, idx) => (
                                <tr key={lr.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
                                >
                                    <td style={{ padding: '10px 16px', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                                    {columns.map(col => (
                                        <td key={col.key} style={{ padding: '10px 16px', color: '#374151' }}>
                                            {getColValue(lr, col.key)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {/* Footer Totals */}
                        <tfoot>
                            <tr style={{ background: '#f0f4ff' }}>
                                <td colSpan={columns.length} style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                                    Totals — {filtered.length} records | Grand Total: ₹{filtered.reduce((s, lr) => s + (lr.total_amount || 0), 0).toLocaleString('en-IN')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            {/* Print-specific styles embedded for window.print() */}
            <style>{`
        @media print {
          body { font-size: 10px; }
          .no-print { display: none !important; }
          button { display: none !important; }
        }
      `}</style>
        </div>
    );
}
