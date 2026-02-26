# Specification

## Summary
**Goal:** Fix the "Unable to save profile" error that occurs when submitting the Profile Setup modal.

**Planned changes:**
- Fix the backend `saveCallerUserProfile` function so its Candid type signature correctly accepts name, email, and phone fields, persists them in stable storage, and returns a `#ok` result variant on success
- Fix the ProfileSetupModal component to correctly call `saveCallerUserProfile` with the right argument types, using a fresh authenticated actor instance
- Ensure successful profile save dismisses the modal and navigates the user to the dashboard
- Ensure backend errors are surfaced as a clear error message inside the modal

**User-visible outcome:** Users can fill in their name, email, and phone in the Profile Setup modal and successfully save their profile, proceeding to the dashboard without errors.
