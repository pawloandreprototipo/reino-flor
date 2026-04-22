import nodemailer from 'nodemailer'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

function createTransporter() {
  const apiKey = process.env.SENDGRID_API_KEY

  // SendGrid em produção
  if (apiKey && apiKey !== 'SG.MOCK') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: apiKey },
    })
  }

  // Ethereal (mock) em desenvolvimento
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.SMTP_USER ?? 'mock@ethereal.email',
      pass: process.env.SMTP_PASS ?? 'mockpassword',
    },
  })
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const isMock = !process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'SG.MOCK'

  if (isMock) {
    console.log(`[Email Mock] Para: ${params.to} | Assunto: ${params.subject}`)
    return
  }

  const transporter = createTransporter()
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@reinoflor.com.br',
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })
}
