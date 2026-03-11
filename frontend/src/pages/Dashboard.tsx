import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LRList from '@/components/LRList';
import VehicleMaster from '@/components/VehicleMaster';
import InvoiceModule from '@/components/InvoiceModule';
import PrintLRModule from '@/components/PrintLRModule';
import InvoiceHistory from '@/components/InvoiceHistory';
import CustomersList from '@/components/CustomersList';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ActivityLogModal } from '@/components/ActivityLogModal';
import { DashboardActivityWidget } from '@/components/DashboardActivityWidget';
import {
    FileText, Truck, Receipt, Printer, History,
    Users, LogOut, Menu, ChevronRight,
    BarChart3, TrendingUp, AlertCircle, Activity
} from 'lucide-react';

type ActiveModule =
    | 'dashboard'
    | 'lr-preparation'
    | 'generate-invoice'
    | 'print-lr'
    | 'vehicle-master'
    | 'invoice-history'
    | 'customers';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, section: 'Overview' },
    { id: 'lr-preparation', label: 'LR Preparation', icon: FileText, section: 'Operations' },
    { id: 'generate-invoice', label: 'Generate Invoice', icon: Receipt, section: 'Operations' },
    { id: 'print-lr', label: 'Print LR', icon: Printer, section: 'Operations' },
    { id: 'vehicle-master', label: 'Vehicle Master', icon: Truck, section: 'Masters' },
    { id: 'invoice-history', label: 'Invoice History', icon: History, section: 'Masters' },
    { id: 'customers', label: 'Customer Master', icon: Users, section: 'Masters' },
];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { module } = useParams();
    const [activeModule, setActiveModule] = useState<ActiveModule>((module as ActiveModule) || 'dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activityLogOpen, setActivityLogOpen] = useState(false);

    useEffect(() => {
        if (module && module !== activeModule) {
            setActiveModule(module as ActiveModule);
        }
    }, [module, activeModule]);

    const handleModuleChange = (newModule: ActiveModule) => {
        setActiveModule(newModule);
        navigate(newModule === 'dashboard' ? '/' : `/${newModule}`);
        setSidebarOpen(false);
    };

    const sections = [...new Set(navItems.map(item => item.section))];

    const renderContent = () => {
        switch (activeModule) {
            case 'dashboard': return <DashboardHome onNavigate={setActiveModule} />;
            case 'lr-preparation': return <LRList />;
            case 'generate-invoice': return <InvoiceModule />;
            case 'print-lr': return <PrintLRModule />;
            case 'vehicle-master': return <VehicleMaster />;
            case 'invoice-history': return <InvoiceHistory />;
            case 'customers': return <CustomersList />;
            default: return <DashboardHome onNavigate={setActiveModule} />;
        }
    };

    const activeItem = navItems.find(n => n.id === activeModule);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className="sidebar"
                style={{ transform: sidebarOpen ? 'translateX(0)' : undefined }}
            >
                {/* Logo */}
                <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                            src="https://purbiaenterprise.com/wp-content/uploads/2025/06/cropped-ff-27fe08532e0ec99e1a0f7588968facd9-ff-IMG-20250609-WA00031.jpg"
                            alt="Logo"
                            style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Purbia Enterprise</div>
                            <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Logistics Management</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ padding: '12px 0', flex: 1 }}>
                    {sections.map(section => (
                        <div key={section}>
                            <div style={{ padding: '8px 24px 4px', color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {section}
                            </div>
                            {navItems.filter(item => item.section === section).map(item => {
                                const Icon = item.icon;
                                const isActive = activeModule === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                        onClick={() => handleModuleChange(item.id as ActiveModule)}
                                    >
                                        <Icon size={16} />
                                        <span>{item.label}</span>
                                        {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User Info */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0
                        }}>
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ color: 'white', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.name || 'Admin'}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.email}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{
                            width: '100%', padding: '8px', borderRadius: 8,
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#fca5a5', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content" style={{ flex: 1, minWidth: 0 }}>
                {/* Top Header */}
                <header style={{
                    background: 'white', borderBottom: '1px solid #e2e8f0',
                    padding: '0 24px', height: 64,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'sticky', top: 0, zIndex: 20,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={() => setSidebarOpen(true)}
                            style={{ display: 'none', padding: 8, borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer' }}
                            className="mobile-menu-btn"
                        >
                            <Menu size={20} />
                        </button>
                        <div>
                            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                {activeItem?.label || 'Dashboard'}
                            </h2>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                {activeItem?.section || 'Overview'} · Purbia Enterprise
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <GlobalSearch />
                        <button
                            onClick={() => setActivityLogOpen(true)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: 8,
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: '#3b82f6',
                                fontSize: 14,
                                fontWeight: 500,
                                transition: 'all 0.2s'
                            }}
                            title="Activity Log"
                            onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <Activity size={18} />
                            Activity
                        </button>
                        <div style={{
                            padding: '6px 14px', borderRadius: 20,
                            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                            color: '#166534', fontSize: 12, fontWeight: 600
                        }}>
                            ● System Online
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
                    {renderContent()}
                </main>
            </div>

            {/* Activity Log Modal */}
            <ActivityLogModal open={activityLogOpen} onOpenChange={setActivityLogOpen} />
        </div>
    );
}

// Dashboard Home Component
function DashboardHome({ onNavigate }: { onNavigate: (module: ActiveModule) => void }) {
    const quickActions = [
        { label: 'New LR', desc: 'Create Loading Receipt', icon: FileText, module: 'lr-preparation', color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Generate Invoice', desc: 'BEIL or PI Industries', icon: Receipt, module: 'generate-invoice', color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Print LR', desc: 'Filter & Print records', icon: Printer, module: 'print-lr', color: '#10b981', bg: '#f0fdf4' },
        { label: 'Vehicle Master', desc: 'Manage fleet', icon: Truck, module: 'vehicle-master', color: '#f59e0b', bg: '#fffbeb' },
    ];

    return (
        <div>
            {/* Welcome Banner */}
            <div style={{
                borderRadius: 20, padding: '28px 32px', marginBottom: 24,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
                color: 'white', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', right: -30, top: -30,
                    width: 200, height: 200, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.04)'
                }} />
                <div style={{
                    position: 'absolute', right: 60, bottom: -60,
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)'
                }} />
                <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: 13, color: '#93c5fd', fontWeight: 500, marginBottom: 6 }}>
                        Welcome back 👋
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        Logistics Command Center
                    </h1>
                    <p style={{ color: '#bfdbfe', fontSize: 14, maxWidth: 480 }}>
                        Manage Loading Receipts, Invoices, Vehicle Fleet, and more — all from one unified platform for Purbia Enterprise.
                    </p>
                </div>
            </div>

            {/* Quick Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.module}
                            onClick={() => onNavigate(action.module as ActiveModule)}
                            style={{
                                background: 'white', border: '1px solid #e2e8f0',
                                borderRadius: 16, padding: 20, cursor: 'pointer',
                                textAlign: 'left', transition: 'all 0.2s',
                                display: 'flex', flexDirection: 'column', gap: 12,
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: action.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Icon size={22} color={action.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>
                                    {action.label}
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{action.desc}</div>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: action.color, fontSize: 12, fontWeight: 600 }}>
                                Open Module <ChevronRight size={14} />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Info Modules */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <TrendingUp size={18} color="#3b82f6" />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Module Overview</span>
                    </div>
                    {[
                        { name: 'LR Preparation', desc: '4-Part form with auto calculations', status: 'Active' },
                        { name: 'Invoice - BEIL', desc: 'Manual LR line items entry', status: 'Active' },
                        { name: 'Invoice - PI', desc: 'Select LRs from existing records', status: 'Active' },
                        { name: 'Print LR', desc: 'Filter and export LR data as PDF', status: 'Active' },
                        { name: 'Vehicle Master', desc: 'Full fleet management with docs', status: 'Active' },
                        { name: 'Invoice History', desc: 'View & manage all invoices', status: 'Active' },
                    ].map(mod => (
                        <div key={mod.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{mod.name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{mod.desc}</div>
                            </div>
                            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600 }}>
                                {mod.status}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <AlertCircle size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>System Information</span>
                    </div>
                    {[
                        { label: 'Backed by', value: 'Laravel 11 + Sanctum' },
                        { label: 'Frontend', value: 'React 18 + Vite + Tailwind' },
                        { label: 'Database', value: 'MySQL (Hostinger)' },
                        { label: 'File Storage', value: 'Laravel Storage (50MB/file)' },
                        { label: 'Business Types', value: 'BEIL Industries, PI Industries' },
                        { label: 'Auth', value: 'Token-based (Bearer)' },
                        { label: 'API URL', value: import.meta.env.VITE_API_URL || 'Configured' },
                    ].map(info => (
                        <div key={info.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: 12, color: '#64748b' }}>{info.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{info.value}</span>
                        </div>
                    ))}
                </div>

                {/* Recent Activity Widget */}
                <DashboardActivityWidget />
            </div>
        </div>
    );
}
