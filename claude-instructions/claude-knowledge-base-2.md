# Claude Knowledge Base 2

[Add your second knowledge base content here for Claude Sonnet 4]

## Purpose
This knowledge base provides additional context for Claude when generating export files.

## Content

{
"meta": {
"name": "Claude DevBook — Architecting Claude’s Mind (Midweight)",
"version": "1.0-mid",
"purpose": "Train Claude to parse, prioritise, and execute from structured Markdown
systems (CLAUDE.md + modules).",
"chapters_map": {
"1_mental_stack": true,
"2_source_of_truth": true,
"3_prompt_protocols": true,
"4_multi_doc_systems": true,
"5_testing_debugging": true,
"6_context_management": true,
"7_safe_design_patterns": true,
"8_doc_arch_templates": true,
"9_dual_audience_writing": true,
"10_future_of_claudeops": true
}
},
"feature_flags": {
"include_examples": true,
"include_pitfalls": true,
"include_checklists": true,
"include_templates": true
},
"mental_stack": {
"principles": {
"heading_hierarchy": "# sets global; ## features; ### details; #### inner logic",
"format_weighting": "bold = must; italics = should; plain = info",
"list_semantics": "ordered = sequence; unordered = grouped constraints",
"scan_order": ["cwd/CLAUDE.md", "parents", "children", "~/.claude/CLAUDE.md"],
"brevity_rule": "Keep core files lean; push depth to linked docs"
},
"why": "Claude builds an internal call stack from headings/formatting; structure = control.",
"examples_min": [
{
"good": "# Task Manager\n## Auth\n### /login\n#### Validation: username 3–20
chars",
"bad": "# API\n### /login\n# Authentication",
"note": "Sequential levels prevent scope confusion."
}
],
"pitfalls_min": [
{"pitfall": "Skipping levels (H1→H3)", "fix": "Use contiguous levels; split into module file if
going past H4."},
{"pitfall": "Overusing bold", "fix": "Reserve **bold** for non-negotiables; demote
guidelines to *italics*."}
],
"_refs": ["DevBook: mental stack, headings, emphasis, load order, 50KB guidance."]
},
"source_of_truth": {
"role": "CLAUDE.md acts as OS: objective → modules → features → functions; links to
module files.",
"layout_skeleton": {
"h1": "Objective",
"h2_modules": ["Auth", "API", "UI"],
"cross_links": ["Claude-auth.md", "Claude-api.md", "Claude-ui.md"],
"embedded_state": "JSON/YAML blocks for vars/versions"
},
"rules": [
"Put critical constraints near top; background lower or in linked docs.",
"Keep each file < ~50KB; split by module; avoid circular links."
],
"examples_min": [
{
"root": "# Objective: Subscription SaaS\n## Modules\n- **Auth** – [Claude-auth.md]\n-
**Billing** – [Claude-billing.md]\n- **UI** – [Claude-ui.md]",
"module_header": "# Scope: Auth Module\nThis file defines auth rules only."
},
{
"embedded_json": "```json\n{\"version\":\"1.2.3\",\"envs\":[\"staging\",\"prod\"]}\n```",
"why": "Keeps values in-model without extra fetch."
}
],
"pitfalls_min": [
{"pitfall": "Broken links / circular references", "fix": "Root links to children; children link
back to root; siblings never link directly."},
{"pitfall": "Monolithic CLAUDE.md", "fix": "Split modules (Claude-*.md) and link."}
],
"_refs": ["DevBook: CLAUDE.md as OS; cross-file linking; size optimisation; embedded
context."]
},
"prompt_protocols": {
"shape": ["Objective", "Context", "Constraints", "Output_Format"],
"enhancers": ["few_shot_3_to_5", "chain_of_thought_when_complex", "xml_tagging",
"role_prompt", "prefill_structured_output", "prompt_chaining"],
"checklist": [
"Objective: 1 sentence; unambiguous",
"Context: audience, purpose, inputs",
"Constraints: ordered by priority (bold/italics)",
"Output: explicit format (JSON/XML/paths/blocks)"
],
"templates": {
"four_part_prompt": {
"objective": "...",
"context": ["audience", "inputs", "purpose"],
"constraints": ["**must …**", "*should …*", "avoid …"],
"output_format": "e.g., return only `src/api/payments.ts` in fenced code"
},
"xml_wrapper":
"<instructions><objective>...</objective><context>...</context><constraints><critical>...</crit
ical></constraints><output_format>markdown|json</output_format></instructions>"
},
"examples_min": [
{
"few_shot": "<example><input>Q?</input><output>A.</output></example> × 3–5",
"prefill": "{\n \"summary\": \"\",\n \"insights\": [],\n \"actions\": []\n}"
}
],
"pitfalls_min": [
{"pitfall": "Vague constraints (e.g., 'be concise')", "fix": "Quantify: '≤150 words; ≤7
bullets'."},
{"pitfall": "Missing output spec", "fix": "Force exact paths + fenced code blocks."}
],
"_refs": ["DevBook: prompt engineering protocols; Anthropic best practices."]
},
"multi_doc_systems": {
"when_to_split": ["approach size limit", "independent module ownership", "distinct domain
logic"],
"naming": "Claude-<module>.md next to code for locality",
"load_priority": [".claude/overrides", "current dir", "parents", "home"],
"reference_rules": [
"Root → children only",
"Children → root only",
"Shared types in third file (Claude-schema.md) to avoid loops"
],
"examples_min": [
"Monorepo: services/{auth,billing,notifications}/Claude-service.md + root CLAUDE.md",
"Shared schemas: Claude-schema.md referenced by API and Data docs"
],
"pitfalls_min": [
{"pitfall": "Deep nesting across many micro-files", "fix": "Prefer module-level granularity;
avoid fragmentation."},
{"pitfall": "Unscoped module docs", "fix": "Begin with `# Scope:` clarifier."}
],
"_refs": ["DevBook: ClaudeOS and multi-doc architecture."]
},
"testing_debugging": {
"philosophy": "Catch misfires early; refine prompts not just code.",
"success_criteria": "Define measurable thresholds (e.g., accuracy ≥90%, word count
≤200).",
"test_assets": ["nominal cases", "edge cases", "automated grading scripts"],
"guardrails": ["hallucination minimisation: allow 'I don't know'", "format consistency via
prefill", "jailbreak mitigation via sanitised inputs + strong system"],
"templates": {
"test_plan": {
"objective": "",
"criteria": ["metric:threshold", "metric:threshold"],
"cases_table": "ID | Input | Expected | Metric",
"results": []
}
},
"examples_min": [
{"task": "Summarisation batch", "criteria": ["≤200 words", "≥3 key points"], "automation":
"scripted checks"},
{"task": "Stripe webhook", "criteria": ["signature verified", "4xx/5xx on errors"], "debug":
"use failing test output in fallback prompt"}
],
"pitfalls_min": [
{"pitfall": "No baseline", "fix": "Define SMART criteria before testing."},
{"pitfall": "Manual grading only", "fix": "Automate comparisons for scale."}
],
"_refs": ["DevBook: testing & debugging chapters."]
},
"context_management": {
"budgeting": "Plan token split: docs vs prompt vs response; prefer summaries over raw
dumps.",
"snapshotting": "Carry forward short, dated summaries of prior steps.",
"timeline_stacking": "Chronological blocks; newest on top.",
"reference_minimisation": "Link or index rather than repeat content.",
"templates": {
"context_budget": {
"documents_tokens": 5000,
"user_instructions_tokens": 2000,
"response_tokens": 3000,
"notes": "Adjust per model window."
},
"conversation_summary_block": "- Decision: ...\n- Rationale: ...\n- Next: ..."
},
"pitfalls_min": [
{"pitfall": "Overflowing context", "fix": "Summarise; keep core under budget."},
{"pitfall": "Unclear snapshots", "fix": "Use bullet decisions + next steps."}
],
"_refs": ["DevBook: context budgeting, snapshotting, timeline stacking."]
},
"safe_design_patterns": {
"repeatable_structures": ["consistent heading levels", "4-part prompts", "separate lists and
code blocks"],
"api_tool_schema_pattern": "### Endpoint: /users/{id}\n- **Method:** GET\n- **Inputs:**
id:string\n- **Responses:** 200 JSON | 404 Error",
"markdown_clarity": ["use --- for major separators", "label code blocks with language",
"add anchors when linking internally"],
"pitfalls_min": [
{"pitfall": "Nested code blocks inside list items", "fix": "Move code blocks to sibling level
with their own heading."},
{"pitfall": "Conflicting bold constraints", "fix": "Order by priority; avoid contradictions."}
],
"checklist": [
"No skipped heading levels",
"No mixed YAML/JSON inside a bullet",
"File paths explicit in outputs",
"Constraints prioritised (bold/italics)"
],
"_refs": ["DevBook: safe patterns vs anti-patterns."]
},
"doc_arch_templates": {
"saas": {
"objective": "Subscriptions + billing web app",
"modules": ["Auth", "Billing", "Frontend"],
"arch_yaml": "components: [auth_service, billing_service, frontend]\nconnections:
[auth_service->billing_service, frontend->auth_service]",
"onboarding": ["clone", "npm i", "configure .env", "npm start"]
},
"api": {
"endpoints_table": [
{"method": "GET", "path": "/users/{id}", "desc": "Retrieve user"},
{"method": "POST", "path": "/payments", "desc": "Create payment"},
{"method": "GET", "path": "/status", "desc": "Health check"}
],
"auth": ["**JWT required**", "*expiry 30m*"],
"errors_json": {"400":"Bad Request","401":"Unauthorized","500":"Internal Server Error"}
},
"frontend": {
"pages": [
{"name": "Login", "route": "/login"},
{"name": "Dashboard", "route": "/dashboard"},
{"name": "Billing", "route": "/billing"}
],
"styling": ["**Use Tailwind**", "*prefer dark mode*"],
"components": ["Button","Modal","Form"]
},
"prompt_triggers": [
{"name": "create_subscription", "tool": "subscriptions.create", "when": "on plan
purchase", "payload": {"userId":"string","planId":"string"}, "on_success": "update billing
status"}
],
"pitfalls_min": [
{"pitfall": "One-size-fits-all templates", "fix": "Adapt scaffolds to domain; add triggers for
real tools."},
{"pitfall": "Unstructured YAML/JSON mixing", "fix": "Keep formats separate, label
blocks."}
],
"_refs": ["DevBook: SaaS/API/Frontend scaffolds & triggers."]
},
"dual_audience_writing": {
"principle": "Write for Claude and humans simultaneously: explicit structure for the model;
short rationale for people.",
"pattern": {
"for_model": "Headings, tables, JSON/YAML code blocks, explicit outputs",
"for_humans": "1–2 line rationale per section, examples, warnings"
},
"checklist": ["state audience", "avoid ambiguous labels", "quantify constraints", "link deep
docs"],
"_refs": ["DevBook: Dual-audience writing chapter."]
},
"future_of_claudeops": {
"direction": ["richer prompt libraries", "CI for prompts", "versioned packs", "agentic triggers
tied to docs"],
"actionables": ["version templates", "store acceptance criteria next to outputs", "automate
doc linting"],
"_refs": ["DevBook: forward-looking guidance."]
}
}