import React from "react";
import { Callout } from "nextra/components";
import type { SDKTab } from "../SDKDocTabs";
import type { SDKBlockProps } from "./types";
import rustdoc from "../../types/sdks/velocity_rs.slim.json";
import rustMethods from "../../types/sdks/velocity_rs.methods.json";

type RustDoc = {
  root: number | string;
  index: Record<string, RustItem>;
  paths: Record<
    string,
    { crate_id: number; path: string[]; kind: string }
  >;
};

type RustItem = {
  id: number;
  crate_id: number;
  name?: string;
  docs?: string;
  visibility?: string;
  inner?: Record<string, unknown>;
};

const rustData = rustdoc as unknown as RustDoc;
const rustMethodDocs = rustMethods as Record<
  string,
  {
    docs: string | null;
    inputs?: Array<{ name: string; type: string }>;
    output?: string | null;
    is_async?: boolean;
  }
>;
const RUSTDOC_BASE_URL = "https://docs.rs/velocity-rs/latest";


function normalizePath(name: string) {
  const trimmed = name.trim();
  if (trimmed.includes("::")) {
    if (trimmed.startsWith("velocity_rs::")) {
      return trimmed;
    }
    return `velocity_rs::${trimmed}`;
  }
  return trimmed;
}

function findRustItemId(name: string) {
  const normalized = normalizePath(name);

  if (normalized.includes("::")) {
    for (const [id, p] of Object.entries(rustData.paths)) {
      if (p.path?.join("::") === normalized) return id;
    }
  }

  const matches: Array<{ id: string; path: string[] }> = [];
  for (const [id, p] of Object.entries(rustData.paths)) {
    const last = p.path?.[p.path.length - 1];
    if (last === name && p.path?.[0] === "velocity_rs") {
      matches.push({ id, path: p.path });
    }
  }

  if (!matches.length) return null;
  matches.sort((a, b) => a.path.length - b.path.length);
  return matches[0].id;
}

function findOwnerId(owner?: string) {
  if (!owner) return null;
  return findRustItemId(owner);
}

function extractKind(item?: RustItem) {
  if (!item?.inner) return "Item";
  const rawKind = Object.keys(item.inner)[0];
  if (!rawKind) return "Item";
  if (rawKind === "type_alias") return "Type";
  const kind = rawKind;
  if (!kind) return "Item";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function renderEnumVariants(variants?: Array<{ name?: string; docs?: string }>) {
  if (!variants?.length) return null;
  return (
    <table className="x:mt-4 x:w-full x:text-sm">
      <thead>
        <tr>
          <th>Variant</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {variants.map((variant) => (
          <tr key={variant.name ?? "variant"}>
            <td>
              <code className="nextra-code">{variant.name ?? "-"}</code>
            </td>
            <td>{variant.docs ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function typeToString(type: unknown): string {
  if (!type) return "void";
  if (typeof type === "string") return type;
  if (typeof type !== "object") return "Unknown";

  const t = type as Record<string, unknown>;
  if (typeof t.primitive === "string") return t.primitive;
  if (typeof t.generic === "string") return t.generic;
  if (Array.isArray(t.tuple)) {
    return `(${t.tuple.map(typeToString).join(", ")})`;
  }
  if (t.slice) {
    return `[${typeToString(t.slice)}]`;
  }
  if (t.array && typeof t.array === "object") {
    const arr = t.array as { type?: unknown; len?: number | string };
    const len =
      typeof arr.len === "number" || typeof arr.len === "string"
        ? arr.len
        : "";
    return `[${typeToString(arr.type)}; ${len}]`;
  }
  if (t.borrowed_ref && typeof t.borrowed_ref === "object") {
    const ref = t.borrowed_ref as {
      lifetime?: string | null;
      mutable?: boolean;
      type?: unknown;
    };
    const life = ref.lifetime ? ` ${ref.lifetime}` : "";
    const mut = ref.mutable ? " mut " : " ";
    return `&${life}${mut}${typeToString(ref.type)}`.trim();
  }
  if (t.raw_pointer && typeof t.raw_pointer === "object") {
    const ptr = t.raw_pointer as { mutable?: boolean; type?: unknown };
    const mut = ptr.mutable ? "*mut " : "*const ";
    return `${mut}${typeToString(ptr.type)}`;
  }
  if (t.resolved_path && typeof t.resolved_path === "object") {
    const path = t.resolved_path as {
      path?: string;
      args?: { angle_bracketed?: { args?: Array<Record<string, unknown>> } };
    };
    const name = path.path ?? "Unknown";
    const args = path.args?.angle_bracketed?.args ?? [];
    if (!args.length) return name;
    const rendered = args
      .map((arg) => {
        if ("type" in arg) return typeToString(arg.type);
        if ("lifetime" in arg && typeof arg.lifetime === "string") {
          return arg.lifetime;
        }
        if ("const" in arg) return String((arg as { const?: unknown }).const);
        return "";
      })
      .filter(Boolean);
    return rendered.length ? `${name}<${rendered.join(", ")}>` : name;
  }

  return "Unknown";
}

function renderSignatureTable(params: Array<{ name: string; type: string }>) {
  if (!params.length) return null;
  const isOptional = (type: string) =>
    type.startsWith("Option<") || type.includes("Option<");
  return (
    <table className="x:mt-4 x:w-full x:text-sm">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Required</th>
          <th>Default</th>
        </tr>
      </thead>
      <tbody>
        {params.map((param) => (
          <tr key={param.name}>
            <td>
              <code className="nextra-code">{param.name}</code>
            </td>
            <td>
              <code className="nextra-code">{param.type}</code>
            </td>
            <td>{isOptional(param.type) ? "No" : "Yes"}</td>
            <td>-</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderReturnTable(output?: string | null) {
  if (!output) return null;
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
            <code className="nextra-code">{output}</code>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function getRustDocLink({
  path,
  kind,
  methodName,
  ownerPath,
}: {
  path: string;
  kind: string;
  methodName?: string;
  ownerPath?: string;
}) {
  const parts = path.split("::");
  if (!parts.length || parts[0] !== "velocity_rs") return undefined;

  const modulePath = parts.slice(1);
  const name = modulePath[modulePath.length - 1];
  const moduleBase = `${RUSTDOC_BASE_URL}/velocity_rs/${modulePath
    .slice(0, -1)
    .join("/")}`;

  if (kind === "Method" && methodName) {
    const ownerParts = ownerPath?.split("::") ?? parts.slice(0, -1);
    if (!ownerParts.length || ownerParts[0] !== "velocity_rs") return undefined;
    const ownerModulePath = ownerParts.slice(1);
    const ownerName = ownerModulePath[ownerModulePath.length - 1];
    const ownerModuleBase = `${RUSTDOC_BASE_URL}/velocity_rs/${ownerModulePath
      .slice(0, -1)
      .join("/")}`;
    return `${ownerModuleBase}/struct.${ownerName}.html#method.${methodName}`;
  }

  switch (kind) {
    case "Module":
      return `${RUSTDOC_BASE_URL}/velocity_rs/${modulePath.join("/")}/index.html`;
    case "Struct":
      return `${moduleBase}/struct.${name}.html`;
    case "Enum":
      return `${moduleBase}/enum.${name}.html`;
    case "Trait":
      return `${moduleBase}/trait.${name}.html`;
    case "Type":
      return `${moduleBase}/type.${name}.html`;
    case "Function":
      return `${moduleBase}/fn.${name}.html`;
    case "Constant":
      return `${moduleBase}/constant.${name}.html`;
    case "Static":
      return `${moduleBase}/static.${name}.html`;
    default:
      return `${RUSTDOC_BASE_URL}/velocity_rs/${modulePath.join("/")}/index.html`;
  }
}

function renderRustDocs(docs?: string) {
  const sanitized = docs;
  if (!sanitized) return null;

  const parts = sanitized.split("```");
  const nodes: React.ReactNode[] = [];

  let keyIndex = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;

    if (i % 2 === 1) {
      const lines = part.split("\n");
      const first = lines[0]?.trim();
      const code = first && !first.includes(" ") ? lines.slice(1).join("\n") : part;
      nodes.push(
        <pre key={`code-${keyIndex}`}>
          <code>{code.trimEnd()}</code>
        </pre>,
      );
      keyIndex += 1;
      continue;
    }

    const paragraphs = part
      .split("\n\n")
      .map((p) => p.replace(/\n/g, " ").trim())
      .filter(Boolean);

    for (const para of paragraphs) {
      nodes.push(<p key={`p-${keyIndex}`}>{para}</p>);
      keyIndex += 1;
    }
  }

  return nodes.length ? <div>{nodes}</div> : null;
}

export function buildRustTab(props: SDKBlockProps): SDKTab {
  let path: string | undefined;
  let docs: string | undefined | null;

  if (props.type === "method" && props.owner) {
    const ownerId = findOwnerId(props.owner);
    const ownerPath = ownerId
      ? rustData.paths[ownerId]?.path?.join("::")
      : normalizePath(props.owner);
    if (ownerPath) {
      path = `${ownerPath}::${props.name}`;
      docs = rustMethodDocs[path]?.docs ?? null;
    }
    return renderRustTab({
      path,
      docs,
      kind: "Method",
      link: path
        ? getRustDocLink({
            path,
            kind: "Method",
            methodName: props.name,
            ownerPath,
          })
        : undefined,
      signature: {
        inputs: path ? rustMethodDocs[path]?.inputs : undefined,
        output: path ? rustMethodDocs[path]?.output ?? undefined : undefined,
      },
      props,
    });
  }

  if (props.type === "method") {
    return renderRustTab({
      path,
      docs,
      kind: "Method",
      link: path
        ? getRustDocLink({
            path,
            kind: "Method",
            methodName: props.name,
          })
        : undefined,
      signature: {
        inputs: path ? rustMethodDocs[path]?.inputs : undefined,
        output: path ? rustMethodDocs[path]?.output ?? undefined : undefined,
      },
      props,
    });
  }

  {
    const itemId = findRustItemId(props.name);
    path = itemId ? rustData.paths[itemId]?.path?.join("::") : undefined;
    const item = itemId ? rustData.index[itemId] : undefined;
    docs = item?.docs ?? null;
    const kind = extractKind(item);
    let inputs: Array<{ name: string; type: string }> | undefined;
    let output: string | null | undefined;
    let variants: Array<{ name?: string; docs?: string }> | undefined;
    let typeAlias: string | undefined;
    let constantValue: { type?: string; value?: string } | undefined;
    if (item?.inner && (item.inner as { function?: { sig?: unknown } }).function) {
      const sig = (item.inner as { function?: { sig?: unknown } }).function?.sig as
        | {
            inputs?: Array<[string, unknown]>;
            output?: unknown;
          }
        | undefined;
      if (sig?.inputs) {
        inputs = sig.inputs.map((input) => ({
          name: input[0],
          type: typeToString(input[1]),
        }));
      }
      output = sig?.output ? typeToString(sig.output) : null;
    }
    if (item?.inner && (item.inner as { enum?: { variants?: number[] } }).enum) {
      const enumInner = (item.inner as { enum?: { variants?: number[] } }).enum;
      const variantIds = enumInner?.variants ?? [];
      variants = variantIds
        .map((variantId) => {
          const variant = rustData.index[String(variantId)];
          return {
            name: variant?.name ?? undefined,
            docs: variant?.docs ?? undefined,
          };
        })
        .filter((variant) => variant.name);
    }
    if (
      item?.inner &&
      (item.inner as { type_alias?: { type?: unknown } }).type_alias
    ) {
      const alias = (item.inner as { type_alias?: { type?: unknown } })
        .type_alias;
      if (alias?.type) {
        typeAlias = typeToString(alias.type);
      }
    }
    if (
      item?.inner &&
      (item.inner as { constant?: { type?: unknown; const?: { value?: string } } })
        .constant
    ) {
      const constant = (
        item.inner as { constant?: { type?: unknown; const?: { value?: string, expr?: string } } }
      ).constant;
      const type = constant?.type ? typeToString(constant.type) : undefined;
      const value = constant?.const?.value ?? constant?.const?.expr;
      constantValue = {
        type,
        value,
      };
    }
    return renderRustTab({
      path,
      docs,
      kind,
      link: path
        ? getRustDocLink({
            path,
            kind,
          })
        : undefined,
      signature: {
        inputs,
        output,
      },
      variants,
      constantValue,
      typeAlias,
      props,
    });
  }
}

function renderRustTab({
  path,
  docs,
  kind,
  link,
  signature,
  variants,
  constantValue,
  typeAlias,
  props,
}: {
  path?: string;
  docs?: string | null;
  kind: string;
  link?: string;
  signature?: {
    inputs?: Array<{ name: string; type: string }>;
    output?: string | null;
  };
  variants?: Array<{ name?: string; docs?: string }>;
  constantValue?: { type?: string; value?: string };
  typeAlias?: string;
  props: SDKBlockProps;
}): SDKTab {
  if (!path) {
    return {
      label: "Rust",
      content: (
        <Callout type="warning">
          Rust docs unavailable for{" "}
          <code className="nextra-code x:max-md:break-all">{props.name}</code>.
        </Callout>
      ),
      example: props.children ? { content: props.children } : undefined,
    };
  }

  const hasSignature =
    Boolean(signature?.inputs?.length) || Boolean(signature?.output);
  const hasVariants = Boolean(variants?.length);
  const hasTypeAlias = Boolean(typeAlias);
  const hasConstant = Boolean(constantValue?.type || constantValue?.value);
  const hasDocs = docs != null && docs !== "";

  if (!hasDocs && !hasSignature && !hasVariants && !hasTypeAlias && !hasConstant) {
    return {
      label: "Rust",
      content: (
        <Callout type="warning">
          Rust docs unavailable for{" "}
          <code className="nextra-code x:max-md:break-all">{props.name}</code>.
        </Callout>
      ),
      example: props.children ? { content: props.children } : undefined,
    };
  }

  return {
    label: "Rust",
    heading: `${kind} ${path}`,
    description: renderRustDocs(docs ?? undefined),
    link,
    content: (
      <div>
        {renderSignatureTable(signature?.inputs ?? [])}
        {renderReturnTable(signature?.output)}
        {renderEnumVariants(variants)}
        {constantValue ? (
          <table className="x:mt-4 x:w-full x:text-sm">
            <thead>
              <tr>
                <th>Constant</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code className="nextra-code">
                    {constantValue.type ?? "Unknown"}
                  </code>
                </td>
                <td>
                  <code className="nextra-code">
                    {constantValue.value ?? "-"}
                  </code>
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}
        {typeAlias ? (
          <table className="x:mt-4 x:w-full x:text-sm">
            <thead>
              <tr>
                <th>Type Alias</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code className="nextra-code">{typeAlias}</code>
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </div>
    ),
    example: props.children ? { content: props.children } : undefined,
  };
}
