import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '60px 40px',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <AlertCircle size={80} color="#ef4444" style={{ margin: '0 auto 24px' }} />

                <h1 style={{
                    fontSize: '72px',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '16px',
                    lineHeight: 1
                }}>
                    404
                </h1>

                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '12px'
                }}>
                    Page Not Found
                </h2>

                <p style={{
                    fontSize: '16px',
                    color: '#64748b',
                    marginBottom: '32px',
                    lineHeight: 1.6
                }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <Button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 32px',
                        fontSize: '16px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Home size={20} />
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
