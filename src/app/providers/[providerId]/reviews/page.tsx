type PageProps = {
  params: Promise<{ providerId: string }>;
};

export default async function ProviderReviewsPlaceholderPage({
  params
}: PageProps) {
  const { providerId } = await params;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Provider reviews
      </h1>
      <p className="mt-2 text-slate-600">
        Placeholder for provider{" "}
        <span className="font-mono text-slate-900">{providerId}</span>. The
        reviews feature is not implemented in this phase.
      </p>
    </main>
  );
}
