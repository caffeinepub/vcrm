# Specification

## Summary
**Goal:** Implement OTP-based login as the primary authentication method and add a professional user profile page to the VCRM application.

**Planned changes:**
- Add `generateOTP(email)` and `verifyOTP(email, otp)` functions to the Motoko backend with 6-digit OTP generation, 10-minute expiry enforcement, and first-user auto-admin logic
- Add `getCallerUserProfile` and `updateCallerUserProfile(name, email, phone)` backend functions supporting richer profile fields (name, email, phone, role, approvalStatus, joinDate)
- Replace the existing login page with a two-step OTP login UI: Step 1 (email input + Send OTP button) and Step 2 (OTP input with countdown timer, Resend OTP link, Verify button, and inline OTP display banner)
- Create a new `ProfilePage.tsx` at `/profile` displaying user info in a card layout with an inline edit form for name, email, and phone; read-only role/status fields; and a Re-verify via OTP button
- Register the `/profile` route in `App.tsx` and add a Profile link with icon to the sidebar in `Layout.tsx`
- Add React Query hooks in `useQueries.ts`: `useGenerateOTP`, `useVerifyOTP`, `useGetCallerUserProfile`, and `useUpdateCallerUserProfile` with proper loading/error states and query invalidation

**User-visible outcome:** Users can log in via a professional OTP-based email flow, view and edit their profile details at `/profile`, and re-verify their identity via OTP — all styled consistently with the emerald green / dark teal brand theme.
