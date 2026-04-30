'use client'

import { Users, Mail, BarChart3 } from 'lucide-react'
import { useEmailStats } from '@/hooks/useEmailStats'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function EmailOverviewPage() {
  const router = useRouter()
  const { data, isLoading } = useEmailStats()

  return (
    <div className="flex flex-col">
      <Topbar title="Email Marketing" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total de Assinantes"
            value={isLoading ? '...' : (data?.totalSubscribers ?? 0)}
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="Campanhas Enviadas"
            value={isLoading ? '...' : (data?.totalCampaignsSent ?? 0)}
            icon={<Mail className="h-6 w-6" />}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Taxa de Abertura"
            value={isLoading ? '...' : `${data?.openRate ?? 0}%`}
            icon={<BarChart3 className="h-6 w-6" />}
            color="bg-green-50 text-green-600"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={() => router.push('/dashboard/email/subscribers')}>
            Gerenciar Assinantes
          </Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard/email/campaigns')}>
            Gerenciar Campanhas
          </Button>
        </div>
      </div>
    </div>
  )
}
