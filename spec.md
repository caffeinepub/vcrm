# Specification

## Summary
**Goal:** Fix sidebar text/icon visibility, remove "Refer & Earn", implement real persistent backend storage, replace all mock/hardcoded data with live backend data, and make all action buttons fully functional.

**Planned changes:**
- Fix sidebar so all navigation labels and icons render in white/light color, clearly readable against the purple background
- Remove "Refer & Earn" menu item from the sidebar entirely
- Implement persistent Motoko backend storage (stable variables) for contacts/leads, deals, and pipeline stages with full CRUD
- Dashboard fetches and displays only real backend data; all counters start at 0 and update as data is added — no hardcoded/mock data
- Pipeline board fetches only user-added deals from the backend; starts empty and updates when deals are added or moved between stages
- Wire up all action buttons (Add Contact, Add Lead, Add Deal, Edit, Delete) to open forms, submit to backend, and immediately reflect changes in the UI with success/error notifications

**User-visible outcome:** The sidebar is fully legible with white text and icons, "Refer & Earn" is gone, and the CRM is fully functional — users can add contacts, leads, and deals that persist across sessions, with the dashboard and pipeline updating in real time based on actual entered data.
