import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let documentClient: DynamoDBDocumentClient | null = null;

function getRequiredEnv(name: "AWS_REGION" | "TABLE_NAME"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

export function getTableName(): string {
  return getRequiredEnv("TABLE_NAME");
}

export function getDynamoDocumentClient(): DynamoDBDocumentClient {
  if (!documentClient) {
    documentClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: getRequiredEnv("AWS_REGION")
      }),
      {
        marshallOptions: {
          removeUndefinedValues: true
        }
      }
    );
  }

  return documentClient;
}
