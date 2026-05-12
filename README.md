# Provider Reviews Mini-Service (SyncRa)

## Overview

Next.js App Router app for a small **provider reviews** experience: patients can submit and read reviews for a provider. This repository is being built in phases; later work will add DynamoDB, API routes, and the full reviews UI.

## Tech stack

- Next.js (App Router), **TypeScript strict**, React
- Tailwind CSS
- Zod
- AWS DynamoDB via DocumentClient

## Local setup

1. Install dependencies: `npm install`
2. Run the dev server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## Local Docker

Build the production image:

```bash
docker build -t provider-reviews-mini-service .
```

Run the production Next.js server:

```bash
docker run --rm -p 3000:3000 \
  -e AWS_REGION=us-east-1 \
  -e TABLE_NAME=provider-reviews \
  provider-reviews-mini-service
```

Open [http://localhost:3000](http://localhost:3000). The container expects AWS
credentials to be provided by the runtime environment when it needs to access
DynamoDB.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values when you connect AWS (later phases).

| Variable     | Description                          |
|-------------|--------------------------------------|
| `AWS_REGION`| AWS region for DynamoDB              |
| `TABLE_NAME`| Single-table DynamoDB table name     |

## DynamoDB Table Setup

This project uses the AWS CLI for DynamoDB table setup because the required
infrastructure is intentionally small: one on-demand table with a composite
primary key. A full IaC stack would add more process than value for this
take-home phase.

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
  --region us-east-1
```

Or run the helper script:

```bash
AWS_REGION=us-east-1 TABLE_NAME=provider-reviews ./scripts/create-dynamodb-table.sh
```

Wait for the table to become active:

```bash
aws dynamodb wait table-exists \
  --table-name provider-reviews \
  --region us-east-1
```

Verify the table exists:

```bash
aws dynamodb describe-table \
  --table-name provider-reviews \
  --region us-east-1 \
  --query 'Table.{TableName:TableName,Status:TableStatus,BillingMode:BillingModeSummary.BillingMode,KeySchema:KeySchema}'
```

The application accesses reviews with keyed DynamoDB queries by `pk`; it does
not perform table-wide reads.

## Deployment

Use AWS App Runner for this take-home deployment. It is simpler than ECS for a
small public containerized web app: App Runner can pull from ECR, run the
container, manage HTTPS, and provide a public URL without requiring cluster,
load balancer, or service networking setup.

These examples use `eu-north-1` and `provider-reviews`. Change them if your
DynamoDB table uses a different region or table name.

### 1. Confirm the DynamoDB table

```bash
aws dynamodb describe-table \
  --table-name provider-reviews \
  --region eu-north-1 \
  --query 'Table.{TableName:TableName,Status:TableStatus}'
```

The status should be `ACTIVE`.

### 2. Build and push the image to ECR

Set deployment variables:

```bash
export AWS_REGION=eu-north-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPOSITORY=provider-reviews-mini-service
export IMAGE_TAG=latest
```

Create an ECR repository:

```bash
aws ecr create-repository \
  --repository-name "$ECR_REPOSITORY" \
  --region "$AWS_REGION"
```

Authenticate Docker to ECR:

```bash
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
```

Build, tag, and push:

```bash
docker build -t "$ECR_REPOSITORY:$IMAGE_TAG" .

docker tag "$ECR_REPOSITORY:$IMAGE_TAG" \
  "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"

docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
```

### 3. Create the App Runner instance role

The running container only needs to write reviews and query reviews from one
DynamoDB table. The policy template is in
`infra/iam/apprunner-dynamodb-policy.json`; replace `<region>` and
`<account-id>` with your values before attaching it.

Create a trust policy file locally:

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

Create a scoped DynamoDB policy from the template:

```bash
sed \
  -e "s/<region>/$AWS_REGION/g" \
  -e "s/<account-id>/$AWS_ACCOUNT_ID/g" \
  infra/iam/apprunner-dynamodb-policy.json \
  > /tmp/provider-reviews-dynamodb-policy.json

aws iam create-policy \
  --policy-name provider-reviews-dynamodb-policy \
  --policy-document file:///tmp/provider-reviews-dynamodb-policy.json
```

Attach it to the role:

```bash
aws iam attach-role-policy \
  --role-name provider-reviews-apprunner-instance-role \
  --policy-arn "arn:aws:iam::$AWS_ACCOUNT_ID:policy/provider-reviews-dynamodb-policy"
```

This policy is scoped to the specific table ARN and only allows:

- `dynamodb:PutItem`
- `dynamodb:Query`

It does not grant wildcard DynamoDB access.

### 4. Create the App Runner service

In the AWS Console:

1. Open **App Runner** in the same region as the table.
2. Choose **Create service**.
3. Source: **Container registry**.
4. Provider: **Amazon ECR**.
5. Select the ECR image you pushed.
6. Deployment trigger: choose manual or automatic.
7. Port: `3000`.
8. Runtime environment variables:
   - `AWS_REGION=eu-north-1`
   - `TABLE_NAME=provider-reviews`
9. Security configuration / instance role:
   - `provider-reviews-apprunner-instance-role`
10. Create and deploy the service.

App Runner also needs permission to pull from ECR. If the console prompts for an
ECR access role, let App Runner create the service-linked/access role, or choose
an existing App Runner ECR access role.

### 5. Check the live URL

When deployment finishes, open the App Runner default domain shown in the
service details. Test the app at:

```text
https://<app-runner-default-domain>/providers/demo-001/reviews
```

Submit a review, refresh the page, and confirm the review persists. If the page
shows an API error, check the App Runner logs and confirm the service has:

- `AWS_REGION` matching the DynamoDB table region
- `TABLE_NAME=provider-reviews`
- the instance role with the scoped DynamoDB policy attached

## Improvements with more time

- Full reviews list and create flow with `{ data, error }` API envelope
- Single-table DynamoDB design with keyed reads by `pk` only
- Tests and CI, observability, and stricter production hardening

## Hours spent

_(Fill in after you finish the take-home.)_
