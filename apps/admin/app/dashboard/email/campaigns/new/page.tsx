'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCampaign } from '@/hooks/useCampaigns'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function NewCampaignPage() {
  const router = useRouter()
  const createCampaign = useCreateCampaign()

  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload: { name: string; subject: string; body: string; scheduledAt?: string } = { name, subject, body }
      if (scheduledAt) payload.scheduledAt = new Date(scheduledAt).toISOString()
      await createCampaign.mutateAsync(payload)
      router.push('/dashboard/email/campaigns')
    } catch (err: unknown) {
      setError((err as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Erro ao criar campanha')
    }
  }

  return (
    <div className="flex flex-col">
      <Topbar title="Nova Campanha" />
      <div className="mx-auto w-full max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome da Campanha" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Assunto do Email" value={subject} onChange={(e) => setSubject(e.target.value)} required />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Corpo do Email</label>
            <textarea
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[200px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Conteúdo HTML do email..."
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Agendar envio (opcional)</label>
            <input
              type="datetime-local"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-gray-500">Deixe vazio para salvar como rascunho</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" loading={createCampaign.isPending}>
              Criar Campanha
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
