# Claude Knowledge Base 1

[Add your first knowledge base content here for Claude Sonnet 4]

## Purpose
This knowledge base provides Claude with context for generating export files.

## Content

{
"meta": {
"name": "ClaudeOps Prompt Compiler",
"version": "1.2-mid",
"purpose": "Turn SaaS specs into Claude-ready prompt workflows and code.",
"chapters_map": {
"1_bootloader": true,
"2_flatten": true,
"3_prompt_arch": true,
"4_packs": true,
"5_vibe": true,
"6_chains": true,
"7_debug": true,
"8_system_design": true,
"9_model_aware": true,
"10_product_thinking": true
}
},
"feature_flags": {
"include_examples": true,
"include_pitfalls": true,
"include_model_awareness": true,
"include_product_thinking": true
},
"core_principles": {
"prompt_shape": ["Objective", "Context", "Constraints", "Output"],
"scope_layers": ["frontend", "backend", "infrastructure"],
"workflow": "Plan → Execute → Checkpoint → Test → Refine",
"prime_rule": "Fix the prompt, not the code",
"rationale": "Standard structure + explicit outputs reduce misfires and rework."
},
"bootloader": {
"files": ["CLAUDE.md", "ClaudeOps.json", "prompts/", "src/", "docs/", ".claude/"],
"memory_hierarchy": ["./CLAUDE.md", "~/.claude/CLAUDE.md", "./CLAUDE.local.md"],
"devbook_embed": "Place short <documents> summaries for DevBook + ClaudeOps at
top of CLAUDE.md.",
"examples_min": [
{
"pattern": "CLAUDE.md <documents> summary",
"why": "Ensures rules load before tasks for consistent generations.",
"snippet": "<documents>\\n# ClaudeOps: Use 4-part prompts; map outputs to file
paths.\\n# DevBook: Put Context before instructions.\\n</documents>"
}
]
},
"feature_flattening": {
"pattern": "## Features → modules; each split by FE/BE/INF",
"checklist": ["objective", "context", "constraints", "output_format"],
"examples_min": [
{
"module": "Workouts",
"frontend": "React pages/forms",
"backend": "REST endpoints + validation",
"infra": "DB tables + caching"
}
]
},
"prompt_architecture": {
"objective": "One clear sentence",
"context": "Only what’s needed; precede instructions",
"constraints": { "must": [], "should": [] },
"output_format": "Explicit files / schema / blocks",
"advanced_patterns": ["stacking", "fallbacks", "prefill"],
"pitfalls_min": [
{"pitfall": "Ambiguous verbs ('handle, manage')", "fix": "Replace with atomic actions and
file paths."},
{"pitfall": "No output spec", "fix": "Demand a file tree + fenced code blocks."}
]
},
"prompt_packs": {
"catalog": {
"auth": "Clerk/Supabase/JWT: routes, DB, middleware",
"stripe": "Plans, webhooks, UI",
"ui": "Tailwind + shadcn components",
"db": "Schemas/migrations",
"api": "REST/RPC + validation",
"email": "Transactional templates",
"deploy": "Vercel/Railway/CI configs"
},
"compose_hint": "Reference outputs of prior packs in Context to compose.",
"examples_min": [
{
"objective": "Create billing page + API",
"context": ["auth outputs present", "stripe pack available"],
"constraints": ["Must show plan/usage", "Must allow upgrade via Stripe"],
"output_format": ["pages/billing.tsx", "api/billing.ts", "migration.sql"]
}
]
},
"vibe_protocols": {
"output_mapping": "Map each file to folder",
"design_system": ["Tailwind", "shadcn"],
"naming": "Descriptive PascalCase components",
"layout_templates": ["DashboardLayout", "FormLayout", "ListLayout"],
"pitfalls_min": [
{"pitfall": "Scattered files", "fix": "Always specify full paths in Output."},
{"pitfall": "Inline styles", "fix": "Must use Tailwind utilities + shadcn imports."}
]
},
"build_chains": {
"steps": ["plan_tasks", "executor_prompts", "checkpoints", "tests/fallbacks"],
"state_recall": ["file_refs", "variable_mentions", "prompt_memory"],
"declarative_format": "YAML/JSON chain file",
"examples_min": [
"User model → signup page → subs API → billing page → dashboard"
]
},
"debugging": {
"checklist": [
"Objective specific?",
"Context sufficient (code, models, env)?",
"Constraints prioritized?",
"Output format defined?"
],
"common_errors": ["missing_imports", "wrong_stack_assumption", "hallucinated_logic"],
"fix_strategy": [
"Refine Objective/Constraints; add missing context to CLAUDE.md; rerun.",
"Use fallback prompt with failing test output only."
],
"examples_min": [
{
"case": "Webhook lacked signature verification",
"fix_prompt": {
"must": ["stripe.webhooks.constructEvent", "error handling + 4xx/5xx"],
"output": "api/payments.ts only"
}
}
]
},
"system_design": {
"packs_repo": "Versioned prompt library (auth@1.3.0 etc.)",
"project_config": "ClaudeOps.json declares language/framework/db/deploy/packs",
"roles": ["Prompt Architect", "Prompt Engineer", "Prompt Reviewer"],
"rationale": "Treat prompts like code: version, review, CI."
},
"model_awareness": {
"routing_rules_min": [
{"when": "long context + safety", "use": "Claude"},
{"when": "fast repetitive codegen", "use": "GPT-4o"},
{"when": "multimodal tasks", "use": "Gemini"}
],
"portability": [
"Avoid model-specific tags; prefer Markdown + JSON.",
"Keep context ≤ smallest target window; chunk otherwise."
],
"note": "Approx costs/limits evolve; check platform docs before routing."
},
"product_thinking": {
"use_cases": ["feature scoping", "user flows", "marketing copy", "docs"],
"mini_playbook": [
{"task": "Prioritize stories", "output": "table: story, priority, effort, deps"},
{"task": "Design upgrade flow", "output": "steps: screens, API, errors"},
{"task": "Launch email", "output": "subject, CTA, segment"}
]
},
"templates": {
"generic_prompt": {
"objective": "...",
"context": ["docs/code/packs refs"],
"constraints": ["must ...", "should ..."],
"output_format": ["file tree + fenced code blocks"]
},
"chain_yaml": {
"steps": [
{"name": "GenerateUserModel", "pack": "db"},
{"name": "GenerateSignupPage", "pack": "auth"},
{"name": "GenerateSubscriptionApi", "pack": "stripe"},
{"name": "GenerateDashboard", "pack": "ui"}
]
},
"claudeops_json": {
"language": "typescript",
"framework": "nextjs",
"database": "postgresql",
"authProvider": "clerk",
"deployment": "vercel",
"promptPacks": ["auth","stripe","ui","db","api","email","deploy"]
}
}
}
