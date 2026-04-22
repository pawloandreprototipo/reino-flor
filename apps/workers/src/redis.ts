import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

let _connection: IORedis | null = null

export function getRedisConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
    _connection.on('error', (err) => {
      console.error('[Redis] Erro de conexão:', err.message)
    })
  }
  return _connection
}

export async function closeRedisConnection(): Promise<void> {
  if (_connection) {
    await _connection.quit()
    _connection = null
  }
}
