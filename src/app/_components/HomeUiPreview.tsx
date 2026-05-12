"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Input,
  RatingInput,
  Textarea
} from "@/components/ui";

export function HomeUiPreview() {
  const [rating, setRating] = React.useState<number | null>(3);
  const [loadingDemo, setLoadingDemo] = React.useState(false);

  return (
    <section
      className="mt-12 rounded-lg border border-slate-200 bg-slate-50/80 p-6"
      aria-labelledby="ui-preview-heading"
    >
      <h2
        id="ui-preview-heading"
        className="text-lg font-semibold text-slate-900"
      >
        UI components (preview)
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Smoke-test for this phase only; not the final reviews layout.
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>New</Badge>
            <Badge variant="success">Posted</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="neutral">Info</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button">Default</Button>
            <Button type="button" variant="secondary">
              Secondary
            </Button>
            <Button
              type="button"
              loading={loadingDemo}
              onClick={() => {
                setLoadingDemo(true);
                window.setTimeout(() => setLoadingDemo(false), 1200);
              }}
            >
              Loading demo
            </Button>
            <Button type="button" disabled>
              Disabled
            </Button>
          </div>
          <RatingInput
            value={rating}
            onChange={setRating}
            label="Rating input"
          />
          <RatingInput
            value={2}
            onChange={() => {}}
            loading
            label="Rating (loading)"
          />
        </div>
        <div className="space-y-4">
          <Input
            label="Name"
            name="preview-name"
            placeholder="Jane Doe"
            autoComplete="off"
          />
          <Input
            label="With error"
            name="preview-error"
            defaultValue="bad"
            error="This field has an example error."
          />
          <Input label="Disabled" name="preview-dis" disabled defaultValue="—" />
          <Textarea
            label="Comment"
            name="preview-body"
            placeholder="Write something…"
          />
          <Textarea
            label="Disabled textarea"
            name="preview-ta-dis"
            disabled
            defaultValue="Read only for this demo."
          />
        </div>
      </div>
    </section>
  );
}
