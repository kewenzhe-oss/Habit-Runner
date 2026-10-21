// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"

// Next supplies React's server cache in RSC. Unit tests use React 18's client
// build, so keep these wrappers uncached rather than sharing data across tests.
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: (fn) => fn,
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
