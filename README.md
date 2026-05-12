# Provider Reviews Mini-Service

Live URL: `http://3.254.61.209/providers/demo-001/reviews`

GitHub repo: `https://github.com/<your-username>/<your-repo>`

## Project Overview

This is a small provider reviews application built for a take-home assignment.
Users can open a provider reviews page, view existing reviews, see the average
rating, submit a new review, and load additional reviews through cursor-based
pagination. The app uses a hardcoded provider seed and stores reviews in
DynamoDB with a single-table key design.

## Tech Stack

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- Zod for shared client/server validation
- AWS SDK v3 DynamoDB DocumentClient
- DynamoDB on-demand table
- Docker standalone Next.js image
- AWS ECR and App Runner for deployment

## Local Setup

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/providers/demo-001/reviews
```

Useful scripts:

```bash
npm run build
npm run start
npm run typecheck
```

When `AWS_REGION` and `TABLE_NAME` are not set in non-production mode, the app
uses an in-memory development fallback so the UI can be tested without AWS. Set
both variables to use DynamoDB locally.

## Local Docker Setup

Build the production image:

```bash
docker build -t provider-reviews-mini-service .
```

Run the container:

```bash
docker run --rm -p 3000:3000 \
  -e AWS_REGION=eu-north-1 \
  -e TABLE_NAME=provider-reviews \
  provider-reviews-mini-service
```

If port `3000` is already in use:

```bash
docker run --rm -p 3001:3000 \
  -e AWS_REGION=eu-north-1 \
  -e TABLE_NAME=provider-reviews \
  provider-reviews-mini-service
```

Open `http://localhost:3001/providers/demo-001/reviews`.

For local Docker access to AWS using your local AWS CLI credentials:

```bash
docker run --rm -p 3001:3000 \
  -e AWS_REGION=eu-north-1 \
  -e TABLE_NAME=provider-reviews \
  -v ~/.aws:/home/nextjs/.aws:ro \
  provider-reviews-mini-service
```

## Environment Variables

| Variable     | Required in production | Description                      |
|--------------|------------------------|----------------------------------|
| `AWS_REGION` | Yes                    | AWS region for DynamoDB          |
| `TABLE_NAME` | Yes                    | DynamoDB table name              |

Example:

```bash
AWS_REGION=eu-north-1
TABLE_NAME=provider-reviews
```

## DynamoDB Table Setup

AWS CLI is used because the infrastructure for this assignment is intentionally
small: one DynamoDB table with on-demand billing and a composite primary key.
Using CDK/Terraform/CloudFormation would be reasonable for a larger system, but
it would add unnecessary setup for this take-home.

Create the table:

```bash
aws dynamodb create-table \
  --table-name provider-reviews \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --region eu-north-1
```

Or run the helper script:

```bash
AWS_REGION=eu-north-1 TABLE_NAME=provider-reviews ./scripts/create-dynamodb-table.sh
```

Wait for the table:

```bash
aws dynamodb wait table-exists \
  --table-name provider-reviews \
  --region eu-north-1
```

Verify the table:

```bash
aws dynamodb describe-table \
  --table-name provider-reviews \
  --region eu-north-1 \
  --query 'Table.{TableName:TableName,Status:TableStatus,BillingMode:BillingModeSummary.BillingMode,KeySchema:KeySchema}'
```

## AWS Deployment

Deployment uses AWS App Runner because it is simpler than ECS for a small public
containerized app. App Runner can pull the image from ECR, run the container,
manage HTTPS, and provide a public URL without requiring ECS clusters, services,
load balancers, or target groups. App Runner is not available in `eu-north-1`,
so these steps run App Runner and ECR in `eu-west-1` while the app still points
to the DynamoDB table in `eu-north-1`.

Set variables:

```bash
export APP_RUNNER_REGION=eu-west-1
export DDB_REGION=eu-north-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=provider-reviews-mini-service
export IMAGE_TAG=latest
```

Create ECR repository:

```bash
aws ecr create-repository \
  --repository-name "$ECR_REPOSITORY" \
  --region "$APP_RUNNER_REGION"
```

Log Docker into ECR:

```bash
aws ecr get-login-password --region "$APP_RUNNER_REGION" \
  | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$APP_RUNNER_REGION.amazonaws.com"
```

Build, tag, and push:

```bash
docker build -t "$ECR_REPOSITORY:$IMAGE_TAG" .

docker tag "$ECR_REPOSITORY:$IMAGE_TAG" \
  "$AWS_ACCOUNT_ID.dkr.ecr.$APP_RUNNER_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"

docker push "$AWS_ACCOUNT_ID.dkr.ecr.$APP_RUNNER_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
```

Create the App Runner instance role trust policy:

```bash
cat > /tmp/apprunner-instance-trust-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
JSON
```

Create the role:

```bash
aws iam create-role \
  --role-name provider-reviews-apprunner-instance-role \
  --assume-role-policy-document file:///tmp/apprunner-instance-trust-policy.json
```

Create and attach the scoped DynamoDB policy:

```bash
sed \
  -e "s/<region>/$DDB_REGION/g" \
  -e "s/<account-id>/$AWS_ACCOUNT_ID/g" \
  infra/iam/apprunner-dynamodb-policy.json \
  > /tmp/provider-reviews-dynamodb-policy.json

aws iam create-policy \
  --policy-name provider-reviews-dynamodb-policy \
  --policy-document file:///tmp/provider-reviews-dynamodb-policy.json

aws iam attach-role-policy \
  --role-name provider-reviews-apprunner-instance-role \
  --policy-arn "arn:aws:iam::$AWS_ACCOUNT_ID:policy/provider-reviews-dynamodb-policy"
```

Create the App Runner service in the AWS Console:

1. Open App Runner in `eu-west-1`.
2. Choose **Create service**.
3. Source: **Container registry**.
4. Provider: **Amazon ECR**.
5. Select the pushed image.
6. Set port to `3000`.
7. Add environment variables:
   - `AWS_REGION=eu-north-1`
   - `TABLE_NAME=provider-reviews`
8. Select instance role `provider-reviews-apprunner-instance-role`.
9. Let App Runner create or use an ECR access role if prompted.
10. Create and deploy the service.

Check the live URL:

```text
https://<app-runner-default-domain>/providers/demo-001/reviews
```

Submit a review and refresh the page. The review should persist because the
container is using DynamoDB.

## API Documentation

All API responses use this envelope:

```ts
type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string; details?: unknown } };
```

### List Reviews

```http
GET /api/providers/:id/reviews?limit=10&cursor=<nextCursor>
```

Success status: `200`

Response:

```json
{
  "data": {
    "reviews": [
      {
        "reviewId": "uuid",
        "providerId": "demo-001",
        "rating": 5,
        "title": "Excellent visit",
        "body": "Clear and helpful.",
        "authorName": "George",
        "createdAt": "2026-05-12T13:53:06.095Z"
      }
    ],
    "nextCursor": null
  },
  "error": null
}
```

### Create Review

```http
POST /api/providers/:id/reviews
Content-Type: application/json
```

Request:

```json
{
  "rating": 5,
  "title": "Excellent visit",
  "body": "Clear and helpful.",
  "authorName": "George"
}
```

Success status: `201`

Validation failures return `400`, unknown providers return `404`, and unexpected
errors return `500`.

## Data Model

Providers are hardcoded in the shared domain layer. Reviews are stored in one
DynamoDB table using this single-table key shape:

| Attribute | Value pattern                         | Purpose                         |
|-----------|---------------------------------------|---------------------------------|
| `pk`      | `PROVIDER#<providerId>`               | Provider review partition       |
| `sk`      | `REVIEW#<isoTimestamp>#<reviewId>`    | Chronological review sort key   |

Stored review attributes:

- `reviewId`
- `providerId`
- `rating`
- `title`
- `body`
- `authorName`
- `createdAt`

Reads use `QueryCommand` by `pk` with `ScanIndexForward: false`, so reviews are
returned newest-first. Pagination uses DynamoDB `LastEvaluatedKey`, encoded as a
base64 cursor and passed back as `ExclusiveStartKey`.

## IAM Policy Explanation

The App Runner instance role policy lives at
`infra/iam/apprunner-dynamodb-policy.json`.

It is scoped to one table ARN:

```text
arn:aws:dynamodb:<region>:<account-id>:table/provider-reviews
```

The app only needs:

- `dynamodb:PutItem` to create reviews
- `dynamodb:Query` to list reviews by provider

The policy intentionally avoids wildcard DynamoDB actions and wildcard
resources.

## Assignment Checklist

- [x] Next.js App Router project implemented.
- [x] Shared provider and review domain types added.
- [x] Exactly three hardcoded providers added.
- [x] Shared Zod validation added for review creation.
- [x] DynamoDB DocumentClient helper added.
- [x] Single-table DynamoDB review repository added.
- [x] Review storage uses `pk = PROVIDER#<providerId>`.
- [x] Review storage uses `sk = REVIEW#<isoTimestamp>#<reviewId>`.
- [x] Review IDs use `crypto.randomUUID()`.
- [x] Review timestamps use ISO strings.
- [x] List reviews uses `QueryCommand`, not table-wide reads.
- [x] Cursor pagination uses base64-encoded DynamoDB keys.
- [x] API route handlers added for GET and POST reviews.
- [x] API validates provider IDs against the hardcoded provider seed.
- [x] API validates POST bodies with the shared Zod schema.
- [x] API uses the required `{ data, error }` envelope.
- [x] Provider reviews page implemented.
- [x] Page shows provider name, average rating, reviews, and form.
- [x] UI includes loading, empty, error/retry, partial submit refresh, and populated states.
- [x] Client-side Zod validation runs before submit.
- [x] Pagination UI supports `nextCursor` with a Load more button.
- [x] Production Dockerfile added with `deps`, `build`, and `runner` stages.
- [x] `.dockerignore` added.
- [x] DynamoDB table setup documented with AWS CLI.
- [x] App Runner deployment documented with ECR.
- [x] Scoped IAM policy added for DynamoDB access.

## Manual Test Cases

1. Provider with no reviews
   - Use an empty DynamoDB table or provider with no reviews.
   - Open `/providers/demo-001/reviews`.
   - Expected: empty state appears and average rating says no ratings yet.

2. Create valid review
   - Open `/providers/demo-001/reviews`.
   - Select a rating, enter title, body, and author name.
   - Submit.
   - Expected: request succeeds, review appears, average rating updates, and review persists after refresh.

3. Invalid rating
   - Submit with no rating selected.
   - Expected: client validation shows a rating error and no request is sent.

4. Missing title, body, or author
   - Submit with one or more required text fields empty.
   - Expected: client validation shows field errors.

5. Pagination
   - Create more than 10 reviews for `demo-001`.
   - Open the reviews page.
   - Expected: first page loads with a **Load more** button.
   - Click **Load more**.
   - Expected: more reviews append and the button disappears when `nextCursor` is `null`.

6. Provider not found
   - Open `/providers/not-real/reviews`.
   - Expected: Next.js not-found page.
   - Call `/api/providers/not-real/reviews`.
   - Expected: `404` response with `{ data: null, error: { message, code } }`.

## Improvements With More Time

I would add automated integration tests around the API routes and repository,
using a local DynamoDB test instance or mocked AWS SDK client. I would add
observability around failed DynamoDB calls and App Runner request logs so
production debugging is faster. I would also add CI to run typecheck, build,
and targeted tests on every pull request.

## Hours Spent

Estimated: 8 hours.
