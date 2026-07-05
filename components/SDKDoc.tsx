import React from "react";
import { SDKDocTabs, SDKTab } from "./SDKDocTabs";
import { buildTypeScriptTab } from "./sdkdoc/typescript";
import { buildRustTab } from "./sdkdoc/rust";
import type { SDKBlockProps } from "./sdkdoc/types";

type SDKDocProps = {
  children?: React.ReactNode;
};

export function TypeScript(_props: SDKBlockProps) {
  return null;
}

export function Rust(_props: SDKBlockProps) {
  return null;
}

export function Api(_props: { name: string; children?: React.ReactNode }) {
  return null;
}

export function SDKDoc({ children }: SDKDocProps) {
  const tabs: Array<SDKTab> = [];

  const childArray = React.Children.toArray(children);
  const childTs = childArray.find(
    (child) => React.isValidElement(child) && child.type === TypeScript,
  );
  const childRust = childArray.find(
    (child) => React.isValidElement(child) && child.type === Rust,
  );
  const childApi = childArray.find(
    (child) => React.isValidElement(child) && child.type === Api,
  );

  if (childTs && React.isValidElement(childTs)) {
    const props = childTs.props as SDKBlockProps;
    tabs.push(buildTypeScriptTab(props));
  }

  if (childRust && React.isValidElement(childRust)) {
    const props = childRust.props as SDKBlockProps;
    tabs.push(buildRustTab(props));
  }

  if (childApi && React.isValidElement(childApi)) {
    const props = childApi.props as {
      name: string;
      children?: React.ReactNode;
    };
    tabs.push({
      label: "API",
      placeholder: true,
      example: props.children ? { content: props.children } : undefined,
    });
  }

  if (tabs.length === 0) {
    return <SDKDocTabs tabs={[]} />;
  }

  return <SDKDocTabs tabs={tabs} />;
}
