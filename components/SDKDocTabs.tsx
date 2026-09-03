"use client";

import { Callout } from "fumadocs-ui/components/callout";
import { Tabs, Tab } from "fumadocs-ui/components/tabs";
import { Accordions, Accordion } from "fumadocs-ui/components/accordion";

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
            // A hand-rolled <details>/<summary> used to live here, copied from
            // fumadocs' own rendered accordion markup with the arrow-variant
            // class HTML-escaped in transit ("&gt;"/"&amp;" instead of ">"/"&"),
            // so it never matched and the rotation never applied. On top of
            // that, nothing suppressed the browser's native <summary> marker,
            // so readers saw that plus the dead custom arrow stacked on top of
            // each other. Real Accordion component, one icon, one owner.
            <Accordions type="single">
              <Accordion
                value={tab.heading ?? tab.label}
                title={
                  tab.heading ? (
                    <span className="flex flex-1 items-center justify-between gap-2">
                      <code className="fd-code">{tab.heading}</code>
                      {tab.link ? (
                        <a
                          href={tab.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-fd-muted-foreground text-xs font-normal hover:text-fd-foreground"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Reference ↗
                        </a>
                      ) : null}
                    </span>
                  ) : (
                    tab.label
                  )
                }
              >
                {tab.description ? <i>{tab.description}</i> : null}
                {tab.content ??
                  (tab.placeholder ? <Placeholder label={tab.label} /> : null)}
              </Accordion>
            </Accordions>
          ) : null}
        </Tab>
      ))}
    </Tabs>
  );
}
