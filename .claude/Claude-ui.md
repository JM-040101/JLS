# UI Module – Purpose
Provide responsive web interface for the 12-phase blueprint workflow with progress tracking and exports.

## Features

### Landing Page
#### Constraints
- **Must** use Tailwind CSS with blueprint aesthetic (navy, white, cyan accents)
- **Must** include pricing section with single tier (£14.99/mo)
- **Must** have clear value proposition and demo preview
- *Should* include testimonials and feature highlights

#### State / Flow
- User visits → See hero section → Pricing → Sign up → Payment → Dashboard

### Phase Progression Interface
#### Constraints
- **Must** display all 12 phases with progress indicator
- **Must** prevent skipping phases (sequential completion)
- **Must** save answers automatically as user types
- **Must** show tooltips and guidance for each phase
- *Should* include estimated time remaining

#### State / Flow
- User starts Phase 1 → Completes questions → Auto-saves → Unlocks Phase 2 → Repeat

### Export Interface
#### Constraints
- **Must** generate preview of all files before export
- **Must** bundle files into ZIP with proper structure
- **Must** include CLAUDE.md + module files + prompts
- *Should* show export history and allow re-downloads

#### State / Flow
- All phases complete → Generate files → Show preview → User confirms → ZIP download