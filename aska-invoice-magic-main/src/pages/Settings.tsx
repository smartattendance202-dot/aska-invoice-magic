import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { settingsStorage, type Settings } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
    const [form, setForm] = useState<Settings>({
        lastInvoiceNumber: 0,
        defaultTaxPercent: 15,
        companyName: '',
        companyAddress: '',
        companyPhone: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const s = settingsStorage.get();
        setForm(s);
        setLoading(false);
    }, []);

    const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // basic validation
        const tax = Number(form.defaultTaxPercent);
        if (Number.isNaN(tax) || tax < 0 || tax > 100) {
            toast({ title: 'خطأ في الإدخال', description: 'نسبة الضريبة يجب أن تكون بين 0 و 100', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            settingsStorage.update({
                companyName: form.companyName.trim() || '—',
                companyAddress: form.companyAddress.trim() || '—',
                companyPhone: form.companyPhone.trim() || '—',
                defaultTaxPercent: tax,
            });
            toast({ title: 'تم الحفظ', description: 'تم تحديث معلومات الشركة بنجاح.' });
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefaults = () => {
        const defaults: Settings = {
            lastInvoiceNumber: form.lastInvoiceNumber, // لا نعيد عداد الفواتير هنا
            defaultTaxPercent: 15,
            companyName: 'أسكا المغربي للتجارة والديكور',
            companyAddress: 'تعز، اليمن',
            companyPhone: '+967 777 777 777',
        };
        setForm(defaults);
        settingsStorage.update(defaults);
        toast({ title: 'تمت الاستعادة', description: 'تمت إستعادة الإعدادات الافتراضية.' });
    };

    if (loading) {
        return (
            <div className="glass-card p-6 text-center">جاري تحميل الإعدادات...</div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h1 className="text-2xl font-bold">إعدادات الشركة</h1>
                <p className="text-muted-foreground">قم بتحديث معلومات الشركة لتظهر في الفواتير.</p>
            </div>

            <Card className="glass-card border-0">
                <CardHeader>
                    <CardTitle>معلومات الشركة</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block mb-2 text-sm">اسم الشركة</label>
                            <Input
                                value={form.companyName}
                                onChange={(e) => updateField('companyName', e.target.value)}
                                placeholder="اكتب اسم الشركة"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm">رقم الجوال</label>
                            <Input
                                value={form.companyPhone}
                                onChange={(e) => updateField('companyPhone', e.target.value)}
                                placeholder="مثال: 777777777"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm">العنوان</label>
                            <Input
                                value={form.companyAddress}
                                onChange={(e) => updateField('companyAddress', e.target.value)}
                                placeholder="المدينة، المنطقة"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm">نسبة الضريبة الافتراضية (%)</label>
                            <Input
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                value={form.defaultTaxPercent}
                                onChange={(e) => updateField('defaultTaxPercent', Number(e.target.value))}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="gradient-primary" disabled={saving}>
                                {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                            </Button>
                            <Button type="button" variant="outline" className="glass-card border-white/20" onClick={handleResetDefaults}>
                                استعادة الافتراضي
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}