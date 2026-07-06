"use client";

import { Callout, Tabs } from "nextra/components";

export type SDKTab = {
  label: string;
  description?: React.ReactNode;
  heading?: string;
  content?: React.ReactNode;
  placeholder?: boolean;
  link?: string;
  example?: { content?: React.ReactNode };
};

type SDKDocTabsProps = {
  tabs: SDKTab[];
};

function Placeholder({ label }: { label: string }) {
  return (
    <Callout type="info">Remote {label} docs URL not configured yet.</Callout>
  );
}

export function SDKDocTabs({ tabs }: SDKDocTabsProps) {
  if (!tabs.length) {
    return (
      <Callout type="warning">No SDK documentation sources provided.</Callout>
    );
  }

  return (
    <Tabs items={tabs.map((tab) => tab.label)} storageKey="sdk-tabs">
      {tabs.map((tab) => (
        <Tabs.Tab key={tab.label} title={tab.label}>
          {tab.example ? <div>{tab.example.content}</div> : null}
          {tab.heading || tab.description || tab.content ? (
            <details className="x:not-first:mt-4 x:rounded x:border x:border-gray-200 x:bg-white x:p-2 x:shadow-sm x:dark:border-neutral-800 x:dark:bg-neutral-900 x:overflow-hidden">
              {tab.heading ? (
                <summary className="x:focus-visible:nextra-focus x:cursor-pointer x:transition-colors x:hover:bg-gray-100 x:dark:hover:bg-neutral-800 x:select-none x:rounded x:[&::-webkit-details-marker]:hidden x:flex x:items-center">
                  <svg
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none"
                    stroke-width="3"
                    height="1em"
                    className="x:motion-reduce:transition-none x:ms-2 x:me-1 x:shrink-0 x:rtl:rotate-180 x:[[data-expanded]&gt;summary:first-child&gt;&amp;]:rotate-90 x:transition"
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      strokeLinecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                  <div className="x:flex x:flex-wrap x:items-center x:gap-3">
                    <code className="nextra-code x:max-md:break-all">
                      {tab.heading}
                    </code>
                    {tab.link ? (
                      <a
                        href={tab.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Reference ↗
                      </a>
                    ) : null}
                  </div>
                </summary>
              ) : null}
              {tab.description ? <i>{tab.description}</i> : null}
              {tab.content ??
                (tab.placeholder ? <Placeholder label={tab.label} /> : null)}
            </details>
          ) : null}
        </Tabs.Tab>
      ))}
    </Tabs>
  );
}
