// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Onboarding } from './screens/Onboarding';

/** The typing animation itself: text arrives gradually, and can be skipped. */
describe('onboarding typewriter', () => {
  let root: Root;
  const text = () => document.body.textContent ?? '';
  // Each character is scheduled after the previous one renders, so time has to advance in small steps.
  const elapse = (ms: number) => {
    for (let t = 0; t < ms; t += 16) act(() => vi.advanceTimersByTime(16));
  };

  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Element.prototype.scrollIntoView = () => {};
    localStorage.clear();
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<Onboarding />));
  });

  afterAll(() => {
    act(() => root.unmount());
    vi.useRealTimers();
  });

  it('types the greeting gradually and holds the question back until it is done', () => {
    expect(text()).not.toContain('Hello.');
    expect(document.querySelector('input[aria-label="Your name"]')).toBeNull();

    elapse(400);
    const early = text();
    expect(early).toContain('$ ./career');
    expect(early).not.toContain('what should we call you?');

    elapse(400);
    expect(text().length).toBeGreaterThan(early.length);
    expect(document.querySelector('input[aria-label="Your name"]')).toBeNull();
  });

  it('finishes at once when the player presses Enter', () => {
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })));
    expect(text()).toContain('First things first: what should we call you?');
    expect(document.querySelector('input[aria-label="Your name"]')).not.toBeNull();
  });
});
