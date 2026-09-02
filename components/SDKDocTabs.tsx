"use client";

import { Callout } from "fumadocs-ui/components/callout";
import { Tabs, Tab } from "fumadocs-ui/components/tabs";

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
    <Tabs items={tabs.map((tab) => tab.label)}>
      {tabs.map((tab) => (
        <Tab key={tab.label} value={tab.label}>
          {tab.example ? <div>{tab.example.content}</div> : null}
          {tab.heading || tab.description || tab.content ? (
            <details className="">
              {tab.heading ? (
                <summary className="">
                  <svg
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="3"
                    height="1em"
                    className=";summary:first-child&gt;&amp;]:rotate-90 "
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  <div className="">
                    <code className="fd-code ">
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
        </Tab>
      ))}
    </Tabs>
  );
}
