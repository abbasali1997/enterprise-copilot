import chalk from "chalk";

class Logger {
  constructor() {}

  success(message: string): void {
    this.logMessage(
      chalk.greenBright("SUCCESS"),
      chalk.greenBright(this.ensureString(message)),
    );
  }

  error(message: string, context?: string, trace?: string): void {
    this.logMessage(
      chalk.red("ERROR"),
      chalk.red(this.ensureString(message) + (trace ? `\n${trace}` : "")),
      context,
    );
  }

  warn(message: string, context?: string): void {
    this.logMessage(
      chalk.yellow("WARN"),
      chalk.yellow(this.ensureString(message)),
      context,
    );
  }

  info(message: string, context?: string): void {
    this.logMessage(
      chalk.cyan("INFO"),
      chalk.cyan(this.ensureString(message)),
      context,
    );
  }

  verbose(message: string, context?: string): void {
    this.logMessage(
      chalk.magenta("VERBOSE"),
      chalk.magenta(this.ensureString(message)),
      context,
    );
  }

  debug(message: string, context?: string): void {
    this.logMessage(
      chalk.gray("DEBUG"),
      chalk.gray(this.ensureString(message)),
      context,
    );
  }

  private logMessage(level: string, message: string, context?: string): void {
    const timestamp = new Date().toISOString();

    process.stdout.write(
      `${timestamp} ${level}${context ? ` [${context}]` : ""} ${message}\n`,
    );
  }

  private ensureString(
    message: string | Record<string, unknown> | any[],
  ): string {
    return typeof message === "string"
      ? message
      : JSON.stringify(message, null, 2);
  }
}

export const logger = new Logger();
