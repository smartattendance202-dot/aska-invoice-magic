import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp,
  FilePlus,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import InvoiceTypeBadge from '@/components/InvoiceTypeBadge';
import { invoicesStorage, customersStorage, initializeSampleData } from '@/lib/storage';
import type { Invoice } from '@/lib/storage';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    initializeSampleData();
    setInvoices(invoicesStorage.getAll());
    setCustomers(customersStorage.getAll());
  }, []);

  // Calculate statistics
  const totalInvoices = invoices.length;
  const totalCustomers = customers.length;
  
  // Last 30 days revenue
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRevenue = invoices
    .filter(invoice => new Date(invoice.createdAt) >= thirtyDaysAgo)
    .reduce((sum, invoice) => sum + invoice.total, 0);

  // Invoice type breakdown
  const typeBreakdown = invoices.reduce((acc, invoice) => {
    acc[invoice.type] = (acc[invoice.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      title: 'إجمالي الفواتير',
      value: totalInvoices.toString(),
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'الإيرادات (30 يوم)',
      value: `${recentRevenue.toLocaleString('ar-YE')} ريال`,
      icon: DollarSign,
      color: 'text-success'
    },
    {
      title: 'العملاء',
      value: totalCustomers.toString(),
      icon: Users,
      color: 'text-info'
    },
    {
      title: 'معدل النمو',
      value: '+12.5%',
      icon: TrendingUp,
      color: 'text-warning'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold mb-2">مرحباً بك في نظام أسكا للفواتير</h1>
        <p className="text-muted-foreground">
          نظام إدارة فواتير متقدم مع دعم كامل للغة العربية وحفظ البيانات محلياً
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="glass-card border-0 hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invoice Types Breakdown */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            توزيع الفواتير حسب النوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(typeBreakdown).map(([type, count]) => {
              const percentage = totalInvoices > 0 ? (count / totalInvoices) * 100 : 0;
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <InvoiceTypeBadge type={type as any} />
                    <span className="text-sm">{count} فاتورة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          type === 'cash' ? 'bg-success' :
                          type === 'quote' ? 'bg-info' : 'bg-warning'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="gradient-primary h-auto p-4 flex-col gap-2 hover-lift">
              <Link to="/new-invoice">
                <FilePlus className="w-6 h-6" />
                <span>إنشاء فاتورة جديدة</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 hover-lift glass-card border-white/20">
              <Link to="/customers">
                <Users className="w-6 h-6" />
                <span>إدارة العملاء</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2 hover-lift glass-card border-white/20">
              <Link to="/invoices">
                <Eye className="w-6 h-6" />
                <span>عرض الفواتير</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>آخر الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => {
                const customer = customersStorage.get(invoice.customerId);
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <InvoiceTypeBadge type={invoice.type} />
                      <div>
                        <div className="font-medium">{invoice.number}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer?.name || 'عميل محذوف'}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        {invoice.total.toLocaleString('ar-YE')} ريال
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.issueDate).toLocaleDateString('ar-YE')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}