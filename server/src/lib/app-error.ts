export class AppError extends Error {
  statusCode: number;
  error: string;

  constructor(statusCode: number, message: string, error = 'Application Error') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

export const badRequest = (message: string) => new AppError(400, message, 'Bad Request');
export const unauthorized = (message: string) => new AppError(401, message, 'Unauthorized');
export const forbidden = (message: string) => new AppError(403, message, 'Forbidden');
export const notFound = (message: string) => new AppError(404, message, 'Not Found');
