/**
 * Logger Utility - Section 19.3: Monitoring and Error Logging
 * Production-ready logging with structured output for monitoring systems
 */

import { env } from '../config/env.js';

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Structured log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger class for structured logging
 * Section 19.3: Error monitoring and alerting support
 */
class Logger {
  private isProduction: boolean;

  constructor() {
    this.isProduction = env.nodeEnv === 'production';
  }

  /**
   * Format log entry as JSON for production or readable text for development
   */
  private formatEntry(entry: LogEntry): string {
    if (this.isProduction) {
      // JSON format for production log aggregation (e.g., CloudWatch, Datadog)
      return JSON.stringify(entry);
    }

    // Human-readable format for development
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.context ? `[${entry.context}]` : '',
      entry.message,
    ].filter(Boolean);

    let output = parts.join(' ');

    if (entry.data) {
      output += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack && !this.isProduction) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (!this.isProduction) {
      const entry = this.createEntry(LogLevel.DEBUG, message, context, data);
      console.log(this.formatEntry(entry));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.INFO, message, context, data);
    console.log(this.formatEntry(entry));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.WARN, message, context, data);
    console.warn(this.formatEntry(entry));
  }

  /**
   * Log error message
   * Section 19.3: Error logging for monitoring and alerting
   */
  error(
    message: string,
    error?: Error,
    context?: string,
    data?: Record<string, unknown>
  ): void {
    const entry = this.createEntry(LogLevel.ERROR, message, context, data, error);
    console.error(this.formatEntry(entry));

    // In production, errors could be sent to external monitoring service
    // Example: Sentry, Datadog, CloudWatch Logs
    // This is where you'd integrate with your monitoring platform
  }

  /**
   * Log API request (for performance monitoring)
   * Section 19.1: API call response time tracking
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    userId?: string
  ): void {
    const data: Record<string, unknown> = {
      method,
      path,
      statusCode,
      durationMs,
    };

    if (userId) {
      data.userId = userId;
    }

    // Log slow requests as warnings (Section 19.1: API <500ms)
    if (durationMs > 500) {
      this.warn(`Slow API request: ${method} ${path}`, 'HTTP', data);
    } else {
      this.info(`${method} ${path} ${statusCode} ${durationMs}ms`, 'HTTP', data);
    }
  }

  /**
   * Log database query (for performance monitoring)
   * Section 19.1: Track slow queries
   */
  query(sql: string, durationMs: number, context?: string): void {
    if (durationMs > 100) {
      // Log slow queries (>100ms) as warnings
      this.warn(`Slow query: ${durationMs}ms`, context || 'DB', {
        sql: sql.substring(0, 200), // Truncate long queries
        durationMs,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;
