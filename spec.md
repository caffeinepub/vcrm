# Specification

## Summary
**Goal:** Fix the first-user auto-admin approval flow and add the VCRM logo to the sidebar and login page.

**Planned changes:**
- Update the backend so the very first user to log in via Internet Identity is automatically granted Admin status and bypasses the "Access Pending" screen; all subsequent new users still require admin approval.
- Save the VCRM logo image as a static asset at `frontend/public/assets/generated/vcrm-logo.png`.
- Display the VCRM logo in the sidebar header on all authenticated pages.
- Display the VCRM logo on the login page.

**User-visible outcome:** The first user to sign in is taken directly to the dashboard as Admin with no approval wait. All other new users still see the "Access Pending" screen. The VCRM logo (blue V with bar chart, orange sphere, silver "CRM" text) appears in the sidebar and on the login page.
