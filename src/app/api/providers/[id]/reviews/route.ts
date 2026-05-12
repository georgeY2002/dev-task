import { NextResponse } from "next/server";
import type { ApiEnvelope } from "@/domain/api";
import {
  type PaginatedReviewsResponse,
  type Review,
  reviewCreateInputSchema
} from "@/domain/reviews";
import { getProviderByProviderId } from "@/domain/providers";
import {
  createReview,
  listReviews
} from "@/server/reviews/repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function success<T>(data: T, status: number): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(
    {
      data,
      error: null
    },
    { status }
  );
}

function failure(
  message: string,
  status: number,
  code?: string,
  details?: unknown
): NextResponse<ApiEnvelope<never>> {
  return NextResponse.json(
    {
      data: null,
      error: {
        message,
        ...(code ? { code } : {}),
        ...(details !== undefined ? { details } : {})
      }
    },
    { status }
  );
}

function parseLimit(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Limit must be a positive integer.");
  }

  return limit;
}

async function getProviderId({ params }: RouteContext): Promise<string> {
  const { id } = await params;

  return id;
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ApiEnvelope<PaginatedReviewsResponse>>> {
  const providerId = await getProviderId(context);

  if (!getProviderByProviderId(providerId)) {
    return failure("Provider not found.", 404, "PROVIDER_NOT_FOUND");
  }

  try {
    const { searchParams } = new URL(request.url);
    const reviews = await listReviews(providerId, {
      limit: parseLimit(searchParams.get("limit")),
      cursor: searchParams.get("cursor")
    });

    return success(reviews, 200);
  } catch (error) {
    if (error instanceof Error && error.message.includes("cursor")) {
      return failure(error.message, 400, "INVALID_CURSOR");
    }

    if (error instanceof Error && error.message.includes("Limit")) {
      return failure(error.message, 400, "INVALID_LIMIT");
    }

    console.error("Failed to list reviews", error);
    return failure("Unexpected error while listing reviews.", 500);
  }
}

export async function POST(
  request: Request,
  context: RouteContext
): Promise<NextResponse<ApiEnvelope<Review>>> {
  const providerId = await getProviderId(context);

  if (!getProviderByProviderId(providerId)) {
    return failure("Provider not found.", 404, "PROVIDER_NOT_FOUND");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return failure("Request body must be valid JSON.", 400, "INVALID_JSON");
  }

  const parsedBody = reviewCreateInputSchema.safeParse(body);

  if (!parsedBody.success) {
    return failure(
      "Review input is invalid.",
      400,
      "VALIDATION_ERROR",
      parsedBody.error.issues
    );
  }

  try {
    const review = await createReview(providerId, parsedBody.data);

    return success(review, 201);
  } catch (error) {
    console.error("Failed to create review", error);
    return failure("Unexpected error while creating review.", 500);
  }
}
