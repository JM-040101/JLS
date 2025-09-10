# Exports Module – Purpose
Generate and bundle Claude-native documentation, README files, and executable prompts.

## Features

### File Generation Engine
#### Constraints
- *Must* follow ClaudeOps methodology for .md structure
- *Must* create modular files under 50KB each
- *Must* generate executable Claude Code prompts
- *Must* include MCP server references (supabase, playwright)

#### State / Flow
- Session complete → Parse answers → Apply templates → Generate file tree → Validate structure

### README Generation
#### Constraints
- *Must* create main README.md with project overview
- *Must* generate module-specific READMEs (auth, api, ui, etc.)
- *Must* include setup instructions and dependencies
- Should include architecture diagrams in ASCII

#### State / Flow
- Processed plan → Extract key info → Apply README templates → Generate markdown files

### Prompt Creation
#### Constraints
- *Must* create executable prompts for each feature
- *Must* reference appropriate MCP servers
- *Must* include context, constraints, and output format
- *Must* specify Claude Sonnet 4 as recommended model

#### State / Flow
- Feature identified → Create prompt template → Add MCP references → Format for Claude Code