import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Printer, Trash2, Plus, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InvoiceTypeBadge from '@/components/InvoiceTypeBadge';
import { invoicesStorage, customersStorage, settingsStorage } from '@/lib/storage';
import type { Invoice, InvoiceType, Customer, Settings } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const allInvoices = invoicesStorage.getAll().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setInvoices(allInvoices);
    setFilteredInvoices(allInvoices);
    setSettings(settingsStorage.get());
  }, []);

  useEffect(() => {
    let filtered = invoices;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const customer = customersStorage.get(invoice.customerId);
        return (
          invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.type === typeFilter);
    }

    setFilteredInvoices(filtered);
  }, [searchTerm, typeFilter, invoices]);

  const handleDelete = (invoiceId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      invoicesStorage.delete(invoiceId);
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
      setInvoices(updatedInvoices);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">إدارة الفواتير</h1>
            <p className="text-muted-foreground">
              عرض وإدارة جميع الفواتير الخاصة بك
            </p>
          </div>
          <Button asChild className="gradient-primary">
            <Link to="/new-invoice">
              <Plus className="w-4 h-4 ml-2" />
              فاتورة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في الفواتير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
                className={typeFilter === 'all' ? 'gradient-primary' : 'glass-card border-white/20'}
              >
                الكل
              </Button>
              <Button
                variant={typeFilter === 'cash' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('cash')}
                className={typeFilter === 'cash' ? 'bg-success text-white' : 'glass-card border-white/20'}
              >
                نقداً
              </Button>
              <Button
                variant={typeFilter === 'quote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('quote')}
                className={typeFilter === 'quote' ? 'bg-info text-white' : 'glass-card border-white/20'}
              >
                عرض سعر
              </Button>
              <Button
                variant={typeFilter === 'credit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('credit')}
                className={typeFilter === 'credit' ? 'bg-warning text-white' : 'glass-card border-white/20'}
              >
                آجل
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>
            الفواتير ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد فواتير تطابق معايير البحث</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => {
                const customer = customersStorage.get(invoice.customerId);
                return (
                  <div
                    key={invoice.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{invoice.number}</span>
                          <InvoiceTypeBadge type={invoice.type} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          العميل: {customer?.name || 'عميل محذوف'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          التاريخ: {new Date(invoice.issueDate).toLocaleDateString('ar-YE')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
                      <div className="text-left">
                        <div className="font-bold text-lg">
                          {invoice.total.toLocaleString('ar-YE')} ريال
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.items.length} عنصر
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline" className="glass-card border-white/20">
                          <Link to={`/print/${invoice.id}`}>
                            <Printer className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(invoice.id)}
                          className="glass-card border-red-200/20 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>معاينة الفاتورة</DialogTitle>
          </DialogHeader>

          {!previewInvoice || !previewCustomer || !settings ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : (
            <div className="space-y-4">
              {/* Actions inside modal */}
              <div className="flex justify-end gap-2 print:hidden">
                <Button
                  onClick={() => window.print()}
                  className="gradient-primary"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة
                </Button>
                <Button
                  onClick={async () => {
                    if (!printAreaRef.current) return;
                    const canvas = await html2canvas(printAreaRef.current, { scale: 2, backgroundColor: '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
                    const imgWidth = canvas.width * ratio;
                    const imgHeight = canvas.height * ratio;
                    const x = (pageWidth - imgWidth) / 2;
                    const y = 0;
                    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
                    pdf.save(`${previewInvoice.number}.pdf`);
                  }}
                  variant="outline"
                  className="glass-card border-white/20"
                >
                  <Download className="w-4 h-4 ml-2" />
                  تحميل PDF
                </Button>
                <Button asChild variant="outline" className="glass-card border-white/20">
                  <Link to={`/print/${previewInvoice.id}`}>فتح صفحة الطباعة</Link>
                </Button>
              </div>

              {/* Printable content reused from PrintInvoice structure */}
              <div ref={printAreaRef} className="invoice-print-layout">
                <div className="invoice-header">
                  <div className="company-name">{settings.companyName}</div>
                  <div className="company-details">
                    <div className="company-info">
                      <p>هاتف: {settings.companyPhone}</p>
                      <p>{settings.companyAddress}</p>
                    </div>
                    <div className="invoice-title-section">
                      <div className="invoice-title">فاتورة</div>
                      <div className="invoice-number">رقم: {previewInvoice.number}</div>
                      <div className="invoice-date">التاريخ: {new Date(previewInvoice.issueDate).toLocaleDateString('ar-SA')}</div>
                    </div>
                  </div>
                </div>
                <div className="divider"></div>
                <div className="customer-section">
                  <div className="section-title">المطالَب من:</div>
                  <div className="customer-details">
                    <p><strong>{previewCustomer.name}</strong></p>
                    <p>هاتف: {previewCustomer.phone}</p>
                    <p>العنوان: {previewCustomer.address}</p>
                    {previewCustomer.taxNumber && <p>الرقم الضريبي: {previewCustomer.taxNumber}</p>}
                  </div>
                </div>
                <div className="items-section">
                  <table className="items-table">
                    <thead>
                      <tr className="table-header">
                        <th style={{ width: '8%' }}>#</th>
                        <th style={{ width: '50%' }}>الوصف</th>
                        <th style={{ width: '12%' }}>الكمية</th>
                        <th style={{ width: '15%' }}>سعر الوحدة</th>
                        <th style={{ width: '15%' }}>الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewInvoice.items.map((item, index) => (
                        <tr key={item.id} className="table-row">
                          <td className="text-center">{index + 1}</td>
                          <td className="text-right">
                            <div>
                              <div>{item.description_ar}</div>
                              {item.description_en && (
                                <div className="item-description-en">{item.description_en}</div>
                              )}
                              {item.notes && (
                                <div className="item-notes">{item.notes}</div>
                              )}
                            </div>
                          </td>
                          <td className="text-center">{item.qty}</td>
                          <td className="text-center">{item.unit_price.toLocaleString('ar-SA')} ريال</td>
                          <td className="text-center">{item.line_total.toLocaleString('ar-SA')} ريال</td>
                        </tr>
                      ))}
                      {Array.from({ length: Math.max(0, 6 - previewInvoice.items.length) }).map((_, index) => (
                        <tr key={`empty-${index}`} className="table-row empty-row">
                          <td className="text-center">&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="totals-section">
                  <div className="totals-content">
                    <div className="total-line">
                      <span>المجموع الفرعي</span>
                      <span>{previewInvoice.subtotal.toLocaleString('ar-SA')} ريال</span>
                    </div>
                    {previewInvoice.discountPercent > 0 && (
                      <div className="total-line discount-line">
                        <span>الخصم ({previewInvoice.discountPercent}%)</span>
                        <span>-{previewInvoice.discountAmount.toLocaleString('ar-SA')} ريال</span>
                      </div>
                    )}
                    {previewInvoice.taxPercent > 0 && (
                      <div className="total-line tax-line">
                        <span>الضريبة ({previewInvoice.taxPercent}%)</span>
                        <span>{previewInvoice.taxAmount.toLocaleString('ar-SA')} ريال</span>
                      </div>
                    )}
                    <div className="final-total">
                      <span>الإجمالي النهائي</span>
                      <span>{previewInvoice.total.toLocaleString('ar-SA')} ريال</span>
                    </div>
                  </div>
                </div>
                {previewInvoice.notes ? (
                  <div className="notes-section">
                    <strong>ملاحظات:</strong> {previewInvoice.notes} • شكراً لتعاملكم معنا
                  </div>
                ) : (
                  <div className="notes-section">
                    شكراً لتعاملكم معنا. الرجاء مراجعة الفاتورة قبل السداد.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}