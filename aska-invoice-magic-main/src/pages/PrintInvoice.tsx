import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Download, Share2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import InvoiceTypeBadge from '@/components/InvoiceTypeBadge';
import { invoicesStorage, customersStorage, settingsStorage } from '@/lib/storage';
import type { Invoice, Customer, Settings } from '@/lib/storage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrintInvoice() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  // Reference to printable area
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (invoiceId) {
      const foundInvoice = invoicesStorage.get(invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
        const foundCustomer = customersStorage.get(foundInvoice.customerId);
        setCustomer(foundCustomer || null);
      }
    }
    setSettings(settingsStorage.get());
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      if (!printAreaRef.current) return;

      // Render the invoice DOM to a canvas (preserves Arabic text as image)
      const canvas = await html2canvas(printAreaRef.current, {
        scale: 2, // higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: document.documentElement.clientWidth,
      });

      const imgData = canvas.toDataURL('image/png');

      // Create A4 PDF and size image to fit the page keeping aspect ratio
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate the best fit ratio to keep content on a single A4 page
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2; // center horizontally
      const y = 0; // align to top

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`${invoice!.number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF. يمكنك استخدام خيار الطباعة كبديل.');
    }
  };

  const handleShare = async () => {
    if (navigator.share && invoice) {
      try {
        await navigator.share({
          title: `فاتورة ${invoice.number}`,
          text: `فاتورة من ${settings?.companyName} - العميل: ${customer?.name}`,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to copying link
        navigator.clipboard.writeText(window.location.href);
        alert('تم نسخ الرابط إلى الحافظة');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ الرابط إلى الحافظة');
    }
  };

  if (!invoice || !customer || !settings) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground">جاري تحميل الفاتورة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Actions - Hidden in print */}
      <div className="glass-card p-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">معاينة الفاتورة</h1>
            <p className="text-muted-foreground">فاتورة رقم {invoice.number}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gradient-primary">
              <Printer className="w-4 h-4 ml-2" />
              طباعة
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" className="glass-card border-white/20">
              <Download className="w-4 h-4 ml-2" />
              تحميل PDF
            </Button>
            <Button onClick={handleShare} variant="outline" className="glass-card border-white/20">
              <Share2 className="w-4 h-4 ml-2" />
              مشاركة
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content - A4 Single Page */}
      <div className="invoice-print-layout" ref={printAreaRef}>
        {/* Scoped styles for the new invoice design */}
        <style>{`
          .ni-container { width: 100%; min-height: 250mm; background: linear-gradient(135deg, #fff9e6 0%, #ffebf1 100%); box-shadow: 0 0 20px rgba(0,0,0,0.15); border-radius: 8px; overflow: hidden; position: relative; padding: 10mm; background-image: linear-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.8) 1px, transparent 1px); background-size: 20px 20px; }
          .ni-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #ff99cc; }
          .ni-company { display: flex; align-items: center; gap: 12px; }
          .ni-logo { width: 60px; height: 60px; background: linear-gradient(135deg, #ffcc00 0%, #ff99cc 100%); border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #fff; font-weight: 800; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          .ni-titlebox { text-align: left; }
          .ni-badge { display: inline-block; padding: 6px 14px; background: #ffcc00; color: #333; font-weight: 700; font-size: 14px; border-radius: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 8px; }
          .ni-invno { font-size: 14px; font-weight: 700; color: #333; }

          .ni-sections { display: flex; justify-content: space-between; gap: 10px; margin: 10px 0 14px; }
          .ni-section { flex: 1; background: rgba(255,255,255,0.7); padding: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
          .ni-section-title { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #ff99cc; }
          .ni-row { display: flex; margin-bottom: 6px; font-size: 12px; }
          .ni-label { width: 40%; color: #555; }
          .ni-value { width: 60%; color: #333; }

          .ni-table { width: 100%; border-collapse: collapse; margin: 10px 0 14px; border-radius: 8px; overflow: hidden; font-size: 12px; }
          .ni-table th { background: #ffcc00; color: #333; padding: 8px; text-align: center; font-weight: 700; }
          .ni-table td { padding: 8px; text-align: center; border-bottom: 1px solid #eee; }
          .ni-table tr:nth-child(even) { background: rgba(255,255,255,0.5); }
          .ni-td-right { text-align: right; }

          .ni-footer { display: flex; justify-content: space-between; gap: 10px; margin: 12px 0; }
          .ni-terms { flex: 3; background: rgba(255,255,255,0.7); padding: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
          .ni-terms ul { list-style: none; padding: 0; margin: 0; }
          .ni-terms li { margin-bottom: 6px; padding-right: 14px; position: relative; color: #555; }
          .ni-terms li::before { content: '•'; color: #ff99cc; font-weight: bold; position: absolute; right: 0; }
          .ni-methods { display: flex; gap: 8px; margin-top: 8px; justify-content: center; }
          .ni-method { background: rgba(255,255,255,0.7); padding: 6px 10px; border-radius: 30px; font-size: 12px; color: #555; }

          .ni-totals { flex: 2; background: rgba(255,255,255,0.7); padding: 10px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
          .ni-totals-title { font-size: 14px; font-weight: 700; color: #333; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dashed #ff99cc; text-align: center; }
          .ni-total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
          .ni-grand { margin-top: 8px; padding-top: 8px; border-top: 2px solid #ff99cc; font-size: 14px; font-weight: 800; }

          .ni-signs { display: flex; justify-content: space-between; margin-top: 18mm; font-size: 12px; }
          .ni-sign { width: 45%; text-align: center; }
          .ni-sign-line { height: 2px; background: #333; margin: 10mm auto 3mm; width: 60mm; }

          .ni-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(255,153,204,0.1); font-weight: 700; z-index: 0; pointer-events: none; }
          .ni-stamp { position: absolute; bottom: 30mm; left: 30mm; width: 30mm; height: 30mm; border: 2px dashed #ff99cc; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #ff99cc; font-weight: 700; transform: rotate(-15deg); opacity: 0.8; font-size: 12px; text-align: center; }
          .ni-barcode { height: 12mm; background: repeating-linear-gradient(90deg,#000,#000 2px,#fff 2px,#fff 4px); margin: 8mm auto 0; width: 60mm; }

          @media print { .ni-container { box-shadow: none; border-radius: 0; } }
        `}</style>

        <div className="ni-container">
          <div className="ni-watermark">{settings.companyName}</div>

          <div className="ni-header">
            <div className="ni-company">
              <div className="ni-logo">فاتورة</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#333', marginBottom: 4 }}>{settings.companyName}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{settings.companyAddress}</div>
                <div style={{ fontSize: 12, color: '#555' }}>هاتف: {settings.companyPhone}</div>
              </div>
            </div>

            <div className="ni-titlebox">
              <div className="ni-badge">{invoice.type === 'cash' ? 'فاتورة نقدية' : invoice.type === 'credit' ? 'فاتورة آجل' : 'عرض سعر'}</div>
              <div className="ni-invno">رقم الفاتورة: {invoice.number}</div>
            </div>
          </div>

          <div className="ni-sections">
            <div className="ni-section">
              <div className="ni-section-title">معلومات الشركة</div>
              <div className="ni-row"><div className="ni-label">اسم الشركة:</div><div className="ni-value">{settings.companyName}</div></div>
              <div className="ni-row"><div className="ni-label">العنوان:</div><div className="ni-value">{settings.companyAddress}</div></div>
              <div className="ni-row"><div className="ni-label">الهاتف:</div><div className="ni-value">{settings.companyPhone}</div></div>
              {customer.taxNumber && (
                <div className="ni-row"><div className="ni-label">الرقم الضريبي:</div><div className="ni-value">{customer.taxNumber}</div></div>
              )}
            </div>

            <div className="ni-section">
              <div className="ni-section-title">معلومات الفاتورة</div>
              <div className="ni-row"><div className="ni-label">التاريخ:</div><div className="ni-value">{new Date(invoice.issueDate).toLocaleDateString('ar-SA')}</div></div>
              {invoice.dueDate && (
                <div className="ni-row"><div className="ni-label">تاريخ الاستحقاق:</div><div className="ni-value">{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</div></div>
              )}
              <div className="ni-row"><div className="ni-label">اسم العميل:</div><div className="ni-value">{customer.name}</div></div>
              <div className="ni-row"><div className="ni-label">طريقة الدفع:</div><div className="ni-value">{invoice.type === 'cash' ? 'نقداً' : 'تحويل/آجل'}</div></div>
            </div>
          </div>

          <table className="ni-table">
            <thead>
              <tr>
                <th>م</th>
                <th>وصف المنتج</th>
                <th>الكمية</th>
                <th>الوحدة</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td className="ni-td-right">
                    <div>{item.description_ar}</div>
                    {item.description_en && <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{item.description_en}</div>}
                    {item.notes && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{item.notes}</div>}
                  </td>
                  <td>{item.qty}</td>
                  <td>{'قطعة'}</td>
                  <td>{item.unit_price.toLocaleString('ar-SA')} ريال</td>
                  <td>{item.line_total.toLocaleString('ar-SA')} ريال</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ni-footer">
            <div className="ni-terms">
              <div className="ni-section-title">شروط الدفع</div>
              <ul>
                <li>الدفع مستحق خلال 30 يوم من تاريخ الفاتورة</li>
                <li>جميع الأسعار شاملة ضريبة القيمة المضافة {invoice.taxPercent}%</li>
                <li>يتم الشحن خلال 3-5 أيام عمل من تأكيد الطلب</li>
                <li>أي إرجاع يجب أن يتم خلال 14 يوم من تاريخ الاستلام</li>
                <li>تخضع جميع المعاملات للشروط والأحكام المطبقة</li>
              </ul>
              <div className="ni-methods">
                <div className="ni-method">تحويل بنكي</div>
                <div className="ni-method">شيك</div>
                <div className="ni-method">بطاقة ائتمان</div>
              </div>
            </div>

            <div className="ni-totals">
              <div className="ni-totals-title">الإجماليات</div>
              <div className="ni-total-row"><div>المجموع:</div><div>{invoice.subtotal.toLocaleString('ar-SA')} ر.س</div></div>
              {invoice.discountPercent > 0 && (
                <div className="ni-total-row"><div>الخصم ({invoice.discountPercent}%):</div><div>-{invoice.discountAmount.toLocaleString('ar-SA')} ر.س</div></div>
              )}
              {invoice.discountPercent > 0 && (
                <div className="ni-total-row"><div>المجموع بعد الخصم:</div><div>{(invoice.subtotal - invoice.discountAmount).toLocaleString('ar-SA')} ر.س</div></div>
              )}
              {invoice.taxPercent > 0 && (
                <div className="ni-total-row"><div>ضريبة القيمة المضافة ({invoice.taxPercent}%):</div><div>{invoice.taxAmount.toLocaleString('ar-SA')} ر.س</div></div>
              )}
              <div className="ni-total-row ni-grand"><div>الإجمالي:</div><div>{invoice.total.toLocaleString('ar-SA')} ر.س</div></div>
            </div>
          </div>

          <div className="ni-barcode" />

          <div className="ni-signs">
            <div className="ni-sign">
              <div>توقيع المسؤول</div>
              <div className="ni-sign-line" />
              <div>مدير المالية</div>
            </div>
            <div className="ni-sign">
              <div>توقيع العميل</div>
              <div className="ni-sign-line" />
              <div>تاريخ الاستلام: ___/___/______</div>
            </div>
          </div>

          <div className="ni-stamp">ختم الشركة<br />معتمد</div>
        </div>
      </div>

      {/* Back to Invoices - Hidden in print */}
      <div className="print:hidden">
        <Button asChild variant="outline" className="glass-card border-white/20">
          <Link to="/invoices">
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة إلى الفواتير
          </Link>
        </Button>
      </div>
    </div>
  );
}