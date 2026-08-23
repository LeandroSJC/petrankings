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

1. **Unit & Component Tests** (React Testing Library / Vitest):
   - Test component rendering, user events (clicks, typing, keyboard navigation), and state transitions.
   - Query by user-facing roles and text (`getByRole`, `getByText`, `getByLabelText`) rather than implementation details (class names or IDs).
2. **Integration Tests**:
   - Test data fetching hooks, form submissions, and validation error messages.
3. **End-to-End (E2E) Tests** (Playwright / Browser Subagent):
   - Validate critical user journeys: Navigation, Authentication, CRUD actions, and responsive layout checks.

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
