import { cn } from '@/lib/utils';
import { Banknote, FileText, Clock } from 'lucide-react';
import type { InvoiceType } from '@/lib/storage';

interface InvoiceTypeBadgeProps {
  type: InvoiceType;
  className?: string;
}

const typeConfig = {
  cash: {
    label: 'نقداً',
    icon: Banknote,
    className: 'badge-cash'
  },
  quote: {
    label: 'عرض سعر',
    icon: FileText,
    className: 'badge-quote'
  },
  credit: {
    label: 'آجل',
    icon: Clock,
    className: 'badge-credit'
  }
};

export default function InvoiceTypeBadge({ type, className }: InvoiceTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <span className={cn(config.className, 'inline-flex items-center gap-1', className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}