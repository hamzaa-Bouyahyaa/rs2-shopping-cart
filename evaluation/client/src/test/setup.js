import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest runs without injected globals, so testing-library cannot register
// its automatic cleanup hook. Do it explicitly.
afterEach(cleanup);
