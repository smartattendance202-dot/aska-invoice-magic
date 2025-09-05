import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InvoiceTypeBadge from '@/components/InvoiceTypeBadge';
import {
  invoicesStorage,
  customersStorage,
  generateInvoiceNumber,
  calculateInvoiceTotals,
  settingsStorage
} from '@/lib/storage';
import type { InvoiceType, InvoiceItem, Customer } from '@/lib/storage';

export default function NewInvoice() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<InvoiceType>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  // Quick add customer state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerTax, setNewCustomerTax] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxPercent, setTaxPercent] = useState(15);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([
    {
      description_ar: '',
      description_en: '',
      qty: 1,
      unit_price: 0,
      line_total: 0,
    }
  ]);

  useEffect(() => {
    setCustomers(customersStorage.getAll());
    const settings = settingsStorage.get();
    setTaxPercent(settings.defaultTaxPercent);
  }, []);

  // Update line totals when qty or unit_price changes
  useEffect(() => {
    setItems(prevItems =>
      prevItems.map(item => ({
        ...item,
        line_total: item.qty * item.unit_price
      }))
    );
  }, []);

  const addItem = () => {
    setItems([...items, {
      description_ar: '',
      description_en: '',
      qty: 1,
      unit_price: 0,
      line_total: 0,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Omit<InvoiceItem, 'id'>, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };

      // Recalculate line total if qty or unit_price changed
      if (field === 'qty' || field === 'unit_price') {
        newItems[index].line_total = newItems[index].qty * newItems[index].unit_price;
      }

      return newItems;
    });
  };

  const totals = calculateInvoiceTotals(
    items.map(item => ({ ...item, id: '' }) as InvoiceItem),
    taxPercent,
    discountPercent
  );

  const handleQuickAddCustomer = () => {
    if (!newCustomerName.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال اسم العميل', variant: 'destructive' });
      return;
    }
    const created = customersStorage.create({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      address: newCustomerAddress.trim(),
      taxNumber: newCustomerTax.trim() || undefined,
      notes: undefined,
    });
    // Refresh list and select the new customer
    const all = customersStorage.getAll();
    setCustomers(all);
    setSelectedCustomer(created.id);
    // Reset and close
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    setNewCustomerTax('');
    setAddDialogOpen(false);

    toast({ title: 'تم', description: 'تم إضافة العميل بنجاح' });
  };

  const handleSave = () => {
    // Validation
    if (!selectedCustomer) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار العميل',
        variant: 'destructive'
      });
      return;
    }

    if (items.some(item => !item.description_ar.trim())) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء وصف جميع العناصر',
        variant: 'destructive'
      });
      return;
    }

    if (items.some(item => item.qty <= 0 || item.unit_price < 0)) {
      toast({
        title: 'خطأ',
        description: 'يرجى التأكد من صحة الكميات والأسعار',
        variant: 'destructive'
      });
      return;
    }

    try {
      const invoice = invoicesStorage.create({
        number: generateInvoiceNumber(),
        type: selectedType,
        customerId: selectedCustomer,
        issueDate,
        dueDate: dueDate || undefined,
        items: items.map(item => ({
          ...item,
          id: crypto.randomUUID(),
        })),
        subtotal: totals.subtotal,
        taxPercent,
        discountPercent,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        notes: notes || undefined,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'تم الحفظ',
        description: 'تم إنشاء الفاتورة بنجاح',
      });

      navigate(`/print/${invoice.id}`);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حفظ الفاتورة',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold mb-2">إنشاء فاتورة جديدة</h1>
        <p className="text-muted-foreground">
          قم بملء بيانات الفاتورة والعناصر المطلوبة
        </p>
      </div>

      {/* Invoice Type Selection */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>نوع الفاتورة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['cash', 'quote', 'credit'] as InvoiceType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-4 rounded-xl border-2 transition-all hover-lift ${selectedType === type
                    ? 'border-primary bg-primary/10'
                    : 'border-white/20 hover:border-white/40'
                  }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <InvoiceTypeBadge type={type} />
                  <span className="text-sm text-muted-foreground">
                    {type === 'cash' && 'دفع فوري'}
                    {type === 'quote' && 'عرض أسعار للعميل'}
                    {type === 'credit' && 'دفع مؤجل'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer and Dates */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>بيانات العميل والتواريخ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">العميل *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="glass-card border-white/20 whitespace-nowrap"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 ml-2" /> عميل جديد
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="issueDate">تاريخ الإصدار</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            {selectedType === 'credit' && (
              <div>
                <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>اسم العميل *</Label>
              <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="مثال: شركة المثال" />
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="مثال: 777777777" />
            </div>
            <div>
              <Label>العنوان</Label>
              <Input value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} placeholder="مثال: تعز" />
            </div>
            <div>
              <Label>الرقم الضريبي</Label>
              <Input value={newCustomerTax} onChange={(e) => setNewCustomerTax(e.target.value)} placeholder="مثال: 123456789" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="glass-card border-white/20">إلغاء</Button>
              <Button onClick={handleQuickAddCustomer} className="gradient-primary">
                <Save className="w-4 h-4 ml-2" /> حفظ العميل
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Items */}
      <Card className="glass-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>عناصر الفاتورة</CardTitle>
            <Button onClick={addItem} size="sm" className="gradient-primary">
              <Plus className="w-4 h-4 ml-2" />
              إضافة عنصر
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border border-white/10 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">العنصر {index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>الوصف بالعربية *</Label>
                    <Input
                      value={item.description_ar}
                      onChange={(e) => updateItem(index, 'description_ar', e.target.value)}
                      placeholder="مثال: دهان داخلي"
                    />
                  </div>
                  <div>
                    <Label>الوصف بالإنجليزية</Label>
                    <Input
                      value={item.description_en}
                      onChange={(e) => updateItem(index, 'description_en', e.target.value)}
                      placeholder="Example: Interior Paint"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>سعر الوحدة (ريال)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>الإجمالي</Label>
                    <Input
                      value={item.line_total.toLocaleString('ar-YE')}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calculations */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            الحسابات والإجماليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>نسبة الضريبة (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>نسبة الخصم (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-medium">{totals.subtotal.toLocaleString('ar-YE')} ريال</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>الخصم ({discountPercent}%):</span>
                  <span>-{totals.discountAmount.toLocaleString('ar-YE')} ريال</span>
                </div>
              )}
              {taxPercent > 0 && (
                <div className="flex justify-between">
                  <span>الضريبة ({taxPercent}%):</span>
                  <span>{totals.taxAmount.toLocaleString('ar-YE')} ريال</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-primary">{totals.total.toLocaleString('ar-YE')} ريال</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>ملاحظات</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية للفاتورة..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button onClick={handleSave} size="lg" className="gradient-primary px-8 hover-lift">
          <Save className="w-5 h-5 ml-2" />
          حفظ الفاتورة
        </Button>
      </div>
    </div>
  );
}