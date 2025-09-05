import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Printer, FilePlus } from 'lucide-react';
import { invoicesStorage, customersStorage } from '@/lib/storage';
import type { Invoice } from '@/lib/storage';

export default function Print() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filtered, setFiltered] = useState<Invoice[]>([]);
    const [q, setQ] = useState('');

    useEffect(() => {
        const all = invoicesStorage
            .getAll()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(all);
        setFiltered(all);
    }, []);

    useEffect(() => {
        if (!q) {
            setFiltered(invoices);
            return;
        }
        const qLower = q.toLowerCase();
        const next = invoices.filter((inv) => {
            const customer = customersStorage.get(inv.customerId);
            return (
                inv.number.toLowerCase().includes(qLower) ||
                customer?.name.toLowerCase().includes(qLower) ||
                inv.notes?.toLowerCase().includes(qLower)
            );
        });
        setFiltered(next);
    }, [q, invoices]);

    const latest = invoices[0];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">الطباعة</h1>
                        <p className="text-muted-foreground">اختر فاتورة لعرضها وطباعتها أو تنزيلها PDF</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild className="gradient-primary">
                            <Link to="/new-invoice">
                                <FilePlus className="w-4 h-4 ml-2" />
                                فاتورة جديدة
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            {latest && (
                <Card className="glass-card border-0">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="font-semibold">أحدث فاتورة: {latest.number}</div>
                                <div className="text-sm text-muted-foreground">
                                    التاريخ: {new Date(latest.issueDate).toLocaleDateString('ar-YE')}
                                </div>
                            </div>
                            <div>
                                <Button asChild className="glass-card border-white/20" variant="outline">
                                    <Link to={`/print/${latest.id}`}>
                                        <Printer className="w-4 h-4 ml-2" />
                                        طباعة أحدث فاتورة
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <Card className="glass-card border-0">
                <CardContent className="p-4">
                    <div className="relative max-w-xl">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card className="glass-card border-0">
                <CardHeader>
                    <CardTitle>الفواتير ({filtered.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">لا توجد فواتير</div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((inv) => {
                                const customer = customersStorage.get(inv.customerId);
                                return (
                                    <div
                                        key={inv.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="font-semibold">{inv.number}</div>
                                            <div className="text-sm text-muted-foreground">العميل: {customer?.name || '—'}</div>
                                            <div className="text-sm text-muted-foreground">التاريخ: {new Date(inv.issueDate).toLocaleDateString('ar-YE')}</div>
                                        </div>
                                        <div className="mt-3 sm:mt-0">
                                            <Button asChild size="sm" variant="outline" className="glass-card border-white/20">
                                                <Link to={`/print/${inv.id}`}>
                                                    <Printer className="w-4 h-4 ml-2" />
                                                    طباعة
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}