"use client";

import { useState, useRef, useCallback } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { voteReview } from "@/app/actions/reviews";
import { initials } from "@/lib/utils";
import { timeAgo } from "@/lib/tools-data";
import { ReviewDialog } from "./review-dialog";
import type { ReviewData } from "@/lib/tools-data";

function ReviewCard({
  review,
  isAuthenticated,
}: {
  review: ReviewData;
  isAuthenticated: boolean;
}) {
  const [likes, setLikes] = useState(review.likes);
  const [dislikes, setDislikes] = useState(review.dislikes);
  const [userVote, setUserVote] = useState(review.userVote);
  const voteVersionRef = useRef(0);

  const handleVote = useCallback(
    async (vote: 1 | -1) => {
      if (!isAuthenticated) return;

      const prevVote = userVote;
      const prevLikes = likes;
      const prevDislikes = dislikes;

      let nextVote: number;
      let nextLikes = likes;
      let nextDislikes = dislikes;

      if (prevVote === vote) {
        nextVote = 0;
        if (vote === 1) nextLikes = likes - 1;
        else nextDislikes = dislikes - 1;
      } else {
        if (prevVote === 1) nextLikes = likes - 1;
        else if (prevVote === -1) nextDislikes = dislikes - 1;

        nextVote = vote;
        if (vote === 1) nextLikes = likes + 1;
        else nextDislikes = dislikes + 1;
      }

      setUserVote(nextVote);
      setLikes(nextLikes);
      setDislikes(nextDislikes);

      const version = ++voteVersionRef.current;
      try {
        const result = await voteReview(review.id, review.user.id, vote);
        if (version === voteVersionRef.current) {
          setLikes(result.likes);
          setDislikes(result.dislikes);
          setUserVote(result.userVote);
        }
      } catch (e) {
        if (version === voteVersionRef.current) {
          setLikes(prevLikes);
          setDislikes(prevDislikes);
          setUserVote(prevVote);
        }
        toast.error(
          e instanceof Error ? e.message : "Failed to record your vote",
        );
      }
    },
    [userVote, likes, dislikes, review.id, review.user.id, isAuthenticated],
  );

  const createdAt = Date.parse(review.createdAt);
  const relativeTime = isNaN(createdAt)
    ? ""
    : timeAgo(new Date(createdAt).toISOString());

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-xs font-bold text-foreground ring-1 ring-inset ring-border">
          {initials(review.user.name)}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">
            {review.user.name}
          </div>
          <div className="text-xs text-muted-foreground">{relativeTime}</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
        {review.content}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleVote(1)}
          disabled={!isAuthenticated}
          className={
            "inline-flex items-center gap-1.5 text-xs font-medium transition-colors " +
            (userVote === 1
              ? "text-secondary"
              : "text-muted-foreground hover:text-foreground") +
            (!isAuthenticated ? " opacity-50 cursor-not-allowed" : "")
          }
        >
          <ThumbsUp
            className={"size-3.5 " + (userVote === 1 ? "fill-current" : "")}
          />
          {likes}
        </button>

        <button
          type="button"
          onClick={() => handleVote(-1)}
          disabled={!isAuthenticated}
          className={
            "inline-flex items-center gap-1.5 text-xs font-medium transition-colors " +
            (userVote === -1
              ? "text-destructive"
              : "text-muted-foreground hover:text-foreground") +
            (!isAuthenticated ? " opacity-50 cursor-not-allowed" : "")
          }
        >
          <ThumbsDown
            className={"size-3.5 " + (userVote === -1 ? "fill-current" : "")}
          />
          {dislikes}
        </button>
      </div>
    </div>
  );
}

export function ReviewSection({
  toolSlug,
  initialReviews,
  isAuthenticated,
  voted,
  voteCount,
  onToolVote,
}: {
  toolSlug: string;
  initialReviews: ReviewData[];
  isAuthenticated: boolean;
  voted: boolean;
  voteCount: number;
  onToolVote: () => void;
}) {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSubmitted(review: ReviewData) {
    setReviews(prev => [review, ...prev]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Community
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToolVote}
            aria-pressed={voted}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
              (voted
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            <ThumbsUp className={"size-4 " + (voted ? "fill-current" : "")} />
            Useful
            <span className="tabular-nums">{voteCount}</span>
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-secondary/50"
            >
              <MessageSquare className="size-4" />
              Write a review
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-secondary/50"
            >
              <MessageSquare className="size-4" />
              Sign in to review
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to share your experience.
          </p>
        )}
        {reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      <ReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        toolSlug={toolSlug}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
