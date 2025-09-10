import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Poll } from '@/app/lib/types';

interface PollCardProps {
  poll: {
    id: string;
    question: string;
    options: any[];
    votes?: number;
    created_at: string | Date;
    expires_at?: string | null;
  };
}

export function PollCard({ poll }: PollCardProps) {
  const totalVotes = poll.votes || poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  const formattedDate = typeof poll.created_at === 'string' 
    ? new Date(poll.created_at).toLocaleDateString() 
    : poll.created_at.toLocaleDateString();

  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;

  return (
    <Link href={`/polls/${poll.id}`} className="group block h-full">
      <Card className={`h-full transition-all hover:shadow-md ${isExpired ? 'opacity-75' : ''}`}>
        <CardHeader>
          <CardTitle className="group-hover:text-blue-600 transition-colors">{poll.question}</CardTitle>
          {isExpired && (
            <CardDescription className="text-red-600 font-medium">
              Poll Expired
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500">
            <p>{poll.options.length} options</p>
            <p>{totalVotes} total votes</p>
            {poll.expires_at && !isExpired && (
              <p className="text-xs text-orange-600">
                Expires: {new Date(poll.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-slate-400">
          Created on {formattedDate}
        </CardFooter>
      </Card>
    </Link>
  );
}