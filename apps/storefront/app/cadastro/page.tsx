'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { TENANT_SLUG } from '@/lib/utils'

const registerSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterForm) => {
    setSubmitError(null)
    setLoading(true)
    try {
      await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        tenantSlug: TENANT_SLUG,
      })
      // Auto-login after registration
      const success = await login(data.email, data.password)
      if (success) {
        router.push('/')
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setSubmitError(err.response?.data?.error ?? 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="mb-6 text-center">
          <UserPlus className="mx-auto mb-2 h-10 w-10 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-500">Preencha seus dados para se cadastrar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register('name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Seu nome"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Repita a senha"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {submitError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-violet-600 hover:text-violet-700">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
