export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
  }
}

export function handleError(error) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  // Erro do Supabase
  if (error?.code) {
    return {
      message: error.message || 'Erro ao processar solicitação',
      code: error.code,
      statusCode: 400,
    }
  }

  // Erro genérico
  return {
    message: error.message || 'Erro desconhecido',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  }
}

