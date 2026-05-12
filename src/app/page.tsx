import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DEMO_PROVIDER_ID } from "@/lib/constants";

export default function HomePage() {
  const demoPath = `/providers/${DEMO_PROVIDER_ID}/reviews`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="space-y-5">
        <h1 className="text-3xl font-semibold tracking-tight">
          Provider Reviews Mini-Service
        </h1>
        <p className="text-slate-600">
          SyncRa take-home: project scaffold only. Reviews UI and APIs are
          added in later phases.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="primary">
            <Link href={demoPath}>Open demo provider page</Link>
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Or open{" "}
          <Link href={demoPath} className="font-medium text-slate-900 underline">
            {demoPath}
          </Link>{" "}
          directly.
        </p>
      </div>
    </main>
  );
}
