'use strict';

// Strict, versioned named-object type declarations live in src/types/.
// Every key is written as field[type], e.g. requirements[array<Requirement>].
// A named object type is identified by its exact declared field names and types.
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const own = (x, k) => Object.prototype.hasOwnProperty.call(x, k);
const fence = String.fromCharCode(96).repeat(3);

function parseKey(key) {
  const found = /^([A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/.exec(key);
  if (!found) throw new Error('Unannotated or invalid schema key: ' + key);
  return {name:found[1],type:found[2]};
}

function checkTypeDeclaration(type, registry) {
  const base = type.endsWith('|null') ? type.slice(0,-5) : type;
  if (['string','number','boolean','null'].includes(base)) return;
  const obj = /^object<([A-Za-z_][A-Za-z0-9_]*)>$/.exec(base);
  const arr = /^array<([A-Za-z_][A-Za-z0-9_]*)>$/.exec(base);
  if (!obj && !arr) throw new Error('Unsupported field type: ' + type);
  if (!own(registry, (obj || arr)[1])) throw new Error('Undefined object type: ' + (obj || arr)[1]);
  if (arr && type.endsWith('|null')) throw new Error('Arrays must be actual arrays; use null only for reset records.');
}

// Require a complete closed-world type registry, and reject two named object
// types with the same key/type signature (their field names define identity).
function validateDefinition(root, registry) {
  if (!isObject(root) || !isObject(registry) || !Object.keys(registry).length) {
    throw new Error('Current Issue #1 record/template and named type registry are required.');
  }
  const signatures = new Map();
  const verify = (name, def) => {
    if (!isObject(def)) throw new Error('Object definition is not a JSON object: ' + name);
    const baseNames = new Set();
    for (const key of Object.keys(def)) {
      const parsed = parseKey(key);
      if (baseNames.has(parsed.name)) throw new Error('Duplicate logical field name in ' + name + ': ' + parsed.name);
      baseNames.add(parsed.name);
      checkTypeDeclaration(parsed.type, registry);
    }
    const signature = Object.keys(def).sort().join('|');
    if (name !== '$root') {
      if (signatures.has(signature)) throw new Error('Different named types with identical field signatures: ' + signatures.get(signature) + ', ' + name);
      signatures.set(signature, name);
    }
  };
  for (const [name, def] of Object.entries(registry)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error('Invalid named object type: ' + name);
    verify(name,def);
  }
  verify('$root',root);
  if (!own(root,'schema[string]') || typeof root['schema[string]'] !== 'string' ||
      !/^issuestack\.task\.v[0-9]+$/.test(root['schema[string]'])) {
    throw new Error('Missing supported version marker schema[string]');
  }
  for (const required of ['nonce[string]','source[object<Source>]','requirements[array<Requirement>]','completion[object<Completion>]']) {
    if (!own(root, required)) throw new Error('Missing required root declaration: ' + required);
  }
}

funcfunction readDefinition(body) {
  const regex = new RegExp(fence + 'json\\s*([\\s\\S]*?)\\s*' + fence, 'i');
  const block = String(body || '').match(regex);
  if (!block) throw new Error('Issue #1 has no JSON record template.');
  const template = JSON.parse(block[1]);
  if (template['schema[string]'] !== 'issuestack.task.v3') {
    throw new Error('No type registry is installed for the declared version.');
  }
  const registry = require('./types/issuestack.task.v3.json');
  validateDefinition(template, registry);
  return {template, registry};
}
ction nullRecord(model) {
  if (isObject(model)) return Object.fromEntries(Object.keys(model).map(k => [k,nullRecord(model[k])]));
  return null;
}

function validateValue(value, type, registry, path) {
  if (type.endsWith('|null')) {
    if (value === null) return null;
    return validateValue(value,type.slice(0,-5),registry,path);
  }
  if (type === 'null') return value === null ? null : path + ': expected null';
  if (type === 'string') return typeof value === 'string' ? null : path + ': expected string';
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value) ? null : path + ': expected number';
  if (type === 'boolean') return typeof value === 'boolean' ? null : path + ': expected boolean';
  const obj = /^object<(\w+)>$/.exec(type);
  if (obj) return validateShape(value, registry[obj[1]], registry, path);
  const arr = /^array<(\w+)>$/.exec(type);
  if (arr) {
    if (!Array.isArray(value)) return path + ': expected array of ' + arr[1];
    for (let i=0;i<value.length;i++) {
      const error = validateShape(value[i],registry[arr[1]],registry,path + '[' + i + ']');
      if (error) return error;
    }
    return null;
  }
  throw new Error('Unrecognized type: ' + type);
}

function validateShape(value, definition, registry, path = '$') {
  if (!isObject(value)) return path + ': expected typed object';
  const expected = Object.keys(definition);
  for (const key of Object.keys(value)) if (!own(definition,key)) return path + ': unexpected key ' + key;
  for (const key of expected) {
    if (!own(value,key)) return path + ': missing key ' + key;
    const err = validateValue(value[key],parseKey(key).type,registry,path + '.' + key);
    if (err) return err;
  }
  return null;
}

function validateIntake(record, definition, registry) {
  if (!isObject(record)) return 'top-level JSON object required';
  if (record['schema[string]'] !== definition['schema[string]']) return 'record version differs from current Issue #1 version';
  const mismatch = validateShape(record,definition,registry);
  if (mismatch) return mismatch;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(record['nonce[string]'])) return 'nonce is not a valid stable identifier';
  if (record['ordinal[number|null]'] !== null) return 'ordinal override not enabled at intake';
  const src = record['source[object<Source>]'];
  if (src['issue[number]'] !== 1 || src['comment_id[number|null]'] !== null) return 'source fields must be initialized for Issue #1';
  const explanation=record['interpretation[object<Interpretation>]'];
  const strings=[explanation['revised_instruction[string]'],...Object.values(explanation['user_intent[object<UserIntent>]'])];
  if (strings.some(s => typeof s !== 'string' || !s.trim() || /^<.*>$/.test(s.trim()))) return 'instruction/intent fields cannot be empty or placeholders';
  const ex=record['execution[object<Execution>]'];
  if (ex['status[string]'] !== 'pending' || ex['enqueued_at[string|null]'] !== null ||
      ex['started_at[string|null]'] !== null || ex['finished_at[string|null]'] !== null ||
      ex['worker[string|null]'] !== null) return 'execution fields must be unfilled on intake';
  const planning=record['planning[object<Planning>]'];
  if (planning['status[string]'] !== 'not_started' || record['decomposition[array<WorkItem>]'].length) return 'task decomposition belongs to the queued planning stage';
  const completed=record['completion[object<Completion>]'];
  for (const key of ['by_requirement[array<RequirementCompletion>]','artifacts[array<Artifact>]','validation[array<ValidationCheck>]','errors[array<ErrorEntry>]']) {
    if (completed[key].length) return 'completion arrays must be empty on intake';
  }
  if (completed['success[boolean|null]'] !== null || completed['summary[string|null]'] !== null || completed['receipt[object<Receipt>|null]'] !== null) return 'completion result reserved for workers';
  const requirements=record['requirements[array<Requirement>]'];
  const ids=new Set();
  for (const entry of requirements) {
    const id=entry['id[string]'];
    if (!id.trim() || ids.has(id) || !entry['description[string]'].trim() ||
        !entry['acceptance_criteria[array<AcceptanceCriterion>]'].length ||
        entry['acceptance_criteria[array<AcceptanceCriterion>]'].some(v=>!v['text[string]'].trim())) return 'invalid requirement ID, description, or acceptance criteria';
    ids.add(id);
  }
  for (const c of record['constraints[array<Constraint>]']) {
    if (!c['id[string]'].trim() || !c['description[string]'].trim() ||
        c['applies_to_requirement_ids[array<Reference>]'].some(ref=>!ids.has(ref['id[string]']))) return 'invalid constraint reference';
  }
  const remaining=completed['remaining_requirement_ids[array<Reference>]'].map(ref=>ref['id[string]']);
  if (remaining.length !== ids.size || remaining.some(id=>!ids.has(id)) || new Set(remaining).size !== ids.size) return 'remaining IDs must exactly match requirements';
  const audit=record['unrequested_changes[object<DeviationAudit>]'];
  if (Object.values(audit).some(a=>a.length)) return 'unrequested change audit must be empty on intake';
  return null;
}

module.exports = {parseKey,validateDefinition,readDefinition,nullRecord,validateShape,validateIntake};
