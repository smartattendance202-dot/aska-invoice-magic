import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  Home,
  FileText,
  FilePlus,
  Users,
  Printer,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { id: 'home', label: 'الصفحة الرئيسية', href: '/', icon: Home },
  { id: 'invoices', label: 'الفواتير', href: '/invoices', icon: FileText },
  { id: 'new', label: 'فاتورة جديدة', href: '/new-invoice', icon: FilePlus },
  { id: 'customers', label: 'العملاء', href: '/customers', icon: Users },
  { id: 'print', label: 'الطباعة', href: '/print', icon: Printer },
  { id: 'settings', label: 'الإعدادات', href: '/settings', icon: Printer },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleBackdropClick = () => {
    setSidebarOpen(false);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-primary-light/10 to-background">
      {/* Header */}
      <header className="glass-card m-4 mb-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHomePage && (
            <button
              onClick={handleGoBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="الرجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
            أسكا للفواتير
          </h1>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
        sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={handleBackdropClick}
        />

        {/* Sidebar Content */}
        <div className={cn(
          "absolute right-0 top-0 h-full w-80 glass-sidebar p-6 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold">القائمة الرئيسية</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover-lift",
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "hover:bg-white/10"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:right-0 md:top-20 md:bottom-0 md:w-64 md:block">
        <div className="glass-sidebar h-full p-6">
          <h2 className="text-lg font-semibold mb-6">القائمة الرئيسية</h2>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover-lift",
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "hover:bg-white/10"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 md:mr-64">
        <Outlet />
      </main>
    </div>
  );
}