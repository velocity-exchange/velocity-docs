import React from "react";
import { Callout } from "fumadocs-ui/components/callout";
import { generateDefinition, TypeField, Tags } from "nextra/tsdoc";
import type { SDKTab } from "../SDKDocTabs";
import type { SDKBlockProps } from "./types";

// No public TypeDoc host exists yet. The provisional target,
// velocity-exchange.github.io/velocity-v1/sdk, is a GitHub Pages path under a
// repository that is private until the audit publishes, so every URL built from
// it answered 404, on 183 blocks across the site. Publishing TypeDoc is the fix;
// until then a block renders with no reference link rather than a dead one. Set
// this to the host and the links come back with no other change.
const SDK_BASE_URL: string | undefined = undefined;
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
      <code className="fd-code">{field.type}</code>
      {field.description ? (
        <div className="">{field.description}</div>
      ) : null}
    </div>
  );
}

function renderSignatureTable(params: TypeField[]) {
  if (!params.length) return null;
  return (
    <table className="">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        {params.map((param, index) => (
          // `param.name` is empty for an object-destructured argument
          // (`generateDefinition` has no name to report), so two such
          // parameters in one signature both keyed as "" and React warned
          // about a missing key. Index makes the key unique regardless.
          <tr key={`${param.name}-${index}`}>
            <td>
              <code className="fd-code">{param.name}</code>
            </td>
            <td>{renderTypeCell(param)}</td>
            <td>{param.optional ? "No" : "Yes"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Documenting a class's static side pulls in two things that are not API.
// `prototype` exists on every class object and says nothing. A member declared
// `private` with no type annotation widens to a bare `any` and carries no doc
// comment, which is how TransactionParamProcessor's private
// getComputeUnitsFromSim reached the reader's property table. Neither belongs in
// public reference.
function isPublicApi(field: TypeField) {
  if (field.name === "prototype") return false;
  if (field.type === "any" && !field.description) return false;
  return true;
}

function renderPropertyTable(allEntries: TypeField[]) {
  const entries = allEntries.filter(isPublicApi);
  if (!entries.length) return null;
  return (
    <table className="">
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => (
          <tr key={`${entry.name}-${index}`}>
            <td>
              <code className="fd-code">{entry.name}</code>
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
    <table className="">
      <thead>
        <tr>
          <th>Returns</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <code className="fd-code">{type}</code>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function renderReturnFieldTable(fields: TypeField[]) {
  if (!fields.length) return null;
  return (
    <table className="">
      <thead>
        <tr>
          <th>Return</th>
          <th>Type</th>
          <th>Required</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, index) => (
          <tr key={`${field.name}-${index}`}>
            <td>
              <code className="fd-code">{field.name}</code>
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
          className={index > 0 ? "" : undefined}
        >
          {definition.signatures.length > 1 ? (
            <p className="">Signature {index + 1}</p>
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
  if (!SDK_BASE_URL) return undefined;
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

  // An "example" block is a prose code sample, not an API reference. There is
  // no export to resolve, so generating a definition for it builds an invalid
  // export statement, throws, and renders a warning box at the reader. Return
  // the sample on its own instead.
  if (tsType === "example") {
    // Render like every other tab's raw code sample: always visible, not
    // buried behind a collapsed section titled after itself.
    return {
      label: "TypeScript",
      example: { content: props.children },
    };
  }

  const tsModule = "@velocity-exchange/sdk";
  let code: string | undefined;
  let exportName = props.name;
  const displayType = tsType.charAt(0).toUpperCase() + tsType.slice(1);
  const displayName =
    tsType === "method" && props.owner
      ? `${props.owner}.${props.name}`
      : props.name;

  // Resolution is a list of shapes to try, not one guess, because the underlying
  // tsdoc generator documents whichever side of a symbol it is handed and throws
  // when that side is empty.
  //
  // Methods: indexing an owner reaches only instance members, so
  // `VelocityCore['buildDepositInstruction']` misses a static and the block
  // rendered an error box while the method plainly existed. Try instance, then
  // `typeof` for the static side.
  //
  // Classes: the generator reads a class's STATIC side and throws "No properties
  // found" when there are none. Most classes have no statics, so nearly every
  // `type="class"` block on the site rendered a warning box: VelocityClient,
  // TxHandler, UserMap, DLOB, the tx senders and the swap clients among them.
  // Falling back to the instance type documents what a reader actually holds.
  const candidates: { code: string; exportName: string }[] = [];
  if (tsType === "method" && props.owner) {
    const alias = `${props.owner}_${props.name}`;
    candidates.push({
      code: `import { ${props.owner} } from '${tsModule}'; export type ${alias} = ${props.owner}['${props.name}']`,
      exportName: alias,
    });
    candidates.push({
      code: `import { ${props.owner} } from '${tsModule}'; export type ${alias} = (typeof ${props.owner})['${props.name}']`,
      exportName: alias,
    });
  } else {
    candidates.push({
      code: `export { ${props.name} } from '${tsModule}'`,
      exportName: props.name,
    });
    if (tsType === "class") {
      const instance = `${props.name}_Instance`;
      candidates.push({
        code: `import { ${props.name} } from '${tsModule}'; export type ${instance} = ${props.name}`,
        exportName: instance,
      });
      // A class whose whole surface is static, TransactionParamProcessor being
      // the one on this site, has an empty instance type. Name the static side
      // explicitly so its methods are documented rather than nothing.
      const statics = `${props.name}_Static`;
      candidates.push({
        code: `import { ${props.name} } from '${tsModule}'; export type ${statics} = typeof ${props.name}`,
        exportName: statics,
      });
    }
  }
  code = candidates[0]?.code;

  // A definition carrying neither properties nor signatures is as useless as a
  // thrown error, so it does not end the search either.
  const isUsable = (d: unknown) =>
    !!d &&
    (("entries" in (d as object) &&
      Array.isArray((d as { entries?: unknown[] }).entries) &&
      ((d as { entries: unknown[] }).entries.length > 0)) ||
      ("signatures" in (d as object) &&
        Array.isArray((d as { signatures?: unknown[] }).signatures) &&
        ((d as { signatures: unknown[] }).signatures.length > 0)));

  let definition;

  for (const candidate of candidates) {
    try {
      const resolved = generateDefinition({
        code: candidate.code,
        exportName: candidate.exportName,
      });
      if (isUsable(resolved)) {
        definition = sanitizeDefinition(resolved);
        exportName = candidate.exportName;
        break;
      }
      // Keep a resolved-but-empty definition as a fallback: its description is
      // still worth rendering if no later candidate does better.
      if (resolved && !definition) definition = sanitizeDefinition(resolved);
    } catch (error) {}
  }

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

  // A class resolves to a definition that carries a description but neither
  // `entries` nor `signatures`, so the old check treated a perfectly good
  // definition as a failure and showed the reader a warning box.
  // TransactionParamProcessor is the case that exposed this. A warning is only
  // correct when nothing resolved at all.
  const body: React.ReactNode = content ?? null;

  return {
    label: "TypeScript",
    heading: props.name ? `${displayType} ${displayName}` : undefined,
    description,
    content:
      body ?? (definition ? undefined : props.name ? (
        <Callout type="warning">
          TypeScript docs unavailable for{" "}
          <code className="fd-code ">{props.name}</code>.
        </Callout>
      ) : undefined),
    link: getTsDocLink({
      name: props.name,
      type: tsType,
      owner: props.owner,
    }),
    example: props.children ? { content: props.children } : undefined,
  };
}
