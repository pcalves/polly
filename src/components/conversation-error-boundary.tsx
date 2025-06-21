"use client";

import React from "react";
import { notFound } from "next/navigation";

interface ConversationErrorBoundaryState {
  hasError: boolean;
}

interface ConversationErrorBoundaryProps {
  children: React.ReactNode;
}

export class ConversationErrorBoundary extends React.Component<
  ConversationErrorBoundaryProps,
  ConversationErrorBoundaryState
> {
  constructor(props: ConversationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ConversationErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Conversation page error:", error);

    // If it's a Convex validation error or similar, treat as not found
    if (
      error.message.includes("ArgumentValidationError") ||
      error.message.includes("Value does not match validator") ||
      error.message.includes("v.id(")
    ) {
      // Redirect to not found page
      notFound();
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI for other types of errors
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load this conversation.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
