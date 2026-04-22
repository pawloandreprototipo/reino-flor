'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Topbar } from '@/components/layout/Topbar'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort } from '@/lib/utils'

interface Coupon {
  id: string; code: string; type: string; value: number
  minOrderValue?: number; maxUses?: number; usedCount: number
  active: boolean; expiresAt?: string; createdAt: string
}

const schema = z.object({
  code: z.string().min(3).max(20),
  type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']),
  value: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().positive().optional().or(z.literal('')),
  maxUses: z.coerce.number().int().positive().optional().or(z.literal('')),
  expiresAt: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function CouponsPage() {
  const [showForm, setShowForm] = useState(false)
  const qc = useQueryClient()

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data } = await api.get('/api/coupons')
      return data.data as Coupon[]
    },
  })

  const createCoupon = useMutation({
    mutationFn: async (payload: FormData) => {
      const { data } = await api.post('/api/coupons', payload)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setShowForm(false); reset() },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PERCENTAGE' },
  })

  return (
    <div className="flex flex-col">
      <Topbar title="Cupons" />
      <div className="p-6 space-y-4">

        <div className="flex justify-end">
          <Button onClick={() => setShowForm(v => !v)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Novo Cupom'}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader><h2 className="text-sm font-semibold">Criar cupom</h2></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => createCoupon.mutate(d))} className="grid grid-cols-2 gap-4">
                <Input label="Código" placeholder="BEMVINDO10" error={errors.code?.message} {...register('code')} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" {...register('type')}>
                    <option value="PERCENTAGE">Percentual (%)</option>
                    <option value="FIXED">Valor fixo (R$)</option>
                    <option value="FREE_SHIPPING">Frete grátis</option>
                  </select>
                </div>
                <Input label="Valor" type="number" step="0.01" error={errors.value?.message} {...register('value')} />
                <Input label="Pedido mínimo (R$)" type="number" step="0.01" {...register('minOrderValue')} />
                <Input label="Máximo de usos" type="number" {...register('maxUses')} />
                <Input label="Expira em" type="datetime-local" {...register('expiresAt')} />
                <div className="col-span-2 flex justify-end">
                  <Button type="submit" loading={createCoupon.isPending}>Criar cupom</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Table
          keyField="id"
          loading={isLoading}
          data={coupons ?? []}
          emptyMessage="Nenhum cupom cadastrado"
          columns={[
            { key: 'code', header: 'Código', render: (row) => <span className="font-mono font-bold text-violet-700">{row.code}</span> },
            {
              key: 'type',
              header: 'Desconto',
              render: (row) => row.type === 'PERCENTAGE'
                ? `${row.value}%`
                : row.type === 'FIXED'
                ? formatCurrency(row.value)
                : 'Frete grátis',
            },
            { key: 'usedCount', header: 'Usos', render: (row) => `${row.usedCount}${row.maxUses ? ` / ${row.maxUses}` : ''}` },
            {
              key: 'active',
              header: 'Status',
              render: (row) => (
                <Badge label={row.active ? 'Ativo' : 'Inativo'} className={row.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} />
              ),
            },
            { key: 'expiresAt', header: 'Expira em', render: (row) => row.expiresAt ? formatDateShort(row.expiresAt) : '—' },
          ]}
        />

      </div>
    </div>
  )
}
