import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Isolate DOM between tests (RTL auto-cleanup only applies with globals mode).
afterEach(() => {
  cleanup();
});

// jsdom has no IntersectionObserver; framer-motion's `useInView` (used by
// ScrollReveal) requires it. A no-op mock keeps component tests focused on
// rendering rather than viewport behavior.
class MockIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
