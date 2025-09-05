import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserPolls } from '@/app/lib/actions/poll-actions';
import PollActions from './PollActions'; 

/**
 * User Dashboard - Polls Management Page
 * 
 * This server component displays the user's personal dashboard where they can view
 * all their created polls. It fetches poll data server-side and provides a clean
 * interface for poll management including viewing, editing, and deleting polls.
 * 
 * Features:
 * - Server-side data fetching for optimal performance
 * - Responsive grid layout for poll display
 * - Empty state with call-to-action for new users
 * - Error handling and display
 * - Quick access to poll creation
 * 
 * @returns JSX element containing the polls dashboard interface
 */
export default async function PollsPage() {
  // Fetch user's polls from the database (server-side)
  const { polls, error } = await getUserPolls();

  return (
    <div className="space-y-6">
      {/* Page header with title and create poll button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Polls</h1>
        <Button asChild>
          <Link href="/create">Create New Poll</Link>
        </Button>
      </div>
      
      {/* Polls grid layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {polls && polls.length > 0 ? (
          // Display user's polls with management actions
          polls.map((poll) => <PollActions key={poll.id} poll={poll} />)
        ) : (
          // Empty state for users with no polls
          <div className="flex flex-col items-center justify-center py-12 text-center col-span-full">
            <h2 className="text-xl font-semibold mb-2">No polls yet</h2>
            <p className="text-slate-500 mb-6">Create your first poll to get started</p>
            <Button asChild>
              <Link href="/create">Create New Poll</Link>
            </Button>
          </div>
        )}
      </div>
      
      {/* Error display for failed data fetching */}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}