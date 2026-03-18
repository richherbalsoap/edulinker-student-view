import { useDateFilter } from '@/context/DateFilterContext';
import { CalendarDays, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';

const filterOptions = [
  { value: 'all' as const, label: 'All' },
  { value: 'today' as const, label: 'Today' },
  { value: 'week' as const, label: 'This Week' },
  { value: 'month' as const, label: 'This Month' },
  { value: 'custom' as const, label: 'Custom' },
];

const DateFilterBar = () => {
  const {
    filterType, setFilterType,
    customStartDate, customEndDate,
    setCustomStartDate, setCustomEndDate,
    filterStartDate, filterEndDate,
  } = useDateFilter();

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-primary/10 px-4 py-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarDays size={16} className="text-primary shrink-0" />
        
        <div className="flex items-center gap-1 flex-wrap">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border
                ${filterType === opt.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_8px_hsl(51,100%,50%,0.3)]'
                  : 'bg-card/30 text-foreground/70 border-primary/20 hover:bg-primary/10 hover:text-foreground'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {filterType === 'custom' && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={customStartDate ? format(customStartDate, 'yyyy-MM-dd') : ''}
              onChange={e => setCustomStartDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined)}
              className="px-2 py-1 rounded-lg text-xs bg-card/30 border border-primary/20 text-foreground outline-none focus:border-primary/50"
            />
            <span className="text-foreground/40 text-xs">to</span>
            <input
              type="date"
              value={customEndDate ? format(customEndDate, 'yyyy-MM-dd') : ''}
              onChange={e => setCustomEndDate(e.target.value ? new Date(e.target.value + 'T23:59:59') : undefined)}
              className="px-2 py-1 rounded-lg text-xs bg-card/30 border border-primary/20 text-foreground outline-none focus:border-primary/50"
            />
          </div>
        )}

        {filterType !== 'all' && (
          <div className="flex items-center gap-1 ml-auto">
            <CalendarRange size={12} className="text-primary/60" />
            <span className="text-foreground/50 text-[10px]">
              {format(filterStartDate, 'dd MMM')} — {format(filterEndDate, 'dd MMM yyyy')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateFilterBar;
