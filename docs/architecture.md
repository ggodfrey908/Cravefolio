# Cravefolio architecture — initial foundation

## Current state
`index.html` is the approved, responsive visual prototype. All displayed reward figures are demonstration content, not live balances. No sign-in, account syncing, backend, or restaurant integration is active.

## Planned production structure
- Cloudflare Pages: public frontend.
- Authentication: select a managed authentication provider before collecting user accounts.
- Server-side API: returns only the signed-in user's authorized, normalized rewards data.
- Database: users, restaurant connections, rewards, synchronization jobs, audit events.
- Scheduled worker: checks authorized sources on permitted schedules and updates sync status.
- Notifications: opt-in expiry reminders after accurate expiry data is available.

## Integration requirements
Only use official APIs, approved partner access, or user-authorized data sources where terms permit. Never ask users to enter restaurant passwords into Cravefolio. Never claim a restaurant is connected until it really is.

## Next implementation milestone
Choose authentication/database stack, create separate development environment, add server-side session checks, then replace demonstration data with explicit empty/loading/unavailable states.
