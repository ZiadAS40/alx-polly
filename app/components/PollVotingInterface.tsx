"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { submitVote } from '@/app/lib/actions/poll-actions';
import { PollWithVotes } from '@/app/lib/types';

interface PollVotingInterfaceProps {
  poll: PollWithVotes;
}

export default function PollVotingInterface({ poll }: PollVotingInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await submitVote(poll.id, parseInt(selectedOption));
      if (result.error) {
        setError(result.error);
      } else {
        setHasVoted(true);
        // Refresh the page to show updated results
        window.location.reload();
      }
    } catch (err) {
      setError('An error occurred while submitting your vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  if (hasVoted) {
    return (
      <div className="space-y-4">
        <div className="text-center text-green-600 font-medium py-2">
          Thank you for voting!
        </div>
        <div className="space-y-4">
          <h3 className="font-medium">Current Results:</h3>
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {poll.options.map((option, index) => (
          <div 
            key={option.id} 
            className={`p-3 border rounded-md cursor-pointer transition-colors ${
              selectedOption === index.toString() 
                ? 'border-blue-500 bg-blue-50' 
                : 'hover:bg-slate-50'
            }`}
            onClick={() => setSelectedOption(index.toString())}
          >
            {option.text}
          </div>
        ))}
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <Button 
        onClick={handleVote} 
        disabled={!selectedOption || isSubmitting} 
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Vote'}
      </Button>
    </div>
  );
}
