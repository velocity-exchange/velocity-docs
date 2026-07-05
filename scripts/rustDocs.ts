import fs from "fs";

const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
const input = args[0] ?? "types/sdks/velocity_rs.json";
const output = args[1] ?? "types/sdks/velocity_rs.slim.json";

const data = JSON.parse(fs.readFileSync(input, "utf8"));
const rootItem = data.index?.[String(data.root)];
if (!rootItem || rootItem.crate_id == null) {
  throw new Error("Could not determine root crate_id from rustdoc JSON");
}
const rootCrateId = rootItem.crate_id;

const keepIds = Object.entries(data.paths || {})
  // @ts-ignore
  .filter(([, p]) => p.crate_id === rootCrateId)
  .map(([id]) => id);

const index: Record<string, unknown> = {};
const paths: Record<string, unknown> = {};
for (const id of keepIds) {
  if (data.index?.[id]) index[id] = data.index[id];
  if (data.paths?.[id]) paths[id] = data.paths[id];
}

type RustType = Record<string, unknown> | null;

function typeToString(type: RustType): string {
  if (!type) return "void";
  if (typeof type === "string") return type;

  if ("primitive" in type && typeof type.primitive === "string") {
    return type.primitive;
  }
  if ("generic" in type && typeof type.generic === "string") {
    return type.generic;
  }
  if ("tuple" in type && Array.isArray(type.tuple)) {
    return `(${type.tuple.map(typeToString).join(", ")})`;
  }
  if ("slice" in type && type.slice) {
    return `[${typeToString(type.slice as RustType)}]`;
  }
  if ("array" in type && type.array && typeof type.array === "object") {
    const arr = type.array as { type?: RustType; len?: number | string };
    const len =
      typeof arr.len === "number" || typeof arr.len === "string"
        ? arr.len
        : "";
    return `[${typeToString(arr.type ?? null)}; ${len}]`;
  }
  if ("borrowed_ref" in type && type.borrowed_ref) {
    const ref = type.borrowed_ref as {
      lifetime?: string | null;
      mutable?: boolean;
      type?: RustType;
    };
    const life = ref.lifetime ? ` ${ref.lifetime}` : "";
    const mut = ref.mutable ? " mut " : " ";
    return `&${life}${mut}${typeToString(ref.type ?? null)}`.trim();
  }
  if ("raw_pointer" in type && type.raw_pointer) {
    const ptr = type.raw_pointer as { mutable?: boolean; type?: RustType };
    const mut = ptr.mutable ? "*mut " : "*const ";
    return `${mut}${typeToString(ptr.type ?? null)}`;
  }
  if ("resolved_path" in type && type.resolved_path) {
    const path = type.resolved_path as {
      path?: string;
      args?: { angle_bracketed?: { args?: Array<Record<string, unknown>> } };
    };
    const name = path.path ?? "Unknown";
    const args = path.args?.angle_bracketed?.args ?? [];
    if (!args.length) return name;
    const rendered = args
      .map((arg) => {
        if ("type" in arg) return typeToString(arg.type as RustType);
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

const methodDocs: Record<string, { docs: string | null }> = {};
for (const id of keepIds) {
  const item = data.index?.[id];
  if (!item?.inner) continue;
  const impls =
    item.inner.struct?.impls ??
    item.inner.enum?.impls ??
    item.inner.union?.impls ??
    [];

  if (!impls.length) continue;
  const ownerPath = data.paths?.[id]?.path?.join("::");
  if (!ownerPath) continue;

  for (const implId of impls) {
    const implItem = data.index?.[String(implId)];
    const items = implItem?.inner?.impl?.items;
    if (!items?.length) continue;
    for (const methodId of items) {
      const method = data.index?.[String(methodId)];
      if (!method?.name) continue;
      if (!method?.inner?.function) continue;
      const sig = method.inner.function.sig;
      const inputs = Array.isArray(sig?.inputs)
        ? sig.inputs.map((input: [string, RustType]) => ({
            name: input[0],
            type: typeToString(input[1]),
          }))
        : [];
      const output = sig?.output ? typeToString(sig.output as RustType) : null;
      const isAsync = Boolean(method.inner.function.header?.is_async);
      const key = `${ownerPath}::${method.name}`;
      methodDocs[key] = {
        docs: method.docs ?? null,
        inputs,
        output,
        is_async: isAsync,
      } as {
        docs: string | null;
        inputs: Array<{ name: string; type: string }>;
        output: string | null;
        is_async: boolean;
      };
    }
  }
}

const slim = {
  root: data.root,
  crate_version: data.crate_version,
  includes_private: data.includes_private,
  index,
  paths,
  external_crates: {},
  target: data.target,
  format_version: data.format_version,
};

fs.writeFileSync(output, JSON.stringify(slim));
const methodsOutput = args[2] ?? output.replace(/\.slim\.json$/, ".methods.json");
fs.writeFileSync(methodsOutput, JSON.stringify(methodDocs));

console.log(`Wrote ${output} with ${keepIds.length} items`);
console.log(`Wrote ${methodsOutput} with ${Object.keys(methodDocs).length} methods`);
