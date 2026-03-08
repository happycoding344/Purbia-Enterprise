import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Download, FileText } from 'lucide-react';
import { LRForm } from './LRForm';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface LR {
    id: number;
    lr_no: string;
    lr_date: string;
    pref_no: string;
    financial_year: string;
    total_amount: number;
    vehicle?: {
        registration_no: string;
    };
    from_city?: {
        name: string;
    };
    to_city?: {
        name: string;
    };
}

export default function LRList() {
    const [lrs, setLrs] = useState<LR[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchLrs();
    }, []);

    const fetchLrs = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/lrs');
            setLrs(response.data);
        } catch (error) {
            console.error('Error fetching LRs', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="py-10 text-center text-gray-500">Loading LR history...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Loading Receipt (LR) History</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Prepare New LR
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0">
                        <LRForm onSuccess={() => { fetchLrs(); setOpen(false); }} />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-24">LR No.</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lrs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    No LRs generated yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            lrs.map((lr) => (
                                <TableRow key={lr.id} className="hover:bg-blue-50/30 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{lr.lr_no}</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{lr.pref_no}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{new Date(lr.lr_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-sm">
                                            <span className="font-medium">{lr.from_city?.name}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="font-medium">{lr.to_city?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-gray-50 font-mono text-xs border-gray-200">
                                            {lr.vehicle?.registration_no}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-blue-700">
                                        ₹{parseFloat(String(lr.total_amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
