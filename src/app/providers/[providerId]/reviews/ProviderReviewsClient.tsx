"use client";

import * as React from "react";
import type { ApiEnvelope } from "@/domain/api";
import type {
  PaginatedReviewsResponse,
  Review
} from "@/domain/reviews";
import {
  REVIEW_AUTHOR_NAME_MAX_LENGTH,
  REVIEW_BODY_MAX_LENGTH,
  REVIEW_TITLE_MAX_LENGTH,
  reviewCreateInputSchema
} from "@/domain/reviews";
import type { Provider } from "@/domain/providers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RatingInput } from "@/components/ui/RatingInput";
import { Textarea } from "@/components/ui/Textarea";

type ProviderReviewsClientProps = {
  provider: Provider;
};

type FieldErrors = Partial<
  Record<"rating" | "title" | "body" | "authorName", string>
>;

type FormState = {
  rating: number | null;
  title: string;
  body: string;
  authorName: string;
};

const initialFormState: FormState = {
  rating: null,
  title: "",
  body: "",
  authorName: ""
};

function getEndpoint(providerId: string, cursor?: string | null): string {
  const params = new URLSearchParams({ limit: "10" });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return `/api/providers/${encodeURIComponent(providerId)}/reviews?${params}`;
}

async function readEnvelopeData<T>(response: Response): Promise<T> {
  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || envelope.error) {
    const details = envelope.error?.details;
    const detailMessages = Array.isArray(details)
      ? details
          .map((detail) =>
            typeof detail === "object" &&
            detail !== null &&
            "message" in detail &&
            typeof detail.message === "string"
              ? detail.message
              : null
          )
          .filter((message): message is string => Boolean(message))
      : [];
    const message = envelope.error?.message ?? "Request failed.";

    throw new Error(
      detailMessages.length > 0
        ? `${message} ${detailMessages.join(" ")}`
        : message
    );
  }

  if (envelope.data === null) {
    throw new Error("Response did not include data.");
  }

  return envelope.data;
}

function getAverageRating(reviews: Review[]): string {
  if (reviews.length === 0) {
    return "No ratings yet";
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return `${(total / reviews.length).toFixed(1)} / 5`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function ReviewSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading reviews">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="neutral">{review.rating} / 5</Badge>
        <p className="text-sm text-slate-500">{formatDate(review.createdAt)}</p>
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-950">
        {review.title}
      </h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {review.body}
      </p>
      <p className="mt-3 text-sm font-medium text-slate-900">
        {review.authorName}
      </p>
    </article>
  );
}

export function ProviderReviewsClient({ provider }: ProviderReviewsClientProps) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isRefreshingAfterSubmit, setIsRefreshingAfterSubmit] =
    React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedReview, setSubmittedReview] = React.useState<Review | null>(
    null
  );

  const loadReviews = React.useCallback(
    async (cursor?: string | null) => {
      const response = await fetch(getEndpoint(provider.providerId, cursor), {
        cache: "no-store"
      });

      return readEnvelopeData<PaginatedReviewsResponse>(response);
    },
    [provider.providerId]
  );

  const loadInitialReviews = React.useCallback(async () => {
    setIsLoadingInitial(true);
    setListError(null);

    try {
      const data = await loadReviews();
      setReviews(data.reviews);
      setNextCursor(data.nextCursor);
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : "Could not load reviews."
      );
    } finally {
      setIsLoadingInitial(false);
    }
  }, [loadReviews]);

  React.useEffect(() => {
    void loadInitialReviews();
  }, [loadInitialReviews]);

  async function handleLoadMore() {
    if (!nextCursor) {
      return;
    }

    setIsLoadingMore(true);
    setListError(null);

    try {
      const data = await loadReviews(nextCursor);
      setReviews((currentReviews) => [...currentReviews, ...data.reviews]);
      setNextCursor(data.nextCursor);
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : "Could not load more reviews."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function refreshAfterSubmit(review: Review) {
    setSubmittedReview(review);
    setIsRefreshingAfterSubmit(true);
    setListError(null);

    try {
      const data = await loadReviews();
      setReviews(data.reviews);
      setNextCursor(data.nextCursor);
      setSubmittedReview(null);
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : "Could not refresh reviews."
      );
    } finally {
      setIsRefreshingAfterSubmit(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const parsedInput = reviewCreateInputSchema.safeParse({
      rating: form.rating,
      title: form.title,
      body: form.body,
      authorName: form.authorName
    });

    if (!parsedInput.success) {
      const nextFieldErrors: FieldErrors = {};

      for (const issue of parsedInput.error.issues) {
        const field = issue.path[0];

        if (
          typeof field === "string" &&
          ["rating", "title", "body", "authorName"].includes(field) &&
          !nextFieldErrors[field as keyof FieldErrors]
        ) {
          nextFieldErrors[field as keyof FieldErrors] =
            field === "rating" && form.rating === null
              ? "Rating is required."
              : issue.message;
        }
      }

      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/providers/${encodeURIComponent(provider.providerId)}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(parsedInput.data)
        }
      );
      const review = await readEnvelopeData<Review>(response);

      setForm(initialFormState);
      void refreshAfterSubmit(review);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not submit review."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleReviews =
    submittedReview &&
    !reviews.some((review) => review.reviewId === submittedReview.reviewId)
      ? [submittedReview, ...reviews]
      : reviews;
  const averageRating = getAverageRating(visibleReviews);
  const showEmptyState =
    !isLoadingInitial && !listError && visibleReviews.length === 0;
  const showPopulatedState = !isLoadingInitial && visibleReviews.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{provider.specialty}</Badge>
              <Badge variant="neutral">{provider.location}</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {provider.name}
              </h1>
              <p className="mt-2 text-slate-600">Patient reviews</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={visibleReviews.length > 0 ? "success" : "neutral"}>
                Average rating: {averageRating}
              </Badge>
              <span className="text-sm text-slate-500">
                {visibleReviews.length} review
                {visibleReviews.length === 1 ? "" : "s"}
              </span>
            </div>
          </header>

          <div className="space-y-4" aria-live="polite">
            {isLoadingInitial ? <ReviewSkeleton /> : null}

            {!isLoadingInitial && listError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">
                  Could not load reviews.
                </p>
                <p className="mt-1 text-sm text-red-700">{listError}</p>
                <Button
                  className="mt-3"
                  variant="secondary"
                  size="sm"
                  onClick={() => void loadInitialReviews()}
                >
                  Retry
                </Button>
              </div>
            ) : null}

            {isRefreshingAfterSubmit && submittedReview ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-950">
                  Your review was submitted.
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Refreshing the full review list now.
                </p>
              </div>
            ) : null}

            {showEmptyState ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <h2 className="text-base font-semibold text-slate-950">
                  No reviews yet
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Be the first to write a review for {provider.name}.
                </p>
              </div>
            ) : null}

            {showPopulatedState ? (
              <>
                <div className="space-y-3">
                  {visibleReviews.map((review) => (
                    <ReviewItem key={review.reviewId} review={review} />
                  ))}
                </div>

                {nextCursor ? (
                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      loading={isLoadingMore}
                      onClick={() => void handleLoadMore()}
                    >
                      Load more
                    </Button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </section>

        <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Write a review
          </h2>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <RatingInput
                value={form.rating}
                onChange={(rating) =>
                  setForm((currentForm) => ({ ...currentForm, rating }))
                }
                disabled={isSubmitting}
              />
              {fieldErrors.rating ? (
                <p className="mt-1.5 text-xs text-red-600" role="alert">
                  {fieldErrors.rating}
                </p>
              ) : null}
            </div>

            <Input
              label="Title"
              value={form.title}
              maxLength={REVIEW_TITLE_MAX_LENGTH}
              disabled={isSubmitting}
              error={fieldErrors.title}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  title: event.target.value
                }))
              }
            />

            <Textarea
              label="Review"
              value={form.body}
              maxLength={REVIEW_BODY_MAX_LENGTH}
              disabled={isSubmitting}
              error={fieldErrors.body}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  body: event.target.value
                }))
              }
            />

            <Input
              label="Your name"
              value={form.authorName}
              maxLength={REVIEW_AUTHOR_NAME_MAX_LENGTH}
              disabled={isSubmitting}
              error={fieldErrors.authorName}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  authorName: event.target.value
                }))
              }
            />

            {submitError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-900">
                  Could not submit review.
                </p>
                <p className="mt-1 text-sm text-red-700">{submitError}</p>
              </div>
            ) : null}

            <Button type="submit" loading={isSubmitting} className="w-full">
              Submit review
            </Button>
          </form>
        </aside>
      </div>
    </main>
  );
}
