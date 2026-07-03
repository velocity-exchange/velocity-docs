import React from "react";
import { Callout } from "nextra/components";
import { generateDefinition, TypeField, Tags } from "nextra/tsdoc";
import type { SDKTab } from "../SDKDocTabs";
import type { SDKBlockProps } from "./types";

// TODO(open-question): provisional until final TypeDoc host is confirmed.
const SDK_BASE_URL = "https://velocity-exchange.github.io/velocity-v1/sdk";
const JSDOC_LINK_RE = /{@link ([^}]*)}/g;

type TsDocDefinition = ReturnType<typeof generateDefinition>;

function sanitizeDocText(text?: string) {
  if (!text) return text;
  return (
    text
      .replace(JSDOC_LINK_RE, "$1")
      // Prevent MDX expression parsing on stray braces.
      .replaceAll("{", "&#123;")
      .replaceAll("}", "&#125;")
  );
}

function sanitizeTags(tags?: Record<string, string>) {
  if (!tags) return tags;
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    next[key] = sanitizeDocText(value) ?? value;
  }
  return next;
}

function sanitizeDefinition<T extends TsDocDefinition>(definition: T) {
  if (!definition) return definition;
  const next = {
    ...definition,
    description: sanitizeDocText(definition.description),
    tags: sanitizeTags(definition.tags),
  } as T;

  if ("entries" in definition && Array.isArray(definition.entries)) {
    (next as T & { entries: typeof definition.entries }).entries =
      definition.entries.map((entry) => ({
        ...entry,
        description: sanitizeDocText(entry.description),
        tags: sanitizeTags(entry.tags),
      }));
  }

  return next;
}

function renderDocParagraphs(text?: string) {
  if (!text) return null;
  const paragraphs = text
    .split("\n\n")
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;
  return (
    <div>
      {paragraphs.map((paragraph, index) => (
        <p key={`tsdoc-p-${index}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function renderTypeCell(field: TypeField) {
  return (
    <div>
      <code className="nextra-code">{field.type}</code>
      {field.description ? (
        <div className="x:mt-2">{field.description}</div>
      ) : null}
    </div>
  );
}

function renderSignatureTable(params: TypeField[]) {
  if (!params.length) return null;
  return (
    <table className="x:mt-4 x:w-full x:text-sm">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        {params.map((param) => (
          <tr key={param.name}>
            <td>
              <code className="nextra-code">{param.name}</code>
            </td>
            <td>{renderTypeCell(param)}</td>
            <td>{param.optional ? "No" : "Yes"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderPropertyTable(entries: TypeField[]) {
  if (!entries.length) return null;
  return (
    <table className="x:mt-4 x:w-full x:text-sm">
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.name}>
            <td>
              <code className="nextra-code">{entry.name}</code>
            </td>
            <td>{renderTypeCell(entry)}</td>
            <td>{entry.optional ? "No" : "Yes"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderReturnTypeTable(type: string) {
  return (
    <table className="x:mt-4 x:w-full x:text-sm">
      <thead>
        <tr>
          <th>Returns</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <code className="nextra-code">{type}</code>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function renderReturnFieldTable(fields: TypeField[]) {
  if (!fields.length) return null;
  return (
    <table className="x:mt-4 x:w-full x:text-sm">
      <thead>
        <tr>
          <th>Return</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field.name}>
            <td>
              <code className="nextra-code">{field.name}</code>
            </td>
            <td>{renderTypeCell(field)}</td>
            <td>{field.optional ? "No" : "Yes"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderFunctionContent(definition: TsDocDefinition) {
  if (!("signatures" in definition)) return null;
  const returnDescription = definition.tags?.returns;
  return (
    <div>
      {definition.signatures.map((signature, index) => (
        <div
          key={`tsdoc-signature-${index}`}
          className={index > 0 ? "x:mt-6" : undefined}
        >
          {definition.signatures.length > 1 ? (
            <p className="x:font-semibold">Signature {index + 1}</p>
          ) : null}
          {renderSignatureTable(signature.params)}
          {renderDocParagraphs(returnDescription)}
          {Array.isArray(signature.returns)
            ? renderReturnFieldTable(signature.returns)
            : renderReturnTypeTable(signature.returns.type)}
        </div>
      ))}
    </div>
  );
}

function renderTypeContent(definition: TsDocDefinition) {
  if (!("entries" in definition)) return null;
  return <div>{renderPropertyTable(definition.entries)}</div>;
}

function getTsDocLink(ts: {
  name: string;
  type?: SDKBlockProps["type"];
  owner?: string;
}) {
  const name = ts.name;
  switch (ts.type ?? "function") {
    case "class":
      return `${SDK_BASE_URL}/classes/${name}.html`;
    case "enum":
      return `${SDK_BASE_URL}/enums/${name}.html`;
    case "variable":
      return `${SDK_BASE_URL}/variables/${name}.html`;
    case "type":
      return `${SDK_BASE_URL}/types/${name}.html`;
    case "method":
      return ts.owner
        ? `${SDK_BASE_URL}/classes/${ts.owner}.html#method_${name}`
        : undefined;
    case "function":
    default:
      return `${SDK_BASE_URL}/functions/${name}.html`;
  }
}

export function buildTypeScriptTab(props: SDKBlockProps): SDKTab {
  const tsType = props.type ?? "function";
  const tsModule = "@velocity-exchange/sdk";
  let code: string | undefined;
  let exportName = props.name;
  const displayType = tsType.charAt(0).toUpperCase() + tsType.slice(1);
  const displayName =
    tsType === "method" && props.owner
      ? `${props.owner}.${props.name}`
      : props.name;

  if (tsType === "method") {
    if (props.owner) {
      const alias = `${props.owner}_${props.name}`;
      exportName = alias;
      code = `import { ${props.owner} } from '${tsModule}'; export type ${alias} = ${props.owner}['${props.name}']`;
    } else {
      code = `export { ${props.name} } from '${tsModule}'`;
    }
  } else {
    code = `export { ${props.name} } from '${tsModule}'`;
  }

  let definition;

  try {
    definition = sanitizeDefinition(
      generateDefinition({
        code,
        exportName,
      }),
    );
  } catch (error) {}

  const tsDefinition = definition as TsDocDefinition | undefined;
  const description = tsDefinition?.description
    ? renderDocParagraphs(tsDefinition.description)
    : null;

  let content: React.ReactNode = null;
  if (tsDefinition && "entries" in tsDefinition) {
    content = renderTypeContent(tsDefinition);
  } else if (tsDefinition && "signatures" in tsDefinition) {
    content = renderFunctionContent(tsDefinition);
  }

  return {
    label: "TypeScript",
    heading: props.name ? `${displayType} ${displayName}` : undefined,
    description,
    content:
      definition && content ? (
        content
      ) : props.name ? (
        <Callout type="warning">
          TypeScript docs unavailable for{" "}
          <code className="nextra-code x:max-md:break-all">{props.name}</code>.
        </Callout>
      ) : undefined,
    link: getTsDocLink({
      name: props.name,
      type: tsType,
      owner: props.owner,
    }),
    example: props.children ? { content: props.children } : undefined,
  };
}
