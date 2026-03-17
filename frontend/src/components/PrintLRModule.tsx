import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Download, X, Building2, ChevronDown, Search, CheckSquare } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type LRRecord = {
    id: number;
    lr_no: string;
    lr_date: string;
    manifest_no: string;
    manifest_date: string;
    inward_time: string;
    outward_time: string;
    distance: string | number;
    detention_days: number;
    detention_rate: number;
    total_detention_amount: number;
    total_amount: number;
    gross_amount: number;
    vehicle?: { registration_no: string };
    billing_party?: { name: string };
    location_from?: { name: string };
    from_city?: { name: string };
    to_city?: { name: string };
    items?: any[];
};

/* ── Formatting helpers ──────────────────────────── */
const fmtDate = (raw: string | undefined | null): string => {
    if (!raw) return '';
    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_e) { return raw || ''; }
};

const fmtTime = (raw: string | undefined | null): string => {
    if (!raw) return '';
    try {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return raw;
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (_e) { return raw || ''; }
};

const fmtDateTime = (raw: string | undefined | null): string => {
    if (!raw) return '';
    return `${fmtDate(raw)} ${fmtTime(raw)}`.trim();
};

const calcDiffDays = (inward: string | null, outward: string | null): string => {
    if (!inward || !outward) return '-';
    try {
        const diff = (new Date(outward).getTime() - new Date(inward).getTime()) / (1000 * 60 * 60 * 24);
        return diff.toFixed(2);
    } catch (_e) { return '-'; }
};

/* ── Shared print cell styles ─────────────────── */
const pCell: React.CSSProperties = { border: '1px solid #333', padding: '4px 6px', fontSize: '9px', verticalAlign: 'middle' };
const pCellH: React.CSSProperties = { ...pCell, fontWeight: 700, backgroundColor: '#e8e8e8', textAlign: 'center', fontSize: '8px' };
const pCellR: React.CSSProperties = { ...pCell, textAlign: 'right' };
const pCellC: React.CSSProperties = { ...pCell, textAlign: 'center' };

/* ── BEIL Print View (Landscape) ──────────────── */
function BEILPrintView({ records }: { records: LRRecord[] }) {
    return (
        <div id="lr-print-container" style={{
            width: '1123px', minHeight: '794px', boxSizing: 'border-box',
            fontFamily: '"Inter", Arial, sans-serif', backgroundColor: 'white', color: '#000',
            display: 'flex', flexDirection: 'column',
        }}>
            <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');`}} />
            <div style={{ width: '100%', flexShrink: 0 }}>
                <img src="/header-1.jpg" alt="Header" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div style={{ flex: 1, padding: '10px 20px' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', marginBottom: 10, textDecoration: 'underline' }}>
                    Details Of Transportation Trip Wise
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            {['Inward\nDate', 'Inward\ntime', 'Outward\nDate', 'Outward\ntime', 'Company', 'Location', 'Truck No.', 'LR No', 'Manifest\nN.', 'Manifest\nDate', 'Distance', 'Rate', 'Deten\ntion', 'Dete\nntion\nRate', 'Detention\nAmount', 'Total\nAmount'].map((h, i) => (
                                <th key={i} style={{ ...pCellH, whiteSpace: 'pre-wrap', lineHeight: 1.2 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((lr, idx) => {
                            const rate = lr.items?.[0]?.rate || 0;
                            return (
                                <tr key={lr.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                    <td style={pCellC}>{fmtDate(lr.inward_time)}</td>
                                    <td style={pCellC}>{fmtTime(lr.inward_time)}</td>
                                    <td style={pCellC}>{fmtDate(lr.outward_time)}</td>
                                    <td style={pCellC}>{fmtTime(lr.outward_time)}</td>
                                    <td style={{ ...pCell, fontSize: '8px' }}>{lr.billing_party?.name || '-'}</td>
                                    <td style={pCellC}>{lr.location_from?.name || lr.from_city?.name || '-'}</td>
                                    <td style={pCellC}>{lr.vehicle?.registration_no || '-'}</td>
                                    <td style={pCellC}>{lr.lr_no}</td>
                                    <td style={pCellC}>{lr.manifest_no || '-'}</td>
                                    <td style={pCellC}>{lr.manifest_date ? fmtDate(lr.manifest_date) : '-'}</td>
                                    <td style={pCellC}>{lr.distance || '-'}</td>
                                    <td style={pCellR}>{rate || lr.detention_rate || 0}</td>
                                    <td style={pCellC}>{lr.detention_days || 0}</td>
                                    <td style={pCellR}>{lr.detention_rate || 0}</td>
                                    <td style={pCellR}>{lr.total_detention_amount || 0}</td>
                                    <td style={pCellR}>{lr.total_amount || 0}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div style={{ width: '100%', flexShrink: 0 }}>
                <img src="/footer-1.jpg" alt="Footer" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
        </div>
    );
}

/* ── PI Print View (Portrait) ─────────────────── */
function PIPrintView({ records }: { records: LRRecord[] }) {
    return (
        <div id="lr-print-container" style={{
            width: '794px', minHeight: '1123px', boxSizing: 'border-box',
            fontFamily: '"Inter", Arial, sans-serif', backgroundColor: 'white', color: '#000',
            display: 'flex', flexDirection: 'column',
        }}>
            <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');`}} />
            <div style={{ width: '100%', flexShrink: 0 }}>
                <img src="/header-1.jpg" alt="Header" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <div style={{ flex: 1, padding: '10px 30px' }}>
                <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '14px', marginBottom: 15, textDecoration: 'underline' }}>
                    Detention details
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th rowSpan={2} style={pCellH}>Manifest<br/>No.</th>
                            <th rowSpan={2} style={pCellH}>Tanker NO.</th>
                            <th colSpan={2} style={pCellH}>Inward</th>
                            <th colSpan={2} style={pCellH}>Outward</th>
                            <th rowSpan={2} style={pCellH}>Difference<br/>(Days)</th>
                            <th rowSpan={2} style={pCellH}>Detention<br/>Charges<br/>After 24 hrs.</th>
                        </tr>
                        <tr>
                            <th style={pCellH}>Date</th>
                            <th style={pCellH}>Time</th>
                            <th style={pCellH}>Date</th>
                            <th style={pCellH}>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((lr, idx) => (
                            <tr key={lr.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                <td style={pCellC}>{lr.manifest_no || '-'}</td>
                                <td style={pCellC}>{lr.vehicle?.registration_no || '-'}</td>
                                <td style={pCellC}>{fmtDate(lr.inward_time)}</td>
                                <td style={pCellC}>{fmtTime(lr.inward_time)}</td>
                                <td style={pCellC}>{fmtDate(lr.outward_time)}</td>
                                <td style={pCellC}>{fmtTime(lr.outward_time)}</td>
                                <td style={pCellC}>{calcDiffDays(lr.inward_time, lr.outward_time)}</td>
                                <td style={pCellC}>{lr.detention_days && Number(lr.detention_days) > 0 ? lr.detention_days : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div style={{ width: '100%', flexShrink: 0 }}>
                <img src="/footer-1.jpg" alt="Footer" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
        </div>
    );
}

/* ── Main Module ──────────────────────────────── */
export default function PrintLRModule() {
    const [businessType, setBusinessType] = useState<'BEIL' | 'PI'>('BEIL');
    const [records, setRecords] = useState<LRRecord[]>([]);
    const [filtered, setFiltered] = useState<LRRecord[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const [filters, setFilters] = useState({
        dateFrom: '', dateTo: '',
        lrNo: '', manifestNo: '',
        vehicleNo: '', company: '', location: '',
    });
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/lrs').then(r => {
            const data = Array.isArray(r.data) ? r.data : (r.data?.data || []);
            setRecords(data);
            setFiltered(data);
        }).catch(err => {
            console.error('Failed to load LRs:', err);
            setRecords([]);
            setFiltered([]);
        }).finally(() => setLoading(false));
    }, []);

    const applyFilters = useCallback(() => {
        let result = [...records];
        const f = filters;
        if (f.dateFrom) result = result.filter(r => (r.lr_date || '') >= f.dateFrom);
        if (f.dateTo) result = result.filter(r => (r.lr_date || '') <= f.dateTo);
        if (f.lrNo) result = result.filter(r => (r.lr_no || '').toLowerCase().includes(f.lrNo.toLowerCase()));
        if (f.manifestNo) result = result.filter(r => (r.manifest_no || '').toLowerCase().includes(f.manifestNo.toLowerCase()));
        if (f.vehicleNo) result = result.filter(r => (r.vehicle?.registration_no || '').toLowerCase().includes(f.vehicleNo.toLowerCase()));
        if (f.company) result = result.filter(r => (r.billing_party?.name || '').toLowerCase().includes(f.company.toLowerCase()));
        if (f.location) result = result.filter(r => (r.location_from?.name || r.from_city?.name || '').toLowerCase().includes(f.location.toLowerCase()));
        setFiltered(result);
    }, [records, filters]);

    useEffect(() => { applyFilters(); }, [filters, applyFilters]);

    const clearFilters = () => {
        setFilters({ dateFrom: '', dateTo: '', lrNo: '', manifestNo: '', vehicleNo: '', company: '', location: '' });
        setFiltered(records);
    };

    /* ── Selection helpers ──────────────────────── */
    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const selectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(lr => lr.id)));
        }
    };
    const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

    // Records to print: selected ones, or all filtered if none selected
    const printRecords = selectedIds.size > 0
        ? filtered.filter(lr => selectedIds.has(lr.id))
        : filtered;

    /* ── PDF Generation ────────────────────────── */
    const handleGeneratePDF = async () => {
        if (printRecords.length === 0) return;
        setGenerating(true);
        setShowPreview(true);
        await new Promise(r => setTimeout(r, 800));

        try {
            const el = document.getElementById('lr-print-container');
            if (!el) throw new Error('Print container not found');

            const isLandscape = businessType === 'BEIL';
            const canvasWidth = isLandscape ? 1123 : 794;

            const canvas = await html2canvas(el, {
                scale: 2, useCORS: true, logging: false,
                width: canvasWidth, windowWidth: canvasWidth,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
            const pdfWidth = isLandscape ? 297 : 210;
            const pdfHeight = isLandscape ? 210 : 297;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let position = 0;
            let remaining = imgHeight;
            while (remaining > 0) {
                if (position > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, -position, pdfWidth, imgHeight);
                position += pdfHeight;
                remaining -= pdfHeight;
            }

            pdf.save(`${businessType}_LR_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Failed to generate PDF.');
        } finally {
            setShowPreview(false);
            setGenerating(false);
        }
    };

    /* ── BEIL Screen Table ─────────────────────── */
    const renderBEILTable = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
                <tr style={{ background: '#1e40af', color: 'white' }}>
                    <th style={{ padding: '10px 8px', width: 40 }}>
                        <Checkbox checked={allSelected} onCheckedChange={selectAll}
                            style={{ borderColor: 'white' }} />
                    </th>
                    {['#', 'Inward Date', 'Inward Time', 'Outward Date', 'Outward Time', 'Company', 'Location', 'Truck No.', 'LR No', 'Manifest N.', 'Manifest Date', 'Distance', 'Rate', 'Detention', 'Det. Rate', 'Det. Amt', 'Total Amt'].map((h, i) => (
                        <th key={i} style={{ padding: '10px 6px', textAlign: i >= 12 ? 'right' : 'left', whiteSpace: 'nowrap', fontSize: 11 }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {filtered.map((lr, idx) => {
                    const rate = lr.items?.[0]?.rate || 0;
                    const isSelected = selectedIds.has(lr.id);
                    return (
                        <tr key={lr.id}
                            onClick={() => toggleSelect(lr.id)}
                            style={{
                                borderBottom: '1px solid #e2e8f0', cursor: 'pointer',
                                background: isSelected ? '#dbeafe' : idx % 2 === 0 ? 'white' : '#f8fafc',
                                transition: 'background 0.15s',
                            }}>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(lr.id)} />
                            </td>
                            <td style={{ padding: '8px', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '6px', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(lr.inward_time)}</td>
                            <td style={{ padding: '6px', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtTime(lr.inward_time)}</td>
                            <td style={{ padding: '6px', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(lr.outward_time)}</td>
                            <td style={{ padding: '6px', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtTime(lr.outward_time)}</td>
                            <td style={{ padding: '6px', fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lr.billing_party?.name || '-'}</td>
                            <td style={{ padding: '6px', fontSize: 11 }}>{lr.location_from?.name || lr.from_city?.name || '-'}</td>
                            <td style={{ padding: '6px', fontWeight: 600, fontSize: 11 }}>{lr.vehicle?.registration_no || '-'}</td>
                            <td style={{ padding: '6px', fontWeight: 600, color: '#1e40af', fontSize: 11 }}>{lr.lr_no}</td>
                            <td style={{ padding: '6px', fontSize: 11 }}>{lr.manifest_no || '-'}</td>
                            <td style={{ padding: '6px', whiteSpace: 'nowrap', fontSize: 11 }}>{lr.manifest_date ? fmtDate(lr.manifest_date) : '-'}</td>
                            <td style={{ padding: '6px', textAlign: 'center', fontSize: 11 }}>{lr.distance || '-'}</td>
                            <td style={{ padding: '6px', textAlign: 'right', fontSize: 11 }}>{rate || 0}</td>
                            <td style={{ padding: '6px', textAlign: 'center', fontSize: 11 }}>{lr.detention_days || 0}</td>
                            <td style={{ padding: '6px', textAlign: 'right', fontSize: 11 }}>{lr.detention_rate || 0}</td>
                            <td style={{ padding: '6px', textAlign: 'right', fontSize: 11 }}>{lr.total_detention_amount || 0}</td>
                            <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, fontSize: 11 }}>{lr.total_amount || 0}</td>
                        </tr>
                    );
                })}
            </tbody>
            <tfoot>
                <tr style={{ background: '#1e293b', color: 'white', fontWeight: 700 }}>
                    <td colSpan={15} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>Grand Total:</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12 }}>
                        ₹{filtered.reduce((s, lr) => s + Number(lr.total_detention_amount || 0), 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, color: '#a5f3fc' }}>
                        ₹{filtered.reduce((s, lr) => s + Number(lr.total_amount || 0), 0).toLocaleString('en-IN')}
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    );

    /* ── PI Screen Table ───────────────────────── */
    const renderPITable = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
                <tr style={{ background: '#7c3aed', color: 'white' }}>
                    <th style={{ padding: '10px 8px', width: 40 }}>
                        <Checkbox checked={allSelected} onCheckedChange={selectAll}
                            style={{ borderColor: 'white' }} />
                    </th>
                    {['#', 'Manifest No.', 'Tanker NO.', 'Inward Date & Time', 'Outward Date & Time', 'Difference (Days)', 'Detention Charges After 24 hrs.'].map((h, i) => (
                        <th key={i} style={{ padding: '10px 12px', textAlign: i >= 5 ? 'center' : 'left', whiteSpace: 'nowrap', fontSize: 12 }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {filtered.map((lr, idx) => {
                    const isSelected = selectedIds.has(lr.id);
                    return (
                        <tr key={lr.id}
                            onClick={() => toggleSelect(lr.id)}
                            style={{
                                borderBottom: '1px solid #ede9fe', cursor: 'pointer',
                                background: isSelected ? '#ede9fe' : idx % 2 === 0 ? 'white' : '#faf5ff',
                                transition: 'background 0.15s',
                            }}>
                            <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(lr.id)} />
                            </td>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{lr.manifest_no || '-'}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#7c3aed' }}>{lr.vehicle?.registration_no || '-'}</td>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{fmtDateTime(lr.inward_time)}</td>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{fmtDateTime(lr.outward_time)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{calcDiffDays(lr.inward_time, lr.outward_time)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: Number(lr.detention_days) > 0 ? '#ea580c' : '#94a3b8' }}>
                                {lr.detention_days && Number(lr.detention_days) > 0 ? lr.detention_days : '-'}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div>
            {/* Header Controls */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, gap: 4 }}>
                    {(['BEIL', 'PI'] as const).map(type => (
                        <button key={type} onClick={() => { setBusinessType(type); setSelectedIds(new Set()); }}
                            style={{
                                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                                background: businessType === type ? (type === 'BEIL' ? '#1e40af' : '#7c3aed') : 'transparent',
                                color: businessType === type ? 'white' : '#64748b',
                                boxShadow: businessType === type ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                                transition: 'all 0.2s',
                            }}>
                            <Building2 size={13} style={{ display: 'inline', marginRight: 6 }} />
                            {type} Industries
                        </button>
                    ))}
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {selectedIds.size > 0 && (
                        <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, background: '#dbeafe', padding: '4px 12px', borderRadius: 8 }}>
                            <CheckSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {selectedIds.size} selected
                        </span>
                    )}
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)} style={{ gap: 6 }}>
                        <Filter size={14} /> Filters
                        <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </Button>
                    <Button onClick={handleGeneratePDF}
                        disabled={generating || printRecords.length === 0}
                        style={{ background: businessType === 'BEIL' ? '#1e40af' : '#7c3aed', color: 'white', gap: 6, fontWeight: 700 }}>
                        <Download size={14} /> {generating ? 'Generating...' : `Download PDF (${printRecords.length})`}
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Search size={14} /> Advanced Filters
                        </span>
                        <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <X size={12} /> Clear All
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                        <div>
                            <Label style={{ fontSize: 11 }}>From Date</Label>
                            <Input type="date" className="mt-1" value={filters.dateFrom}
                                onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} style={{ height: 36 }} />
                        </div>
                        <div>
                            <Label style={{ fontSize: 11 }}>To Date</Label>
                            <Input type="date" className="mt-1" value={filters.dateTo}
                                onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} style={{ height: 36 }} />
                        </div>
                        <div>
                            <Label style={{ fontSize: 11 }}>LR Number</Label>
                            <Input className="mt-1" placeholder="Search LR..." value={filters.lrNo}
                                onChange={e => setFilters(p => ({ ...p, lrNo: e.target.value }))} style={{ height: 36 }} />
                        </div>
                        <div>
                            <Label style={{ fontSize: 11 }}>Manifest Number</Label>
                            <Input className="mt-1" placeholder="Search manifest..." value={filters.manifestNo}
                                onChange={e => setFilters(p => ({ ...p, manifestNo: e.target.value }))} style={{ height: 36 }} />
                        </div>
                        <div>
                            <Label style={{ fontSize: 11 }}>Vehicle / Truck No.</Label>
                            <Input className="mt-1" placeholder="Search vehicle..." value={filters.vehicleNo}
                                onChange={e => setFilters(p => ({ ...p, vehicleNo: e.target.value }))} style={{ height: 36 }} />
                        </div>
                        <div>
                            <Label style={{ fontSize: 11 }}>Company / Billing Party</Label>
                            <Input className="mt-1" placeholder="Search company..." value={filters.company}
                                onChange={e => setFilters(p => ({ ...p, company: e.target.value }))} style={{ height: 36 }} />
                        </div>
                        <div>
                            <Label style={{ fontSize: 11 }}>Location</Label>
                            <Input className="mt-1" placeholder="Search location..." value={filters.location}
                                onChange={e => setFilters(p => ({ ...p, location: e.target.value }))} style={{ height: 36 }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 12px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
                <span style={{ fontSize: 13, color: '#0369a1' }}>
                    Showing <strong>{filtered.length}</strong> of {records.length} LR records
                    {selectedIds.size > 0 && <> · <strong>{selectedIds.size}</strong> selected for PDF</>}
                </span>
                {filtered.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                        Total: ₹{filtered.reduce((s, lr) => s + Number(lr.total_amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                )}
            </div>

            {/* Data Table */}
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                        Loading LR records...
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                        <Filter size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p style={{ fontSize: 14 }}>No LR records found. {records.length > 0 ? 'Try adjusting your filters.' : 'Create LR records first.'}</p>
                    </div>
                ) : (
                    businessType === 'BEIL' ? renderBEILTable() : renderPITable()
                )}
            </div>

            {/* Hidden Print Preview */}
            {showPreview && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
                    {businessType === 'BEIL'
                        ? <BEILPrintView records={printRecords} />
                        : <PIPrintView records={printRecords} />
                    }
                </div>
            )}
        </div>
    );
}
