import { signAccessToken, verifyToken, generateTokenPair } from '../src/jwt'
import { JwtPayload } from '../src/jwt'

const mockPayload: JwtPayload = {
  sub: 'user-123',
  tenantId: 'tenant-456',
  role: 'ADMIN',
  email: 'admin@reinoflor.com',
}

describe('JWT', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-32-chars-long-enough!!'
  })

  it('deve gerar e verificar access token', () => {
    const token = signAccessToken(mockPayload)
    expect(token).toBeTruthy()

    const decoded = verifyToken(token)
    expect(decoded.sub).toBe(mockPayload.sub)
    expect(decoded.tenantId).toBe(mockPayload.tenantId)
    expect(decoded.role).toBe(mockPayload.role)
  })

  it('deve gerar par de tokens (access + refresh)', () => {
    const { accessToken, refreshToken } = generateTokenPair(mockPayload)
    expect(accessToken).toBeTruthy()
    expect(refreshToken).toBeTruthy()
    expect(accessToken).not.toBe(refreshToken)
  })

  it('deve lançar erro para token inválido', () => {
    expect(() => verifyToken('token-invalido')).toThrow()
  })

  it('deve lançar erro para token expirado', () => {
    const expiredToken = signAccessToken({ ...mockPayload })
    // Simula token com expiração no passado
    const jwt = require('jsonwebtoken')
    const expiredSigned = jwt.sign(mockPayload, 'test-secret-32-chars-long-enough!!', { expiresIn: -1 })
    expect(() => verifyToken(expiredSigned)).toThrow()
  })
})
