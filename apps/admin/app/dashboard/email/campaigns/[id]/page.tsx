'use client'

import { useParams, useRouter } from 'next/navigation'
import { Send, XCircle, Mail, Eye, MousePointerClick, Users } from 'lucide-react'
import { useCampaign, useSendCampaign, useCancelCampaign } from '@/hooks/useCampaigns'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDateShort } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  SENDING: 'Enviando',
  SENT: 'Enviada',
  CANCELLED: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  SENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: campaign, isLoading } = useCampaign(id)
  const sendCampaign = useSendCampaign()
  const cancelCampaign = useCancelCampaign()

  const handleSend = async () => {
    if (!confirm('Enviar campanha para todos os assinantes ativos?')) return
    try {
      await sendCampaign.mutateAsync(id)
    } catch (e: unknown) {
      alert((e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Erro ao enviar campanha')
    }
  }

  const handleCancel = async () => {
    if (!confirm('Cancelar esta campanha?')) return
    try {
      await cancelCampaign.mutateAsync(id)
    } catch (e: unknown) {
      alert((e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Erro ao cancelar campanha')
    }
  }

  if (isLoading || !campaign) {
    return (
      <div className="flex flex-col">
        <Topbar title="Campanha" />
        <div className="p-6 text-gray-400">Carregando...</div>
      </div>
    )
  }

  const canSend = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED'
  const canCancel = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED'
  const stats = campaign._stats
  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0
  const clickRate = stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0

  return (
    <div className="flex flex-col">
      <Topbar title={campaign.name} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Badge label={STATUS_LABELS[campaign.status] ?? campaign.status} className={STATUS_COLORS[campaign.status]} />
          {campaign.sentAt && <span className="text-sm text-gray-500">Enviada em {formatDateShort(campaign.sentAt)}</span>}
          {campaign.scheduledAt && campaign.status === 'SCHEDULED' && (
            <span className="text-sm text-gray-500">Agendada para {formatDateShort(campaign.scheduledAt)}</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard title="Destinatários" value={stats.total} icon={<Users className="h-6 w-6" />} />
          <StatCard title="Enviados" value={stats.sent} icon={<Mail className="h-6 w-6" />} color="bg-blue-50 text-blue-600" />
          <StatCard title="Taxa de Abertura" value={`${openRate}%`} icon={<Eye className="h-6 w-6" />} color="bg-green-50 text-green-600" />
          <StatCard title="Taxa de Clique" value={`${clickRate}%`} icon={<MousePointerClick className="h-6 w-6" />} color="bg-orange-50 text-orange-600" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Assunto</h3>
          <p className="text-gray-900">{campaign.subject}</p>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mt-4 mb-2">Conteúdo</h3>
          <div className="prose prose-sm max-w-none rounded-lg border border-gray-100 bg-gray-50 p-4" dangerouslySetInnerHTML={{ __html: campaign.body }} />
        </div>

        <div className="flex gap-3">
          {canSend && (
            <Button loading={sendCampaign.isPending} onClick={handleSend}>
              <Send className="h-4 w-4" /> Enviar Agora
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" loading={cancelCampaign.isPending} onClick={handleCancel}>
              <XCircle className="h-4 w-4" /> Cancelar Campanha
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push('/dashboard/email/campaigns')}>
            Voltar
          </Button>
        </div>
      </div>
    </div>
  )
}
