function baseLayout(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .footer { background: #f3f4f6; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    .btn { display: inline-block; background: #7c3aed; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 16px 0; }
    .product-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-weight: 700; font-size: 16px; }
    .badge { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌸 Reino Flor</h1>
      <p>A loja mais florida do Brasil</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © ${new Date().getFullYear()} Reino Flor · <a href="#" style="color:#9ca3af">Cancelar inscrição</a>
    </div>
  </div>
</body>
</html>`
}

export function abandonedCartTemplate(params: {
  userName: string
  items: { name: string; price: number; quantity: number; imageUrl?: string }[]
  couponCode?: string
  recoveryUrl: string
}): { subject: string; html: string } {
  const subtotal = params.items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const itemsHtml = params.items.map(i => `
    <div class="product-row">
      <span>${i.name} ×${i.quantity}</span>
      <span>${fmt(i.price * i.quantity)}</span>
    </div>`).join('')

  const couponHtml = params.couponCode
    ? `<p style="margin:16px 0;padding:12px;background:#ede9fe;border-radius:12px;text-align:center;">
        🎁 Use o cupom <strong>${params.couponCode}</strong> e ganhe desconto extra!
       </p>`
    : ''

  const content = `
    <h2 style="margin:0 0 8px;color:#111827">Oi, ${params.userName}! 👋</h2>
    <p style="color:#6b7280;margin:0 0 24px">Você deixou alguns itens no carrinho. Eles estão esperando por você!</p>
    ${itemsHtml}
    <div class="total-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    ${couponHtml}
    <div style="text-align:center">
      <a href="${params.recoveryUrl}" class="btn">Finalizar minha compra →</a>
    </div>
    <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:16px">
      Este link expira em 24 horas.
    </p>`

  return {
    subject: `${params.userName}, você esqueceu algo no carrinho 🛒`,
    html: baseLayout(content, 'Carrinho abandonado'),
  }
}

export function orderConfirmationTemplate(params: {
  userName: string
  orderId: string
  items: { name: string; quantity: number; price: number; total: number }[]
  total: number
  paymentMethod: string
}): { subject: string; html: string } {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const itemsHtml = params.items.map(i => `
    <div class="product-row">
      <span>${i.name} ×${i.quantity}</span>
      <span>${fmt(i.total)}</span>
    </div>`).join('')

  const paymentLabel: Record<string, string> = {
    PIX: '🔑 PIX', CREDIT_CARD: '💳 Cartão de crédito',
    DEBIT_CARD: '💳 Cartão de débito', BOLETO: '📄 Boleto',
  }

  const content = `
    <h2 style="margin:0 0 8px;color:#111827">Pedido confirmado! 🎉</h2>
    <p style="color:#6b7280;margin:0 0 8px">Olá, <strong>${params.userName}</strong>!</p>
    <p style="color:#6b7280;margin:0 0 24px">
      Seu pedido <span class="badge">#${params.orderId.slice(-8).toUpperCase()}</span> foi recebido com sucesso.
    </p>
    ${itemsHtml}
    <div class="total-row"><span>Total</span><span>${fmt(params.total)}</span></div>
    <p style="margin:16px 0;font-size:14px;color:#6b7280">
      Forma de pagamento: <strong>${paymentLabel[params.paymentMethod] ?? params.paymentMethod}</strong>
    </p>
    <p style="font-size:13px;color:#9ca3af;margin-top:24px">
      Você receberá atualizações sobre o envio por e-mail. Obrigado por comprar na Reino Flor! 🌸
    </p>`

  return {
    subject: `Pedido #${params.orderId.slice(-8).toUpperCase()} confirmado! 🌸`,
    html: baseLayout(content, 'Pedido confirmado'),
  }
}

export function campaignTemplate(params: {
  subject: string
  body: string
  subscriberName?: string
}): { subject: string; html: string } {
  const content = `
    ${params.subscriberName ? `<p style="color:#6b7280;margin:0 0 16px">Olá, <strong>${params.subscriberName}</strong>!</p>` : ''}
    <div style="color:#374151;line-height:1.7">${params.body}</div>`

  return {
    subject: params.subject,
    html: baseLayout(content, params.subject),
  }
}
