# Poll Expiration Feature

## Overview
The Poll Expiration feature allows poll creators to set an optional expiration date and time for their polls. Once a poll expires, it automatically stops accepting new votes and displays final results.

## Features

### 1. **Optional Expiration Date**
- Poll creators can set an expiration date/time when creating a poll
- Expiration is completely optional - polls without expiration dates remain open indefinitely
- Date/time picker ensures only future dates can be selected

### 2. **Real-time Countdown**
- Live countdown timer shows time remaining until expiration
- Updates every second with days, hours, minutes, and seconds
- Automatically switches to "Poll has expired" when time runs out

### 3. **Automatic Vote Blocking**
- Expired polls automatically stop accepting new votes
- Clear error message when users try to vote on expired polls
- Server-side validation prevents any votes from being submitted

### 4. **Visual Indicators**
- Poll cards show expiration status and date
- Expired polls are visually distinguished with reduced opacity
- Clear "Poll Expired" labels on expired polls

### 5. **Final Results Display**
- Expired polls show final results with vote counts and percentages
- Results are locked and cannot be changed after expiration
- Clean, professional display of final poll outcomes

## Technical Implementation

### Database Changes
- Added `expires_at` column to the `polls` table
- Column is nullable to support polls without expiration
- Indexed for efficient querying of expired polls

### New Components
- `PollCountdown`: Real-time countdown timer component
- `PollVotingInterface`: Handles voting logic with expiration checks
- Updated `PollCard`: Shows expiration status and dates

### Server Actions
- `getPollWithVotes`: Fetches poll data with vote counts and expiration status
- `checkExpiredPolls`: Utility function to identify expired polls
- Updated `submitVote`: Validates poll expiration before allowing votes

### Type Updates
- Added `PollWithVotes` interface for polls with vote data
- Updated `Poll` interface to include `expiresAt` field
- Enhanced form validation for expiration dates

## Usage

### Creating a Poll with Expiration
1. Navigate to the "Create Poll" page
2. Fill in the poll question and options
3. Optionally set an expiration date using the datetime picker
4. Submit the poll

### Viewing Poll Status
- Active polls show a countdown timer (if expiration is set)
- Expired polls display "Poll Expired" and show final results
- Poll cards indicate expiration status and dates

### Voting on Polls
- Users can vote on active polls normally
- Expired polls show final results instead of voting options
- Clear error messages prevent confusion

## Database Migration

To enable this feature, run the following SQL migration:

```sql
-- Add expires_at column to polls table
ALTER TABLE polls 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index for efficient querying of expired polls
CREATE INDEX idx_polls_expires_at ON polls(expires_at) WHERE expires_at IS NOT NULL;
```

## Benefits

1. **Time-Sensitive Decisions**: Perfect for polls with deadlines
2. **Engagement**: Countdown timers create urgency and engagement
3. **Clean Results**: Automatic closure prevents stale or outdated votes
4. **Professional Appearance**: Clear visual indicators of poll status
5. **Data Integrity**: Server-side validation ensures expired polls can't be voted on

## Future Enhancements

- Email notifications when polls are about to expire
- Automatic cleanup of very old expired polls
- Analytics on poll engagement before expiration
- Custom expiration messages
- Poll extension functionality for poll creators
