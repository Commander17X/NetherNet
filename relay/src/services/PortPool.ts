export class PortPool {
  private readonly free: Set<number>;

  constructor(
    private readonly min: number,
    private readonly max: number,
  ) {
    if (min > max) throw new Error(`Invalid port pool: ${min}-${max}`);
    this.free = new Set<number>();
    for (let p = min; p <= max; p++) {
      this.free.add(p);
    }
  }

  allocate(): number | undefined {
    if (this.free.size === 0) return undefined;
    const port = Math.min(...this.free);
    this.free.delete(port);
    return port;
  }

  release(port: number): void {
    if (port < this.min || port > this.max) return;
    this.free.add(port);
  }

  availableCount(): number {
    return this.free.size;
  }
}