"use client";

import { useState } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PollCreateForm() {
  const [options, setOptions] = useState(["", ""]);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  const addOption = () => setOptions((opts) => [...opts, ""]);
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <CardDescription>
          Create a poll to gather opinions from your audience. You can optionally set an expiration date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            setError(null);
            setSuccess(false);
            if (expiresAt) {
              formData.set('expiresAt', expiresAt);
            }
            const res = await createPoll(formData);
            if (res?.error) {
              setError(res.error);
            } else {
              setSuccess(true);
              setTimeout(() => {
                window.location.href = "/polls";
              }, 1200);
            }
          }}
          className="space-y-6"
        >
          <div>
            <Label htmlFor="question">Poll Question</Label>
            <Input name="question" id="question" required placeholder="What would you like to ask?" />
          </div>
          
          <div>
            <Label>Options</Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <Input
                  name="options"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  required
                  placeholder={`Option ${idx + 1}`}
                />
                {options.length > 2 && (
                  <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" onClick={addOption} variant="secondary">
              Add Option
            </Button>
          </div>

          <div>
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              type="datetime-local"
              id="expiresAt"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty for no expiration. Poll will automatically close at the specified time.
            </p>
          </div>

          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-600">Poll created! Redirecting...</div>}
          
          <Button type="submit" className="w-full">Create Poll</Button>
        </form>
      </CardContent>
    </Card>
  );
} 