interface StatCardProps {
  title: string
  value: string | number
  growth?: number
  icon: React.ReactNode
  color?: string
}

export function StatCard({ title, value, growth, icon, color = 'bg-violet-50 text-violet-600' }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {growth !== undefined && (
          <p className={`text-xs font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? '▲' : '▼'} {Math.abs(growth)}% vs mês anterior
          </p>
        )}
      </div>
    </div>
  )
}
