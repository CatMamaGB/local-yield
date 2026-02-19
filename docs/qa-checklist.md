# QA Checklist

See also **qa-checklist-10min.md** for a runnable 10-minute pass with specific URLs and steps.

## Pre-Deploy Checklist (10 minutes)

Run through these critical paths before every deploy:

### Authentication & Authorization
- [ ] Sign up flow works
- [ ] Login flow works
- [ ] **Password reset (Clerk):** Test in staging/prod with Clerk enabled. Forgot password → email arrives → reset succeeds → user returns to app. Test with a deep link (e.g. `/auth/login?next=/dashboard/orders`) and confirm they land on the intended page after reset. (Dev stub has no passwords; reset is Clerk-only.)
- [ ] Admin routes require admin access
- [ ] Protected routes redirect non-authenticated users

### Care Services
- [ ] Search caregivers by ZIP/radius works
- [ ] Caregiver profile pages load
- [ ] Create booking request works
- [ ] Booking status transitions work (ACCEPT/DECLINE/CANCEL/COMPLETE)
- [ ] Booking idempotency prevents duplicates
- [ ] Reviews can only be created for COMPLETED bookings

### Help Exchange
- [ ] Browse toggle switches between Care Helpers and Help Exchange Jobs
- [ ] Category filter works for help exchange
- [ ] Create help exchange posting works
- [ ] Contact button creates conversation

### Market
- [ ] Browse listings works
- [ ] Create order works
- [ ] Order status updates work

### Messaging
- [ ] Send message works
- [ ] PII blocklist prevents sharing email/phone/SSN
- [ ] Rate limiting prevents spam

### Admin Tools
- [ ] Users list loads and filters work
- [ ] Listings list loads (market + care)
- [ ] Bookings list loads with status filters
- [ ] Help exchange list loads
- [ ] Reports queue loads and actions work

### Trust & Safety
- [ ] Report button works on caregiver profiles
- [ ] Reports can be created and viewed by admin
- [ ] Rate limiting works on search endpoints

### Error Handling
- [ ] Invalid requests return proper error codes
- [ ] Error messages are user-friendly
- [ ] Request logging captures errors

## Critical Paths to Test

1. **New user signup → browse → book care**
2. **Create help exchange posting → browse → contact**
3. **Admin: view reports → resolve/dismiss**
4. **Messaging: send message → verify PII blocked**

## Performance Checks

- [ ] Search results load in < 2 seconds
- [ ] Page loads are < 3 seconds
- [ ] No console errors in browser
- [ ] No excessive API calls

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile responsive

## Notes

- Run `npm run audit:api-contracts` before deploy
- Check request logs for errors
- Verify rate limiting is working
- Test with seed data: `npm run db:seed`
