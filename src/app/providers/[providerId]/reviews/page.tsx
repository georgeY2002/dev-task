import { notFound } from "next/navigation";
import { getProviderByProviderId } from "@/domain/providers";
import { ProviderReviewsClient } from "./ProviderReviewsClient";

type PageProps = {
  params: Promise<{ providerId: string }>;
};

export default async function ProviderReviewsPage({ params }: PageProps) {
  const { providerId } = await params;
  const provider = getProviderByProviderId(providerId);

  if (!provider) {
    notFound();
  }

  return <ProviderReviewsClient provider={provider} />;
}
