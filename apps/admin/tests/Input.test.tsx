import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renderiza label corretamente', () => {
    render(<Input label="E-mail" />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('exibe mensagem de erro', () => {
    render(<Input label="Senha" error="Senha obrigatória" />)
    expect(screen.getByText('Senha obrigatória')).toBeInTheDocument()
  })

  it('exibe hint quando não há erro', () => {
    render(<Input label="Slug" hint="Use letras minúsculas" />)
    expect(screen.getByText('Use letras minúsculas')).toBeInTheDocument()
  })

  it('aplica classe de erro na borda', () => {
    render(<Input label="Campo" error="Erro" />)
    expect(screen.getByRole('textbox')).toHaveClass('border-red-400')
  })
})
