# Specification

## Summary
**Goal:** Hardcode a Super Admin user (`vcrm.com@gmail.com`) that bypasses the approval flow, and build an Admin Panel for managing user approvals.

**Planned changes:**
- Hardcode `vcrm.com@gmail.com` as Super Admin in the backend so it is always treated as approved with admin/owner role
- Add backend functions to list pending users, approve a user, and reject a user (admin-only access)
- Fix the auth guard in `Layout.tsx` so that the Super Admin (by email or admin role) is never shown the "Access Pending Approval" screen and is redirected directly to the Dashboard
- Build a new `AdminPage.tsx` with tabs/sections for Pending, Approved, and Rejected users, each showing name, email, and registration date with Approve/Reject actions
- Add an Admin Panel navigation link in the sidebar visible only to admin/owner role users
- Restrict access to the Admin Panel page so non-admin users cannot navigate to it

**User-visible outcome:** Logging in with `vcrm.com@gmail.com` immediately lands on the Dashboard. The Super Admin can open the Admin Panel from the sidebar, view all pending users, and approve or reject them. Approved users gain dashboard access; rejected users remain blocked.
