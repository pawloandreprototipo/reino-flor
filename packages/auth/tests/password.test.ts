import { hashPassword, comparePassword, validatePasswordStrength } from '../src/password'

describe('Password', () => {
  it('deve gerar hash diferente da senha original', async () => {
    const hash = await hashPassword('MinhaSenh@1')
    expect(hash).not.toBe('MinhaSenh@1')
    expect(hash.length).toBeGreaterThan(20)
  })

  it('deve validar senha correta contra o hash', async () => {
    const password = 'MinhaSenh@1'
    const hash = await hashPassword(password)
    const isValid = await comparePassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('deve rejeitar senha incorreta', async () => {
    const hash = await hashPassword('MinhaSenh@1')
    const isValid = await comparePassword('SenhaErrada1', hash)
    expect(isValid).toBe(false)
  })

  it('deve rejeitar senha com menos de 8 caracteres', () => {
    const result = validatePasswordStrength('abc123')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('8 caracteres')
  })

  it('deve rejeitar senha sem letra maiúscula', () => {
    const result = validatePasswordStrength('minhasenha1')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('maiúscula')
  })

  it('deve rejeitar senha sem número', () => {
    const result = validatePasswordStrength('MinhaSenha')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('número')
  })

  it('deve aceitar senha forte', () => {
    const result = validatePasswordStrength('MinhaSenh@1')
    expect(result.valid).toBe(true)
  })
})
