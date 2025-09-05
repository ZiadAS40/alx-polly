'use client';

import PollCreateForm from "./PollCreateForm";

/**
 * Poll Creation Page
 * 
 * This client component provides the interface for creating new polls. It renders
 * a form that allows authenticated users to input poll questions and multiple
 * choice options. The actual form logic is handled by the PollCreateForm component.
 * 
 * Features:
 * - Clean, focused interface for poll creation
 * - Client-side interactivity for dynamic form handling
 * - Integration with poll creation server actions
 * - Form validation and error handling
 * 
 * @returns JSX element containing the poll creation interface
 */
export default function CreatePollPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create a New Poll</h1>
      <PollCreateForm />
    </main>
  );
}