import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  type PaginatedReviewsResponse,
  type Review,
  type ReviewCreateInput,
  reviewCreateInputSchema
} from "@/domain/reviews";
import {
  getDynamoDocumentClient,
  getTableName
} from "@/server/dynamodb/client";

const DEFAULT_REVIEW_LIMIT = 20;
const MAX_REVIEW_LIMIT = 100;

type ReviewItem = Review & {
  pk: string;
  sk: string;
};

type ReviewKey = Pick<ReviewItem, "pk" | "sk">;

export type ListReviewsOptions = {
  limit?: number;
  cursor?: string | null;
};

function getProviderPk(providerId: string): string {
  return `PROVIDER#${providerId}`;
}

function getReviewSk(createdAt: string, reviewId: string): string {
  return `REVIEW#${createdAt}#${reviewId}`;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_REVIEW_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_REVIEW_LIMIT);
}

function encodeCursor(lastEvaluatedKey?: Record<string, unknown>): string | null {
  if (!lastEvaluatedKey) {
    return null;
  }

  return Buffer.from(JSON.stringify(lastEvaluatedKey), "utf8").toString("base64");
}

function decodeCursor(
  cursor: string | null | undefined,
  expectedPk: string
): ReviewKey | undefined {
  if (!cursor) {
    return undefined;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
  } catch {
    throw new Error("Invalid reviews pagination cursor.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("pk" in parsed) ||
    !("sk" in parsed) ||
    typeof parsed.pk !== "string" ||
    typeof parsed.sk !== "string"
  ) {
    throw new Error("Invalid reviews pagination cursor.");
  }

  if (parsed.pk !== expectedPk) {
    throw new Error("Reviews pagination cursor does not match provider.");
  }

  return {
    pk: parsed.pk,
    sk: parsed.sk
  };
}

function toReview(item: Record<string, unknown>): Review {
  return {
    reviewId: String(item.reviewId),
    providerId: String(item.providerId),
    rating: Number(item.rating),
    title: String(item.title),
    body: String(item.body),
    authorName: String(item.authorName),
    createdAt: String(item.createdAt)
  };
}

export async function createReview(
  providerId: string,
  input: ReviewCreateInput
): Promise<Review> {
  const parsedInput = reviewCreateInputSchema.parse(input);
  const reviewId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const review: Review = {
    reviewId,
    providerId,
    createdAt,
    ...parsedInput
  };
  const item: ReviewItem = {
    pk: getProviderPk(providerId),
    sk: getReviewSk(createdAt, reviewId),
    ...review
  };

  await getDynamoDocumentClient().send(
    new PutCommand({
      TableName: getTableName(),
      Item: item
    })
  );

  return review;
}

export async function listReviews(
  providerId: string,
  options: ListReviewsOptions = {}
): Promise<PaginatedReviewsResponse> {
  const providerPk = getProviderPk(providerId);

  const result = await getDynamoDocumentClient().send(
    new QueryCommand({
      TableName: getTableName(),
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :reviewPrefix)",
      ExpressionAttributeValues: {
        ":pk": providerPk,
        ":reviewPrefix": "REVIEW#"
      },
      Limit: normalizeLimit(options.limit),
      ExclusiveStartKey: decodeCursor(options.cursor, providerPk),
      ScanIndexForward: false
    })
  );

  return {
    reviews: (result.Items ?? []).map(toReview),
    nextCursor: encodeCursor(result.LastEvaluatedKey)
  };
}
