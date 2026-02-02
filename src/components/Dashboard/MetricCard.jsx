export default function MetricCard({ title, value, subtitle, icon, color = 'primary' }) {
  const colorConfigs = {
    primary: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20',
    },
    success: {
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      borderColor: 'border-success/20',
    },
    warning: {
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20',
    },
    danger: {
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      borderColor: 'border-destructive/20',
    },
  }

  const config = colorConfigs[color] || colorConfigs.primary

  return (
    <div className={`bg-card rounded-xl border-2 ${config.borderColor} shadow-sm p-5 md:p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="text-3xl md:text-4xl font-bold text-foreground mb-1 break-words">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`${config.iconBg} p-3 md:p-4 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-200`}>
            <div className={config.iconColor}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

