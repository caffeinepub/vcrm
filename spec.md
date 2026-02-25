# Specification

## Summary
**Goal:** Fix the false "Authentication failed. Please log out and log in again." error that appears in the Profile Setup Modal when a user with a valid Internet Identity session submits the profile form.

**Planned changes:**
- In `ProfileSetupModal.tsx`, remove the logic that shows the "Authentication failed. Please log out and log in again." error banner and the "Log out and try again" link for authenticated users
- If the actor is null or unavailable at submission time, silently wait/retry for the actor to become ready before calling `saveCallerUserProfile`
- Replace any authentication-related error messages with a neutral retry message (e.g., "Unable to save profile. Please try again.") only if all retries fail
- In `useQueries.ts`, fix the `useSaveCallerUserProfile` mutation to fetch a fresh actor reference at call time instead of relying on a stale closure
- Label actor-unavailable errors as `actor_not_ready` (distinct from `session_expired`) so the modal can handle them without showing false auth failure messages

**User-visible outcome:** A user with a valid Internet Identity session can fill in their Full Name and Email and click "Save Profile & Continue" without seeing any authentication error. The modal saves the profile and redirects to the dashboard successfully.
