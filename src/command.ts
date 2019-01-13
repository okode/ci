export interface Command {
  run(argv?: string[]): boolean | Promise<boolean>;
}
