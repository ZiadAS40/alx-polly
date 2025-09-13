"use client";

import { useState, useEffect } from 'react';
import { castVote, getPollResults, hasUserVoted } from './poll-client';
import { PollResults } from '@/app/lib/types';
import { Button } from '@/components/ui/button';

interface PollClientExampleProps {
  pollId: string;
}

/**
 * Example component demonstrating how to use the client-side poll functions
 * 
 * This component shows how to:
 * - Cast votes using the castVote function
 * - Retrieve poll results using the getPollResults function
 * - Check if a user has already voted using the hasUserVoted function
 */
export default function PollClientExample({ pollId }: PollClientExampleProps) {
  const [poll, setPoll] = useState<PollResults | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load poll data and check voting status on component mount
  useEffect(() => {
    loadPollData();
  }, [pollId]);

  const loadPollData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load poll results
      const { poll: pollData, error: pollError } = await getPollResults(pollId);
      if (pollError) {
        setError(pollError);
        return;
      }
      setPoll(pollData);

      // Check if user has already voted
      const { hasVoted: userHasVoted, error: voteCheckError } = await hasUserVoted(pollId);
      if (voteCheckError) {
        console.warn('Could not check voting status:', voteCheckError);
      }
      setHasVoted(userHasVoted);
    } catch (err) {
      setError('Failed to load poll data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null || !poll) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { success, error: voteError } = await castVote(pollId, selectedOption);
      
      if (success) {
        setHasVoted(true);
        // Reload poll data to show updated results
        await loadPollData();
      } else {
        setError(voteError || 'Failed to submit vote');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-slate-600">Loading poll...</div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600">{error || 'Poll not found'}</div>
        <Button onClick={loadPollData} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (poll.isExpired) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 font-medium mb-4">This poll has expired</div>
        <div className="space-y-4">
          <h3 className="font-medium">Final Results:</h3>
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{option.text}</span>
                <span>{option.percentage}% ({option.votes} votes)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${option.percentage}%` }}
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

  if (hasVoted) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center text-green-600 font-medium">
          Thank you for voting!
        </div>
        <div className="space-y-4">
          <h3 className="font-medium">Current Results:</h3>
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{option.text}</span>
                <span>{option.percentage}% ({option.votes} votes)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${option.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
          <div className="text-sm text-slate-500 pt-2">
            Total votes: {poll.totalVotes}
          </div>
        </div>
        <Button onClick={loadPollData} variant="outline" className="w-full">
          Refresh Results
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-medium">{poll.question}</h2>
      
      <div className="space-y-3">
        {poll.options.map((option, index) => (
          <div 
            key={option.id} 
            className={`p-3 border rounded-md cursor-pointer transition-colors ${
              selectedOption === index 
                ? 'border-blue-500 bg-blue-50' 
                : 'hover:bg-slate-50'
            }`}
            onClick={() => setSelectedOption(index)}
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
        disabled={selectedOption === null || isSubmitting} 
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Vote'}
      </Button>
    </div>
  );
}
