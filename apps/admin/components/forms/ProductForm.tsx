'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { useProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { slugify } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug inválido (use letras minúsculas e hífens)'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Preço inválido'),
  comparePrice: z.coerce.number().positive().optional().or(z.literal('')),
  sku: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  featured: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface ProductFormProps {
  id?: string
}

export function ProductForm({ id }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!id
  const { data: product } = useProduct(id ?? '')
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct(id ?? '')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'DRAFT', featured: false },
  })

  const nameValue = watch('name')

  useEffect(() => {
    if (!isEdit && nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }, [nameValue, isEdit, setValue])

  useEffect(() => {
    if (product) {
      setValue('name', product.name)
      setValue('slug', product.slug)
      setValue('description', product.description ?? '')
      setValue('price', Number(product.price))
      setValue('comparePrice', product.comparePrice ? Number(product.comparePrice) : '')
      setValue('sku', product.sku ?? '')
      setValue('status', product.status as any)
      setValue('featured', product.featured)
    }
  }, [product, setValue])

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, comparePrice: data.comparePrice || undefined }
    if (isEdit) {
      await updateProduct.mutateAsync(payload)
    } else {
      await createProduct.mutateAsync(payload)
    }
    router.push('/dashboard/products')
  }

  const loading = createProduct.isPending || updateProduct.isPending

  return (
    <div className="flex flex-col">
      <Topbar title={isEdit ? 'Editar Produto' : 'Novo Produto'} />
      <div className="p-6 max-w-2xl space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader><h2 className="text-sm font-semibold">Informações básicas</h2></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Nome" error={errors.name?.message} {...register('name')} />
              <Input label="Slug" error={errors.slug?.message} hint="URL amigável do produto" {...register('slug')} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  rows={4}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  {...register('description')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold">Preço e estoque</h2></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Input label="Preço (R$)" type="number" step="0.01" error={errors.price?.message} {...register('price')} />
              <Input label="Preço comparativo (R$)" type="number" step="0.01" hint="Preço original (riscado)" {...register('comparePrice')} />
              <Input label="SKU" hint="Código interno do produto" {...register('sku')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold">Publicação</h2></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  {...register('status')}
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" {...register('featured')} />
                Produto em destaque
              </label>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              {isEdit ? 'Salvar alterações' : 'Criar produto'}
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
