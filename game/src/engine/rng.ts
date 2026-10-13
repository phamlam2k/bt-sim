/** mulberry32. The generator state lives in GameState so every run is replayable. */
export function nextRandom(state: number): { value: number; next: number } {
  const next = (state + 0x6d2b79f5) | 0;
  let r = Math.imul(next ^ (next >>> 15), next | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return { value: ((r ^ (r >>> 14)) >>> 0) / 4294967296, next };
}

export function randomHex(state: number, length: number): { value: string; next: number } {
  let s = state;
  let out = '';
  for (let i = 0; i < length; i++) {
    const r = nextRandom(s);
    s = r.next;
    out += Math.floor(r.value * 16).toString(16);
  }
  return { value: out, next: s };
}
