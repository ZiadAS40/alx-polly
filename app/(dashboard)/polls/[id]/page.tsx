import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getPollWithVotes } from '@/app/lib/actions/poll-actions';
import PollCountdown from '@/components/PollCountdown';
import PollVotingInterface from '@/components/PollVotingInterface';

export default async function PollDetailPage({ params }: { params: { id: string } }) {
  const { poll, error } = await getPollWithVotes(params.id);

  if (error || !poll) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/polls" className="text-blue-600 hover:underline">
            &larr; Back to Polls
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error || 'Poll not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/polls/${params.id}/edit`}>Edit Poll</Link>
          </Button>
          <Button variant="outline" className="text-red-500 hover:text-red-700">
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
          {poll.expiresAt && (
            <div className="mt-2">
              <PollCountdown expiresAt={poll.expiresAt} />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.isExpired ? (
            <div className="space-y-4">
              <div className="text-center text-red-600 font-medium py-4 border border-red-200 rounded-md bg-red-50">
                This poll has expired and is no longer accepting votes.
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Final Results:</h3>
                {poll.options.map((option) => (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{option.text}</span>
                      <span>{getPercentage(option.votes)}% ({option.votes} votes)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${getPercentage(option.votes)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                <div className="text-sm text-slate-500 pt-2">
                  Total votes: {poll.totalVotes}
                </div>
              </div>
            </div>
          ) : (
            <PollVotingInterface poll={poll} />
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
          {poll.expiresAt && (
            <span>Expires on {poll.expiresAt.toLocaleDateString()}</span>
          )}
        </CardFooter>
      </Card>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Share this poll</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            Copy Link
          </Button>
          <Button variant="outline" className="flex-1">
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
}