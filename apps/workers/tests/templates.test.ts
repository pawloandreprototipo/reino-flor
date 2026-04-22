import {
  abandonedCartTemplate,
  orderConfirmationTemplate,
  campaignTemplate,
} from '../src/email/templates'

describe('abandonedCartTemplate', () => {
  const params = {
    userName: 'Maria',
    items: [
      { name: 'Rosa Vermelha', price: 89.9, quantity: 2 },
      { name: 'Vaso Cerâmica', price: 59.9, quantity: 1 },
    ],
    recoveryUrl: 'http://localhost:3000/carrinho',
  }

  it('deve gerar subject com nome do usuário', () => {
    const { subject } = abandonedCartTemplate(params)
    expect(subject).toContain('Maria')
    expect(subject).toContain('carrinho')
  })

  it('deve incluir nomes dos produtos no HTML', () => {
    const { html } = abandonedCartTemplate(params)
    expect(html).toContain('Rosa Vermelha')
    expect(html).toContain('Vaso Cerâmica')
  })

  it('deve incluir link de recuperação', () => {
    const { html } = abandonedCartTemplate(params)
    expect(html).toContain('http://localhost:3000/carrinho')
  })

  it('deve incluir cupom quando fornecido', () => {
    const { html } = abandonedCartTemplate({ ...params, couponCode: 'VOLTEI10' })
    expect(html).toContain('VOLTEI10')
  })

  it('não deve incluir seção de cupom quando não fornecido', () => {
    const { html } = abandonedCartTemplate(params)
    expect(html).not.toContain('cupom')
  })
})

describe('orderConfirmationTemplate', () => {
  const params = {
    userName: 'João',
    orderId: 'cmnc3vvio000kf3fyvl5zjfpn',
    items: [
      { name: 'Girassol Amarelo', quantity: 2, price: 45.9, total: 91.8 },
    ],
    total: 107.7,
    paymentMethod: 'PIX',
  }

  it('deve gerar subject com ID do pedido', () => {
    const { subject } = orderConfirmationTemplate(params)
    expect(subject).toContain('L5ZJFPN')
  })

  it('deve incluir nome do produto no HTML', () => {
    const { html } = orderConfirmationTemplate(params)
    expect(html).toContain('Girassol Amarelo')
  })

  it('deve incluir método de pagamento', () => {
    const { html } = orderConfirmationTemplate(params)
    expect(html).toContain('PIX')
  })

  it('deve incluir nome do cliente', () => {
    const { html } = orderConfirmationTemplate(params)
    expect(html).toContain('João')
  })
})

describe('campaignTemplate', () => {
  it('deve gerar HTML com subject e body', () => {
    const { subject, html } = campaignTemplate({
      subject: 'Promoção de verão',
      body: '<p>Aproveite 20% de desconto!</p>',
    })
    expect(subject).toBe('Promoção de verão')
    expect(html).toContain('Aproveite 20% de desconto!')
  })

  it('deve incluir nome do subscriber quando fornecido', () => {
    const { html } = campaignTemplate({
      subject: 'Novidades',
      body: 'Confira!',
      subscriberName: 'Ana',
    })
    expect(html).toContain('Ana')
  })
})
