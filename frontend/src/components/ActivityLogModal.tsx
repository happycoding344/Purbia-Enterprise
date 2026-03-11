import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLogItem {
    id: number;
    action: string;
    model_type: string;
    description: string;
    user?: { name: string; email: string };
    created_at: string;
    metadata?: any;
}

interface ActivityLogModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const actionColors: Record<string, string> = {
    created: '#10b981',
    updated: '#3b82f6',
    deleted: '#ef4444',
};

const actionIcons: Record<string, string> = {
    created: '✓',
    updated: '✎',
    deleted: '✗',
};

export function ActivityLogModal({ open, onOpenChange }: ActivityLogModalProps) {
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadLogs();
        }
    }, [open]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/activity-logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Failed to load activity logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity size={20} />
                        Activity Log
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No activities yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                        style={{ backgroundColor: actionColors[log.action] || '#gray-600' }}
                                    >
                                        {actionIcons[log.action] || '•'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{log.description}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                        {log.model_type}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="capitalize">{log.action}</span>
                                                    {log.user && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{log.user.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                                                <Clock size={12} />
                                                <span>{format(new Date(log.created_at), 'MMM dd, HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
