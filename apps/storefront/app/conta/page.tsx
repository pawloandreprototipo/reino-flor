'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await api.put('/api/auth/me', data)
      setSuccess(true)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error ?? 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="mb-6 text-lg font-bold text-gray-900">Perfil</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            id="profile-name"
            type="text"
            {...register('name')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            id="profile-email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            id="profile-phone"
            type="tel"
            {...register('phone')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="(00) 00000-0000"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
            Perfil atualizado com sucesso!
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
