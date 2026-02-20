interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = 'text-green-600',
  iconBg = 'bg-green-100',
  className = '',
  onClick,
}: StatCardProps) {
  return (
    <div
      className={`text-center group hover-lift ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div
        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${iconBg} rounded-2xl mb-4 group-hover:shadow-lg transition-all`}
      >
        <i className={`${icon} text-3xl ${iconColor}`}></i>
      </div>
      <div className="text-3xl sm:text-5xl font-bold text-gradient mb-2">{value}</div>
      <div className="text-gray-600 text-sm sm:text-base font-medium">{label}</div>
    </div>
  );
}

interface StatsGridProps {
  stats: Array<{
    label: string;
    value: string;
    icon: string;
    iconColor?: string;
    iconBg?: string;
  }>;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ stats, columns = 4, className = '' }: StatsGridProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 sm:gap-8 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

export default StatCard;
