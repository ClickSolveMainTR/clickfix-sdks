// Renders the generated part of the Dart visitor client
// (sdks/flutter/clickfix_visitor/lib/src/generated/) from the `/v1/widget/*`
// subset of the canonical contract: one Dart class per schema (fromJson /
// toJson with path-carrying FormatExceptions) and `WidgetApi`, one method per
// operation over the hand-written `WidgetTransport`. Plain Dart (no
// build_runner, no reflection), so `make sdks-check` compares the output here
// in Node, like the TypeScript, Go and PHP outputs; the Dart toolchain only
// analyzes and tests it (CI `sdks` and `flutter` jobs).
//
// Mapping: string (uuid, uri, ...) -> String, date-time -> DateTime,
// integer -> int, number -> num, boolean -> bool, array -> List, object with
// properties -> a class (inline objects are named Parent + Property),
// object with additionalProperties -> Map, `T | null` (type arrays, oneOf /
// anyOf with one non-null branch) -> T?. Enums stay String so a value added
// by a newer API does not break an older app; named string enums get a
// class of constants. A property is non-nullable only when it is required
// and not nullable; a required array that arrives as null (a Go nil slice)
// decodes as empty.
const METHODS = ['get', 'put', 'post', 'delete', 'patch'];

// Session replay and co-browsing upload DOM recordings: browser-only, not
// part of the native client.
const EXCLUDED_PATHS = [/\/replay-policy$/, /\/sessions(\/|$)/];
// Sent by the transport on every request (mobile app key), not per call.
const TRANSPORT_HEADERS = new Set(['X-ClickFix-App-Key', 'X-ClickFix-App-Package']);
const PREFIX = '/v1/widget/{public_id}';

const RESERVED = new Set(('abstract as assert async await base break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for Function get hide if implements import in interface is late library mixin new null of on operator part required rethrow return sealed set show static super switch sync this throw true try type typedef var void when while with yield hashCode runtimeType toString noSuchMethod').split(' '));

const pascal = (s) => s.replace(/(^|[^A-Za-z0-9]+)([A-Za-z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = (s) => {
  const p = pascal(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
};
const fieldName = (key) => {
  const n = camel(key);
  return RESERVED.has(n) ? `${n}Value` : n;
};
const str = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$')}'`;
// Dart doc comment lines; `[` would be read as a reference, `<`/`>` as HTML.
const escape = (text) => text.replace(/\r/g, '').trim().replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Contract text is escaped (escape()); text written here may use [references].
function doc(text, indent = '', raw = false) {
  if (!text) return '';
  const clean = (raw ? text : escape(text)).replace(/\n{3,}/g, '\n\n');
  return clean.split('\n').map((l) => `${indent}///${l.trim() ? ' ' + l.trimEnd() : ''}`).join('\n') + '\n';
}

export function renderDartClient(spec) {
  const schemas = spec.components?.schemas ?? {};
  const parameters = spec.components?.parameters ?? {};
  const classes = new Map(); // name -> { schema, description }
  const enums = new Map(); // name -> values
  const multipart = new Set();
  const inputs = new Set(); // request bodies: get copyWith

  const resolve = (node) => {
    if (node?.$ref) {
      const name = node.$ref.split('/').pop();
      return { name, schema: (node.$ref.includes('/parameters/') ? parameters : schemas)[name] };
    }
    return { name: null, schema: node };
  };

  function addClass(name, schema) {
    if (classes.has(name)) {
      if (classes.get(name).schema !== schema) throw new Error(`Dart class name collision: ${name}`);
      return;
    }
    classes.set(name, { schema });
  }

  // Strips `null` out of a schema: { schema, nullable }.
  function nonNull(schema) {
    if (Array.isArray(schema.type)) {
      const types = schema.type.filter((t) => t !== 'null');
      const nullable = types.length !== schema.type.length;
      return { schema: { ...schema, type: types.length === 1 ? types[0] : types }, nullable };
    }
    for (const key of ['oneOf', 'anyOf']) {
      if (!schema[key]) continue;
      const rest = schema[key].filter((s) => s.type !== 'null');
      const nullable = rest.length !== schema[key].length;
      if (rest.length === 1) {
        const inner = nonNull(rest[0]);
        return { schema: inner.schema, nullable: nullable || inner.nullable };
      }
      return { schema: { description: schema.description }, nullable: true }; // real union: Object?
    }
    return { schema, nullable: schema.type === 'null' };
  }

  // A Dart type for a schema: { dart, decode(v, at), encode(v), simple }.
  function typeOf(node, nameHint) {
    if (node?.$ref) {
      const { name, schema } = resolve(node);
      if (schema.type === 'string' && schema.enum) {
        enums.set(name, schema.enum);
        return prim('String', '_string');
      }
      if (isObjectClass(schema)) {
        addClass(name, schema);
        return classType(name);
      }
      return typeOf(schema, name);
    }
    const { schema } = nonNull(node);
    if (schema.$ref) return typeOf(schema, nameHint);
    const type = schema.type;
    if (Array.isArray(type)) return prim('Object', '_value');
    switch (type) {
      case 'string':
        if (schema.format === 'date-time')
          return { dart: 'DateTime', decode: (v, at) => `_dateTime(${v}, ${at})`, encode: (v) => `${v}.toUtc().toIso8601String()`, simple: false };
        return prim('String', '_string');
      case 'integer':
        return prim('int', '_int');
      case 'number':
        return prim('num', '_num');
      case 'boolean':
        return prim('bool', '_bool');
      case 'array': {
        const item = typeOf(schema.items ?? {}, `${nameHint}Item`);
        return {
          dart: `List<${item.dart}>`,
          decode: (v, at) => `_list(${v}, ${at}, (e, p) => ${item.decode('e', 'p')})`,
          encode: (v) => (item.simple ? v : `[for (final e in ${v}) ${item.encode('e')}]`),
          simple: item.simple,
        };
      }
      case 'object':
      case undefined:
        if (isObjectClass(schema)) {
          addClass(nameHint, schema);
          return classType(nameHint);
        }
        if (schema.additionalProperties && typeof schema.additionalProperties === 'object' && Object.keys(schema.additionalProperties).length) {
          const value = typeOf(schema.additionalProperties, `${nameHint}Value`);
          return {
            dart: `Map<String, ${value.dart}>`,
            decode: (v, at) => `_mapOf(${v}, ${at}, (e, p) => ${value.decode('e', 'p')})`,
            encode: (v) => (value.simple ? v : `{for (final e in ${v}.entries) e.key: ${value.encode('e.value')}}`),
            simple: value.simple,
          };
        }
        if (type === 'object') return { dart: 'Map<String, Object?>', decode: (v, at) => `_json(${v}, ${at})`, encode: (v) => v, simple: true };
        return { dart: 'Object', decode: (v, at) => `_value(${v}, ${at})`, encode: (v) => v, simple: true, any: true };
      default:
        throw new Error(`Unsupported schema type ${JSON.stringify(type)} (${nameHint})`);
    }
  }
  const prim = (dart, fn) => ({ dart, decode: (v, at) => `${fn}(${v}, ${at})`, encode: (v) => v, simple: true });
  const classType = (name) => ({ dart: name, decode: (v, at) => `${name}.fromJson(_json(${v}, ${at}), ${at})`, encode: (v) => `${v}.toJson()`, simple: false });
  const isObjectClass = (s) => (s.type === 'object' || s.type === undefined) && s.properties && Object.keys(s.properties).length > 0;

  // Envelope { success, data, meta } -> the type of `data`.
  function dataType(envelopeNode, name) {
    const { name: envName, schema } = resolve(envelopeNode);
    const data = schema.properties?.data;
    if (!data) throw new Error(`${envName ?? name}: response is not an envelope`);
    const hint = envName?.startsWith('Envelope') ? envName.slice('Envelope'.length) : `${pascal(name)}Result`;
    return typeOf(data, hint);
  }

  const ops = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    if (!path.startsWith(PREFIX + '/')) throw new Error(`${path}: not under ${PREFIX}`);
    if (EXCLUDED_PATHS.some((re) => re.test(path))) continue;
    for (const method of METHODS) {
      const op = item[method];
      if (!op) continue;
      if (!/^widget[A-Z]/.test(op.operationId ?? '')) throw new Error(`${method} ${path}: operationId must be widget<Name> (got ${op.operationId})`);
      const name = camel(op.operationId.slice('widget'.length));
      const params = [...(item.parameters ?? []), ...(op.parameters ?? [])].map((p) => resolve(p).schema);
      const pathParams = [];
      const query = [];
      for (const p of params) {
        if (p.in === 'path') {
          if (p.name !== 'public_id' && !pathParams.some((x) => x.name === p.name)) pathParams.push(p);
        } else if (p.in === 'query') query.push(p);
        else if (p.in === 'header') {
          if (!TRANSPORT_HEADERS.has(p.name)) throw new Error(`${method} ${path}: header ${p.name} is not sent by the transport`);
        } else throw new Error(`${method} ${path}: unsupported parameter location ${p.in}`);
      }
      for (const m of path.slice(PREFIX.length).matchAll(/\{(\w+)\}/g))
        if (!pathParams.some((p) => p.name === m[1])) throw new Error(`${method} ${path}: path parameter ${m[1]} is not declared`);
      const content = op.requestBody?.content ?? {};
      for (const ct of Object.keys(content))
        if (ct !== 'application/json' && ct !== 'multipart/form-data') throw new Error(`${method} ${path}: unsupported request type ${ct}`);
      const body = content['application/json'] ? typeOf(content['application/json'].schema, `${pascal(name)}Input`) : null;
      if (body && !classes.has(body.dart)) throw new Error(`${method} ${path}: JSON body must be an object with properties`);
      if (body) inputs.add(body.dart);
      let upload = null;
      if (content['multipart/form-data']) {
        const { name: mpName, schema: mp } = resolve(content['multipart/form-data'].schema);
        const className = mpName ?? `${pascal(name)}Multipart`;
        const files = Object.entries(mp.properties).filter(([, s]) => s.format === 'binary').map(([k]) => k);
        if (files.length !== 1) throw new Error(`${method} ${path}: multipart body needs exactly one binary field`);
        addClass(className, mp);
        multipart.add(className);
        upload = { className, file: files[0] };
      }
      const ok = Object.entries(op.responses ?? {}).filter(([code]) => /^2\d\d$/.test(code));
      if (ok.length !== 1) throw new Error(`${method} ${path}: expected one 2xx response`);
      const json = ok[0][1].content?.['application/json'];
      if (!json) throw new Error(`${method} ${path}: 2xx response without JSON`);
      const result = dataType(json.schema, name);
      if (!classes.has(result.dart)) throw new Error(`${method} ${path}: response data must be an object with properties`);
      ops.push({ method: method.toUpperCase(), path, name, op, pathParams, query, body, bodyRequired: op.requestBody?.required === true, upload, result });
    }
  }
  ops.sort((a, b) => a.name.localeCompare(b.name));

  // Classes can register further classes while rendering; loop until stable.
  const rendered = new Map();
  for (let changed = true; changed; ) {
    changed = false;
    for (const [name, { schema }] of classes) {
      if (rendered.has(name)) continue;
      rendered.set(name, multipart.has(name) ? renderMultipart(name, schema) : renderClass(name, schema));
      changed = true;
    }
  }

  function renderClass(name, schema) {
    const required = new Set(schema.required ?? []);
    const fields = Object.entries(schema.properties).map(([key, prop]) => {
      const { schema: inner, nullable } = nonNull(resolve(prop).schema ?? prop);
      const type = typeOf(prop, name + pascal(key));
      const optional = nullable || !required.has(key) || type.any;
      const description = prop.description ?? inner.description ?? (prop.$ref ? undefined : undefined);
      const values = (inner.enum ?? resolve(prop).schema?.enum)?.filter((v) => typeof v === 'string');
      return { key, name: fieldName(key), type, optional, required: required.has(key), description, values };
    });
    const names = new Set();
    for (const f of fields) {
      if (names.has(f.name)) throw new Error(`${name}: two properties map to ${f.name}`);
      names.add(f.name);
    }
    let out = doc(schema.description ?? `\`${name}\` of the ClickFix visitor API.`);
    out += `class ${name} {\n`;
    out += `  /// Creates a \`${name}\`.\n`;
    out += fields.length
      ? `  const ${name}({\n${fields.map((f) => `    ${f.optional ? '' : 'required '}this.${f.name},\n`).join('')}  });\n\n`
      : `  const ${name}();\n\n`;
    out += `  /// Decodes a \`${name}\`; [at] is the JSON path used in errors.\n`;
    out += `  factory ${name}.fromJson(Map<String, Object?> json, [String at = ${str(name)}]) => ${name}(\n`;
    for (const f of fields) {
      const v = `json[${str(f.key)}]`;
      const at = `'$at.${f.key.replace(/\$/g, '\\$')}'`;
      out += `    ${f.name}: ${f.optional ? `_optional(${v}, ${at}, (e, p) => ${f.type.decode('e', 'p')})` : f.type.decode(v, at)},\n`;
    }
    out += '  );\n\n';
    for (const f of fields) {
      let d = f.description ? doc(f.description, '  ') : '';
      if (!d) d = `  /// \`${f.key}\`.\n`;
      if (f.values?.length) d += `  ///\n  /// One of ${f.values.map((v) => (v === '' ? "''" : `\`${v}\``)).join(', ')}.\n`;
      out += d + `  final ${f.type.dart}${f.optional ? '?' : ''} ${f.name};\n\n`;
    }
    if (inputs.has(name) && fields.length) {
      out += `  /// A copy with the given properties replaced (null keeps the current value).\n`;
      out += `  ${name} copyWith({\n${fields.map((f) => `    ${f.type.dart}? ${f.name},\n`).join('')}  }) => ${name}(\n`;
      out += fields.map((f) => `    ${f.name}: ${f.name} ?? this.${f.name},\n`).join('') + '  );\n\n';
    }
    out += '  /// The JSON object the API expects; unset optional properties are left out.\n';
    out += '  Map<String, Object?> toJson() => {\n';
    for (const f of fields) {
      if (!f.optional) out += `    ${str(f.key)}: ${f.type.encode(f.name)},\n`;
      else if (f.required) out += `    ${str(f.key)}: ${f.type.simple ? f.name : `switch (${f.name}) { null => null, final v => ${f.type.encode('v')} }`},\n`;
      else if (f.type.simple) out += `    ${str(f.key)}: ?${f.name},\n`;
      else out += `    if (${f.name} case final v?) ${str(f.key)}: ${f.type.encode('v')},\n`;
    }
    out += '  };\n}\n';
    return out;
  }

  function renderMultipart(name, schema) {
    const fields = Object.entries(schema.properties).filter(([, s]) => s.format !== 'binary').map(([key, prop]) => {
      if (prop.type !== 'string') throw new Error(`${name}.${key}: multipart fields must be strings`);
      return { key, name: fieldName(key), description: prop.description, values: prop.enum };
    });
    let out = doc(schema.description ?? `Text fields of a multipart \`${name}\` request (the file is passed separately).`);
    out += `class ${name} {\n  /// Creates the text fields of a multipart request.\n`;
    out += `  const ${name}({\n${fields.map((f) => `    this.${f.name},\n`).join('')}  });\n\n`;
    for (const f of fields) {
      out += (f.description ? doc(f.description, '  ') : `  /// \`${f.key}\`.\n`);
      if (f.values?.length) out += `  ///\n  /// One of ${f.values.map((v) => `\`${v}\``).join(', ')}.\n`;
      out += `  final String? ${f.name};\n\n`;
    }
    out += '  /// The form fields; unset and empty values are left out.\n';
    out += '  Map<String, String> toFields() => {\n';
    for (const f of fields) out += `    if (${f.name} case final v? when v.isNotEmpty) ${str(f.key)}: v,\n`;
    out += '  };\n}\n';
    return out;
  }

  function renderOp(o) {
    const args = o.pathParams.map((p) => `String ${fieldName(p.name)}`);
    const named = [];
    if (o.body) named.push(o.bodyRequired ? `required ${o.body.dart} body` : `${o.body.dart}? body`);
    const entries = [];
    for (const q of o.query) {
      const t = typeOf(q.schema, `${pascal(o.name)}${pascal(q.name)}`);
      if (!['String', 'int', 'num', 'bool'].includes(t.dart)) throw new Error(`${o.name}: query ${q.name} must be a scalar`);
      const n = fieldName(q.name);
      named.push(`${q.required ? 'required ' : ''}${t.dart}${q.required ? '' : '?'} ${n}`);
      const text = (v) => (t.dart === 'String' ? v : `'$${v}'`);
      entries.push(q.required ? `        ${str(q.name)}: ${text(n)},\n` : t.dart === 'String' ? `        ${str(q.name)}: ?${n},\n` : `        if (${n} case final v?) ${str(q.name)}: ${text('v')},\n`);
    }
    named.push('bool? retry');
    const path = o.path.slice(PREFIX.length).replace(/\{(\w+)\}/g, (_, n) => `\${_segment(${fieldName(n)})}`);
    const queryMap = entries.length ? `      query: {\n${entries.join('')}      },\n` : '';
    const retry = o.method === 'GET' ? 'true' : 'false';
    const summary = [o.op.summary, o.op.description].filter(Boolean).map(escape).join('\n\n');
    const decode = (v) => `${o.result.dart}.fromJson(widgetJsonObject(${v}, ${str(o.name)}), ${str(o.name)})`;
    let out = doc(`${summary ? summary + '\n\n' : ''}\`${o.method} ${o.path}\` (\`${o.op.operationId}\`).`, '  ', true);
    out += `  Future<${o.result.dart}> ${o.name}(${[...args, `{${named.join(', ')}}`].join(', ')}) async {\n`;
    out += `    final data = await transport.send(WidgetRequest(\n      method: '${o.method}',\n      path: '$_base${path}',\n${queryMap}`;
    if (o.body) out += `      json: ${o.bodyRequired ? o.body.encode('body') : `body?.toJson()`},\n`;
    out += `      retry: retry ?? ${retry},\n    ));\n    return ${decode('data')};\n  }\n`;
    if (o.upload) {
      out += '\n' + doc(`Same as [${o.name}], with a file: a \`multipart/form-data\` request (\`${o.upload.file}\` plus [fields]).`, '  ', true);
      out += `  Future<${o.result.dart}> ${o.name}WithFile(${[...args, `{required WidgetFile file, ${o.upload.className} fields = const ${o.upload.className}(), bool? retry}`].join(', ')}) async {\n`;
      out += `    final data = await transport.send(WidgetRequest(\n      method: '${o.method}',\n      path: '$_base${path}',\n      fields: fields.toFields(),\n      file: file,\n      fileField: ${str(o.upload.file)},\n      retry: retry ?? false,\n    ));\n    return ${decode('data')};\n  }\n`;
    }
    return out;
  }

  const header = (what) => `// GENERATED by sdks/scripts/generate.mjs from the /v1/widget/* operations of
// backend/docs/openapi.yaml (${what}). Do not edit; run \`make sdks\`.
// dart format off
// ignore_for_file: lines_longer_than_80_chars, unnecessary_lambdas
`;

  const enumCode = [...enums].sort(([a], [b]) => a.localeCompare(b)).map(([name, values]) => {
    const s = schemas[name];
    let out = doc(s.description ?? `Values of \`${name}\` (the API may add more; fields keep the raw string).`);
    out += `abstract final class ${name} {\n`;
    for (const v of values) out += `  /// \`${v}\`.\n  static const String ${fieldName(v)} = ${str(v)};\n\n`;
    out += `  /// Every value this client knows.\n  static const List<String> values = [${values.map(fieldName).join(', ')}];\n}\n`;
    return out;
  });

  const models = `${header('models')}
/// Models of the ClickFix visitor API.
library;

${[...[...rendered].sort(([a], [b]) => a.localeCompare(b)).map(([, code]) => code), ...enumCode].join('\n')}
@@HELPERS@@
T? _optional<T extends Object>(Object? v, String at, T Function(Object e, String p) decode) =>
    v == null ? null : decode(v, at);

Never _invalid(String at, String expected, Object? v) =>
    throw FormatException('ClickFix visitor API: $at must be $expected, got \${v == null ? 'null' : v.runtimeType}');

Object _value(Object? v, String at) => v ?? _invalid(at, 'a value', v);

String _string(Object? v, String at) => v is String ? v : _invalid(at, 'a string', v);

int _int(Object? v, String at) => switch (v) {
  int() => v,
  double() when v == v.truncateToDouble() && v.isFinite => v.toInt(),
  _ => _invalid(at, 'an integer', v),
};

num _num(Object? v, String at) => v is num ? v : _invalid(at, 'a number', v);

bool _bool(Object? v, String at) => v is bool ? v : _invalid(at, 'a boolean', v);

DateTime _dateTime(Object? v, String at) =>
    DateTime.tryParse(_string(v, at)) ?? _invalid(at, 'an RFC 3339 date-time', v);

Map<String, Object?> _json(Object? v, String at) => v is Map<String, Object?> ? v : _invalid(at, 'an object', v);

// A Go nil slice is encoded as null: read it as an empty array.
List<T> _list<T>(Object? v, String at, T Function(Object? e, String p) decode) {
  if (v == null) return <T>[];
  if (v is! List<Object?>) _invalid(at, 'an array', v);
  return [for (var i = 0; i < v.length; i++) decode(v[i], '$at[$i]')];
}

Map<String, T> _mapOf<T>(Object? v, String at, T Function(Object? e, String p) decode) => {
  for (final e in _json(v, at).entries) e.key: decode(e.value, '$at.\${e.key}'),
};

/// The JSON object [v] (the \`data\` of a response), or a [FormatException]
/// naming [at]. Used by \`WidgetApi\` before a model's \`fromJson\`.
Map<String, Object?> widgetJsonObject(Object? v, String at) => _json(v, at);
`;

  const api = `${header('operations')}
/// Typed operations of the ClickFix visitor API.
library;

import '../transport.dart';
import 'models.dart';

/// Every \`/v1/widget/{public_id}/*\` operation the native client supports,
/// one method each. Requests go through [transport] (base URL, mobile app
/// key, visitor token, retries); this class only shapes paths, bodies and
/// results. Responses are unwrapped from the \`{success, data, meta}\`
/// envelope by the transport and decoded here.
class WidgetApi {
  /// Calls for the widget [publicId] (the public widget id from the panel).
  WidgetApi(this.transport, {required this.publicId});

  /// Sends the requests.
  final WidgetTransport transport;

  /// Public widget id.
  final String publicId;

  String get _base => '/v1/widget/\${_segment(publicId)}';

${ops.map(renderOp).join('\n')}}

String _segment(String value) => Uri.encodeComponent(value);
`;
  return { models: pruneHelpers(models), api };
}

// Keeps only the decode helpers the models use (unused private functions are
// analyzer warnings).
function pruneHelpers(models) {
  const [body, helpers] = models.split('@@HELPERS@@\n');
  const blocks = helpers.split('\n\n').map((code) => ({ code, name: /^(?:[\w<>?, ]+?) (_\w+)(?:<\w+>)?\(/.exec(code)?.[1] }));
  const used = (name, text) => new RegExp(`\\b${name}\\(`).test(text);
  let kept = blocks;
  for (let changed = true; changed; ) {
    const text = body + kept.map((b) => b.code.replace(/^[^(]*\(/, '(')).join('\n');
    const next = kept.filter((b) => !b.name || used(b.name, text));
    changed = next.length !== kept.length;
    kept = next;
  }
  return body + kept.map((b) => b.code).join('\n\n');
}
