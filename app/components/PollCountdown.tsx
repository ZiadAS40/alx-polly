"use client";

import { useState, useEffect } from "react";

interface PollCountdownProps {
  expiresAt: Date;
  onExpired?: () => void;
}

export default function PollCountdown({ expiresAt, onExpired }: PollCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expirationTime = expiresAt.getTime();
      const difference = expirationTime - now;

      if (difference <= 0) {
        setTimeLeft(null);
        onExpired?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  if (!timeLeft) {
    return (
      <div className="text-red-600 font-medium">
        Poll has expired
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <div className="text-sm text-gray-600">
      <span className="font-medium">Time remaining:</span>{" "}
      {days > 0 && `${days}d `}
      {hours > 0 && `${hours}h `}
      {minutes > 0 && `${minutes}m `}
      {seconds}s
    </div>
  );
}
