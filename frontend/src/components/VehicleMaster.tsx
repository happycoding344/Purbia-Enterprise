import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Truck, Pencil, Trash2, Upload, X, Calendar } from 'lucide-react';

type Vehicle = {
    id: number;
    registration_no: string;
    type: string;
    party_name: string;
    owner_name: string;
    mobile_number: string;
    fitness_initial: string;
    fitness_expiry: string;
    puc_initial: string;
    puc_expiry: string;
    insurance_number: string;
    insurance_initial: string;
    insurance_expiry: string;
    national_permit_initial: string;
    national_permit_expiry: string;
    state_permit_initial: string;
    state_permit_expiry: string;
    gps_initial: string;
    gps_expiry: string;
    tax_lifetime: boolean;
    attachments?: { id: number; original_name: string; file_path: string }[];
};

const emptyVehicle = (): Omit<Vehicle, 'id' | 'attachments'> => ({
    registration_no: '', type: '', party_name: '', owner_name: '', mobile_number: '',
    fitness_initial: '', fitness_expiry: '',
    puc_initial: '', puc_expiry: '',
    insurance_number: '', insurance_initial: '', insurance_expiry: '',
    national_permit_initial: '', national_permit_expiry: '',
    state_permit_initial: '', state_permit_expiry: '',
    gps_initial: '', gps_expiry: '',
    tax_lifetime: false,
});

const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return exp <= thirtyDaysFromNow && exp >= new Date();
};

const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
};

function DateRangePair({ label, initialKey, expiryKey, values, onChange }: {
    label: string;
    initialKey: string;
    expiryKey: string;
    values: Record<string, string>;
    onChange: (key: string, val: string) => void;
}) {
    const expiry = values[expiryKey];
    const expired = isExpired(expiry);
    const expiring = isExpiringSoon(expiry);

    return (
        <div style={{ background: expired ? '#fff1f2' : expiring ? '#fffbeb' : '#f8fafc', borderRadius: 12, padding: 16, border: `1px solid ${expired ? '#fecdd3' : expiring ? '#fde68a' : '#e2e8f0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color={expired ? '#ef4444' : expiring ? '#f59e0b' : '#64748b'} />
                    {label}
                </span>
                {expiry && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: expired ? '#fee2e2' : expiring ? '#fef3c7' : '#dcfce7', color: expired ? '#dc2626' : expiring ? '#d97706' : '#16a34a' }}>
                        {expired ? '⚠ Expired' : expiring ? '⏰ Expiring Soon' : '✓ Valid'}
                    </span>
                )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                    <Label style={{ fontSize: 11, color: '#64748b' }}>Initial Date</Label>
                    <Input type="date" className="mt-1" value={values[initialKey] || ''}
                        onChange={e => onChange(initialKey, e.target.value)} />
                </div>
                <div>
                    <Label style={{ fontSize: 11, color: '#64748b' }}>Expiry Date</Label>
                    <Input type="date" className="mt-1" value={values[expiryKey] || ''}
                        onChange={e => onChange(expiryKey, e.target.value)} />
                </div>
            </div>
        </div>
    );
}

export default function VehicleMaster() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const [form, setForm] = useState(emptyVehicle());
    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        try {
            const res = await api.get('/vehicles');
            setVehicles(res.data);
        } catch {
            setError('Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm(emptyVehicle());
        setFiles([]);
        setShowForm(true);
    };

    const openEdit = (v: Vehicle) => {
        setEditing(v);
        const { id, attachments, ...rest } = v;
        setForm({ ...emptyVehicle(), ...rest });
        setFiles([]);
        setShowForm(true);
    };

    const updateField = (key: string, val: string | boolean) => {
        setForm(prev => ({ ...prev, [key]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            files.forEach(f => fd.append('attachments[]', f));

            if (editing) {
                fd.append('_method', 'PUT');
                await api.post(`/vehicles/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/vehicles', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            await loadVehicles();
            setShowForm(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save vehicle');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this vehicle?')) return;
        await api.delete(`/vehicles/${id}`);
        setVehicles(prev => prev.filter(v => v.id !== id));
    };

    const getStatusColor = (v: Vehicle) => {
        const expiries = [v.fitness_expiry, v.puc_expiry, v.insurance_expiry, v.national_permit_expiry];
        const hasExpired = expiries.some(d => d && isExpired(d));
        const hasExpiring = expiries.some(d => d && isExpiringSoon(d));
        if (hasExpired) return { bg: '#fee2e2', color: '#dc2626', label: 'Attention Needed' };
        if (hasExpiring) return { bg: '#fef3c7', color: '#d97706', label: 'Expiring Soon' };
        return { bg: '#dcfce7', color: '#16a34a', label: 'All Good' };
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in fleet</span>
                </div>
                <Button onClick={openCreate} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none' }}>
                    <Plus size={14} /> Add Vehicle
                </Button>
            </div>

            {error && <div style={{ padding: '14px 20px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', marginBottom: 16 }}>{error}</div>}

            {/* Vehicle Cards Grid */}
            {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading vehicles...</div>
            ) : vehicles.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
                    <Truck size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p style={{ marginBottom: 16, fontSize: 15 }}>No vehicles in your fleet yet.</p>
                    <Button onClick={openCreate}>Add Your First Vehicle</Button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {vehicles.map(v => {
                        const status = getStatusColor(v);
                        return (
                            <div key={v.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.2s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                            >
                                {/* Card Header */}
                                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Truck size={20} color="white" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{v.registration_no}</div>
                                            <div style={{ color: '#93c5fd', fontSize: 11 }}>{v.type || 'Vehicle'}</div>
                                        </div>
                                    </div>
                                    <span style={{ padding: '4px 10px', borderRadius: 20, background: status.bg, color: status.color, fontSize: 11, fontWeight: 700 }}>
                                        {status.label}
                                    </span>
                                </div>

                                {/* Card Details */}
                                <div style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                        {[
                                            { label: 'Party', value: v.party_name },
                                            { label: 'Owner', value: v.owner_name },
                                            { label: 'Mobile', value: v.mobile_number },
                                            { label: 'Tax Lifetime', value: v.tax_lifetime ? 'Yes' : 'No' },
                                        ].map(detail => (
                                            <div key={detail.label}>
                                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{detail.label}</div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{detail.value || '-'}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Permit Status Badges */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                                        {[
                                            { label: 'Fitness', expiry: v.fitness_expiry },
                                            { label: 'PUC', expiry: v.puc_expiry },
                                            { label: 'Insurance', expiry: v.insurance_expiry },
                                            { label: 'Nat. Permit', expiry: v.national_permit_expiry },
                                        ].map(permit => {
                                            const expired = permit.expiry && isExpired(permit.expiry);
                                            const expiring = permit.expiry && isExpiringSoon(permit.expiry);
                                            return (
                                                <span key={permit.label} style={{
                                                    padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                                                    background: expired ? '#fee2e2' : expiring ? '#fef3c7' : permit.expiry ? '#dcfce7' : '#f1f5f9',
                                                    color: expired ? '#dc2626' : expiring ? '#d97706' : permit.expiry ? '#16a34a' : '#94a3b8',
                                                }}>
                                                    {permit.label}: {permit.expiry ? (expired ? 'Exp.' : expiring ? 'Soon' : 'OK') : 'N/A'}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                                        <Button variant="outline" size="sm" onClick={() => openEdit(v)} style={{ flex: 1 }}>
                                            <Pencil size={13} /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(v.id)} style={{ color: '#ef4444', borderColor: '#fecaca' }}>
                                            <Trash2 size={13} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Vehicle Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fee2e2', color: '#991b1b', marginBottom: 16, fontSize: 13 }}>{error}</div>}

                        {/* Basic Info */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, padding: '8px 0', borderBottom: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Truck size={14} color="#3b82f6" /> Basic Information
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <Label>Vehicle Number *</Label>
                                    <Input className="mt-1" placeholder="MH-01-AB-1234" value={form.registration_no}
                                        onChange={e => updateField('registration_no', e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Vehicle Type</Label>
                                    <Input className="mt-1" placeholder="Tanker / Dumper..." value={form.type}
                                        onChange={e => updateField('type', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Party Name</Label>
                                    <Input className="mt-1" placeholder="Party name" value={form.party_name}
                                        onChange={e => updateField('party_name', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Owner Name</Label>
                                    <Input className="mt-1" placeholder="Owner name" value={form.owner_name}
                                        onChange={e => updateField('owner_name', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Mobile Number</Label>
                                    <Input className="mt-1" placeholder="10-digit mobile" value={form.mobile_number}
                                        onChange={e => updateField('mobile_number', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Insurance Number</Label>
                                    <Input className="mt-1" placeholder="Policy number" value={form.insurance_number}
                                        onChange={e => updateField('insurance_number', e.target.value)} />
                                </div>
                            </div>

                            {/* Tax Lifetime Radio */}
                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Label>Tax Lifetime Permit?</Label>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    {[true, false].map(val => (
                                        <label key={String(val)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                                            <input type="radio" checked={form.tax_lifetime === val}
                                                onChange={() => updateField('tax_lifetime', val)} style={{ accentColor: '#3b82f6' }} />
                                            {val ? 'Yes' : 'No'}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Permit Dates */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, padding: '8px 0', borderBottom: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Calendar size={14} color="#8b5cf6" /> Document Validity Dates
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <DateRangePair label="Fitness" initialKey="fitness_initial" expiryKey="fitness_expiry" values={form as any} onChange={updateField} />
                                <DateRangePair label="PUC" initialKey="puc_initial" expiryKey="puc_expiry" values={form as any} onChange={updateField} />
                                <DateRangePair label="Insurance" initialKey="insurance_initial" expiryKey="insurance_expiry" values={form as any} onChange={updateField} />
                                <DateRangePair label="National Permit" initialKey="national_permit_initial" expiryKey="national_permit_expiry" values={form as any} onChange={updateField} />
                                <DateRangePair label="State Permit" initialKey="state_permit_initial" expiryKey="state_permit_expiry" values={form as any} onChange={updateField} />
                                <DateRangePair label="GPS Details" initialKey="gps_initial" expiryKey="gps_expiry" values={form as any} onChange={updateField} />
                            </div>
                        </div>

                        {/* Document Upload */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, padding: '8px 0', borderBottom: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Upload size={14} color="#10b981" /> Documents Upload
                            </div>
                            <div
                                onClick={() => document.getElementById('vehicle-files')?.click()}
                                style={{ border: '2px dashed #cbd5e0', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s' }}
                            >
                                <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: 13, color: '#64748b' }}>Click or drag to upload (max 50MB each)</div>
                                <input id="vehicle-files" type="file" multiple hidden
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

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', border: 'none' }}>
                                {submitting ? 'Saving...' : (editing ? 'Update Vehicle' : 'Add Vehicle')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
