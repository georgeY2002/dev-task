import { z } from "zod";

export const REVIEW_TITLE_MAX_LENGTH = 120;
export const REVIEW_BODY_MAX_LENGTH = 2_000;
export const REVIEW_AUTHOR_NAME_MAX_LENGTH = 80;

export const reviewCreateInputSchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating must be at most 5."),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(
      REVIEW_TITLE_MAX_LENGTH,
      `Title must be ${REVIEW_TITLE_MAX_LENGTH} characters or fewer.`
    ),
  body: z
    .string()
    .trim()
    .min(1, "Review body is required.")
    .max(
      REVIEW_BODY_MAX_LENGTH,
      `Review body must be ${REVIEW_BODY_MAX_LENGTH} characters or fewer.`
    ),
  authorName: z
    .string()
    .trim()
    .min(1, "Author name is required.")
    .max(
      REVIEW_AUTHOR_NAME_MAX_LENGTH,
      `Author name must be ${REVIEW_AUTHOR_NAME_MAX_LENGTH} characters or fewer.`
    )
});

export type ReviewCreateInput = z.infer<typeof reviewCreateInputSchema>;

export type Review = ReviewCreateInput & {
  reviewId: string;
  providerId: string;
  createdAt: string;
};

export type PaginatedReviewsResponse = {
  reviews: Review[];
  nextCursor: string | null;
};
