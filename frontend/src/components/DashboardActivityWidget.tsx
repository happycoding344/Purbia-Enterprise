import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLogItem {
    id: number;
    action: string;
    model_type: string;
    description: string;
    user?: { name: string };
    created_at: string;
}

const actionColors: Record<string, string> = {
    created: '#10b981',
    updated: '#3b82f6',
    deleted: '#ef4444',
};

export function DashboardActivityWidget() {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const response = await api.get('/activity-logs/dashboard');
            setLogs(response.data);
        } catch (error) {
            console.error('Failed to load dashboard activities:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity size={20} className="text-blue-600" />
                    Recent Activity
                </h3>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No recent activity
                </div>
            ) : (
                <div className="space-y-3">
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                            <div
                                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                                style={{ backgroundColor: actionColors[log.action] || '#gray-400' }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 line-clamp-2">{log.description}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <Clock size={10} />
                                    <span>{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                                    {log.user && (
                                        <>
                                            <span>•</span>
                                            <span>{log.user.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
