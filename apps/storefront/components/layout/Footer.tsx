import Link from 'next/link'
import { Flower2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600">
                <Flower2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Reino Flor</span>
            </div>
            <p className="text-sm text-gray-500">A loja mais florida do Brasil 🌸</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Navegação</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/produtos" className="hover:text-violet-600">Produtos</Link></li>
              <li><Link href="/carrinho" className="hover:text-violet-600">Carrinho</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Atendimento</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>contato@reinoflor.com.br</li>
              <li>Seg–Sex, 9h–18h</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Reino Flor. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
