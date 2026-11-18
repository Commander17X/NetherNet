import { PortPool } from '../src/services/PortPool';

describe('PortPool', () => {
  it('allocates and releases within range', () => {
    const pool = new PortPool(19132, 19134);
    expect(pool.availableCount()).toBe(3);
    const a = pool.allocate();
    const b = pool.allocate();
    expect(a).toBe(19132);
    expect(b).toBe(19133);
    pool.release(a!);
    expect(pool.allocate()).toBe(19132);
  });

  it('returns undefined when exhausted', () => {
    const pool = new PortPool(50000, 50000);
    expect(pool.allocate()).toBe(50000);
    expect(pool.allocate()).toBeUndefined();
  });
});