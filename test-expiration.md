# Testing Poll Expiration Feature

## Test Steps

### 1. Database Setup
```sql
-- Run the migration
\i migrations/add_poll_expiration.sql
```

### 2. Create a Poll with Expiration
1. Navigate to `/create`
2. Fill in poll question: "What's your favorite color?"
3. Add options: "Red", "Blue", "Green"
4. Set expiration date to 1 hour from now
5. Submit the poll

### 3. Test Poll Display
1. Navigate to `/polls` to see the poll card
2. Verify it shows expiration date
3. Click on the poll to view details
4. Verify countdown timer is showing
5. Verify poll is accepting votes

### 4. Test Expired Poll
1. Wait for poll to expire (or manually set expiration to past time in database)
2. Refresh the poll page
3. Verify "Poll Expired" message is shown
4. Verify voting is disabled
5. Verify final results are displayed

### 5. Test Vote Blocking
1. Try to vote on an expired poll
2. Verify error message: "This poll has expired and is no longer accepting votes."

## Expected Results

- ✅ Poll creation form includes expiration date field
- ✅ Poll cards show expiration status
- ✅ Countdown timer works correctly
- ✅ Expired polls show final results
- ✅ Voting is blocked on expired polls
- ✅ Server-side validation prevents expired poll votes
- ✅ UI clearly indicates poll status

## Files Modified

- `app/lib/types/index.ts` - Added expiration types
- `lib/validations/poll.ts` - Added expiration validation
- `app/(dashboard)/create/PollCreateForm.tsx` - Added expiration field
- `app/lib/actions/poll-actions.ts` - Added expiration logic
- `app/components/PollCountdown.tsx` - New countdown component
- `app/components/PollVotingInterface.tsx` - New voting interface
- `app/(dashboard)/polls/[id]/page.tsx` - Updated poll display
- `app/components/ui/poll-card.tsx` - Updated poll cards
- `migrations/add_poll_expiration.sql` - Database migration
