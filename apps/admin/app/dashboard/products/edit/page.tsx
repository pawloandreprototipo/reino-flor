import { ProductForm } from '@/components/forms/ProductForm'

interface Props {
  params: { id: string }
}

export default function EditProductPage({ params }: Props) {
  return <ProductForm id={params.id} />
}
