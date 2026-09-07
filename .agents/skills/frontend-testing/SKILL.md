---
name: frontend-testing
description: >-
  Provides procedures and best practices for writing and executing frontend tests, including component unit tests
  (Vitest / React Testing Library) and end-to-end (E2E) browser automation tests with Playwright.
  Use this skill when creating tests, debugging broken UI tests, setting up testing frameworks, or verifying user flows.
---

# Frontend & Component Testing Specialist

This skill provides step-by-step guidance for testing modern React and Next.js applications, covering unit, integration, and E2E testing.

## 1. Testing Strategy

1. **Native E2E Automation (Antigravity `browser_subagent` — Zero Setup)**:
   - Use the native `browser_subagent` tool for immediate visual and interactive E2E validation of pages, forms, and responsive states.
   - Automatically navigates, clicks, types, inspects the DOM, and records video/screenshots without requiring external test runner dependencies.
2. **Component & Unit Tests (Vitest + React Testing Library)**:
   - For local CLI test suites, install the testing dependencies if not already present:
     ```bash
     npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
     ```
   - Test component rendering, user interactions, and state transitions with user-facing queries (`getByRole`, `getByText`).
3. **Headless E2E Test Suites (Playwright)**:
   - For CI/CD automation pipelines:
     ```bash
     npm install -D @playwright/test
     npx playwright install
     ```

## 2. Best Practices for React Component Testing

- **User-Centric Queries**:
  ```tsx
  // Good: tests what the user perceives
  const submitButton = screen.getByRole('button', { name: /salvar/i });
  expect(submitButton).toBeInTheDocument();
  ```
- **Async Interactions**: Always await state changes and async actions with `waitFor` or `findByRole`.
- **Mocking External APIs**: Mock server actions and fetch calls cleanly without leaking state between test runs.

## 3. End-to-End (E2E) Workflow

When verifying full application flows:
1. Ensure the development server is running (`npm run dev` or `http://localhost:3000`).
2. Run test suites or leverage the `browser_subagent` to step through the workflow:
   - Navigate to page.
   - Perform actions (input, click, submit).
   - Assert visual changes and route transitions.
3. Capture screenshots on test failure for quick debugging.

## 4. Test Verification Checklist

- [ ] All critical user paths (happy path + edge cases) have coverage.
- [ ] No flaky async timeouts; all promises and transitions properly awaited.
- [ ] Form validations (empty fields, invalid formats) tested and verified.
- [ ] Error boundaries and fallback states tested.
