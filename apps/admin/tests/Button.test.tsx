import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renderiza o texto corretamente', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('exibe spinner quando loading=true', () => {
    render(<Button loading>Salvando</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('chama onClick quando clicado', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Clique</Button>)
    fireEvent.click(screen.getByText('Clique'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('não chama onClick quando disabled', () => {
    const onClick = jest.fn()
    render(<Button disabled onClick={onClick}>Clique</Button>)
    fireEvent.click(screen.getByText('Clique'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('aplica variante danger corretamente', () => {
    render(<Button variant="danger">Excluir</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })
})
