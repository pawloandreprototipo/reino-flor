'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Flower2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  tenantSlug: z.string().min(1, 'Slug da loja obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login, loading, error } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tenantSlug: 'reino-flor' },
  })

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600">
            <Flower2 className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Reino Flor</h1>
            <p className="text-sm text-gray-500">Acesse o painel administrativo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(login)} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="admin@reinoflor.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Slug da loja"
            placeholder="reino-flor"
            error={errors.tenantSlug?.message}
            hint="Identificador único da sua loja"
            {...register('tenantSlug')}
          />

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}
