'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v3'
import { MapPin, Plus, Pencil, Trash2, Star, X } from 'lucide-react'
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  type Address,
  type AddressInput,
} from '@/hooks/useAddresses'

const addressSchema = z.object({
  label: z.string().min(1, 'Nome do endereço é obrigatório'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  district: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  zipCode: z.string().min(1, 'CEP é obrigatório'),
  country: z.string(),
  isDefault: z.boolean(),
})

type AddressForm = z.infer<typeof addressSchema>

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) })

  const openNew = () => {
    setEditingId(null)
    reset({ label: '', street: '', number: '', complement: '', district: '', city: '', state: '', zipCode: '', country: 'BR', isDefault: false })
    setShowForm(true)
  }

  const openEdit = (addr: Address) => {
    setEditingId(addr.id)
    reset({
      label: addr.label,
      street: addr.street,
      number: addr.number,
      complement: addr.complement ?? '',
      district: addr.district,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    })
    setShowForm(true)
  }

  const onSubmit = async (data: AddressForm) => {
    if (editingId) {
      await updateAddress.mutateAsync({ id: editingId, ...data })
    } else {
      await createAddress.mutateAsync(data as AddressInput)
    }
    setShowForm(false)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await deleteAddress.mutateAsync(id)
    setDeleteConfirm(null)
  }

  const handleSetDefault = async (addr: Address) => {
    await updateAddress.mutateAsync({ id: addr.id, isDefault: true })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Endereços</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar endereço
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {editingId ? 'Editar endereço' : 'Novo endereço'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do endereço</label>
              <input
                {...register('label')}
                placeholder="Ex: Casa, Trabalho"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.label && <p className="mt-1 text-xs text-rose-600">{errors.label.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
              <input
                {...register('street')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.street && <p className="mt-1 text-xs text-rose-600">{errors.street.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                {...register('number')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.number && <p className="mt-1 text-xs text-rose-600">{errors.number.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input
                {...register('complement')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input
                {...register('district')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.district && <p className="mt-1 text-xs text-rose-600">{errors.district.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                {...register('city')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.city && <p className="mt-1 text-xs text-rose-600">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                {...register('state')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.state && <p className="mt-1 text-xs text-rose-600">{errors.state.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                {...register('zipCode')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.zipCode && <p className="mt-1 text-xs text-rose-600">{errors.zipCode.message}</p>}
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="isDefault" {...register('isDefault')} className="rounded border-gray-300" />
              <label htmlFor="isDefault" className="text-sm text-gray-700">Endereço padrão</label>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={createAddress.isPending || updateAddress.isPending}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {createAddress.isPending || updateAddress.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address cards */}
      {(!addresses || addresses.length === 0) && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <MapPin className="mb-4 h-16 w-16 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700">Nenhum endereço cadastrado</h3>
          <p className="mt-1 text-sm text-gray-500">Adicione um endereço para facilitar suas compras.</p>
        </div>
      ) : (
        addresses?.map((addr) => (
          <div
            key={addr.id}
            className="rounded-2xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{addr.label}</p>
                  {addr.isDefault && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {addr.street}, {addr.number}
                  {addr.complement ? ` - ${addr.complement}` : ''}
                </p>
                <p className="text-sm text-gray-600">
                  {addr.district}, {addr.city} - {addr.state}
                </p>
                <p className="text-sm text-gray-500">CEP: {addr.zipCode}</p>
              </div>

              <div className="flex items-center gap-1">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr)}
                    title="Definir como padrão"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-violet-600 transition-colors"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-violet-600 transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {deleteConfirm === addr.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(addr.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
