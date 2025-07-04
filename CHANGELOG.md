# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---
## [0.0.6] - 2025-06-08

### Added
- Dual Attribute Rolls: The attribute roll button now supports tests using two attributes (e.g., Strength + Agility) instead of attribute + skill.
- Skill Recap Roll: Skills now show a clickable summary (`dX + dY`) that opens the roll dialog with correct dice and modifiers.
- Weapon Damage Calculation: Weapon entries can include Strength-based bonuses, using a new `STRENGTH_BONUS_TABLE` derived from the attribute die label.
- Favorite Toggle: Items now support favorite toggles, displayed with color-coded icons.
- Equip Slot Menu: Weapons and gear now show a context menu to change their equip location with icon and label updates.
- Attribute & Skill Die Helpers: `getDieLabel`, `getDieForStat`, and `getDieForSkill` added to support consistent die value resolution based on base die, value, and modifiers.

### Changed
- Health Bar Rendering: Enhanced to support bonus boxes and overlayed Physical and Stun damage bars. Uses Fortitude and optional config bonuses.
- Damage Penalty Logic: Now computed from total damage divided by a configurable threshold, with updates to `actorDamagePenalty`.
- Derived Stats Update: Guard, Movement, and Corruption Threshold now use flexible formulas based on die label parsing (e.g., `d12+2`).
- Roll Dialog Logic: Updated to support dual-attribute rolls, flexible die parsing, and dynamic labeling in chat output.
- Attribute Pip Logic: Now respects base die settings and caps pip-based increases to +4.
  
### Fixed
- Attribute Initialization: Ensures all six core attributes are initialized to a minimum of `3` if undefined.
- Skill Rendering: Properly updates die label and pip visuals when skill base die or value changes.
- Boons Display: Now correctly displays up to three d6 icons even when hidden inputs are suppressed by CSB.

## [0.0.5] - 2025-06-08

### Changed
- **Codebase Restructure**:
  
  - Split the core `axiom-csb.js` into modular subfiles for better maintainability.
  - Organized functionality into separate script files (e.g., `roll-dialog.js`, `init-hooks.js`, `actor-sheet.js`, etc.).
  - Main entry point now imports and registers modular components.

## [0.0.4] - 2025-06-08

### Added
- **Dice So Nice Integration**: Custom color sets for Attribute (Blue), Skill (Red), and Focus (Amber) dice.
- **Initiative Override**: Custom initiative formula using Agility, Resolve, and Focus. Keeps best two results. Results are sent to chat and shown via Dice So Nice.
- **Focus Die Coloring**: All rolls now color Attribute, Skill, and Focus dice appropriately using the Dice So Nice sets.
- **Roll Modifier UI**: Plus/minus buttons added to the skill roll dialog to adjust modifiers directly from the UI.

### Changed
- **Roll Dialog**:
  - Modifier calculation now includes attribute, skill, user, and penalty modifiers in a single total.
  - Chat output improved to show individual die rolls, modifiers, best two dice, and the final total with Complication warnings.
- **Skill Pip Display**: Replaced circular pips with pentagon-segment SVG visuals to match attribute style.
- **Attribute Pip Display**: Redesigned to use a 5-segment pentagon SVG, one segment per level.
- **Internal Cleanup**: Improved class structure and value handling across rendered inputs.

## [0.0.3] - 2025-06-08

### Added
- **Ammo Count**: Added the ability to click the ammo count to adjust quantity.

### Changed
- **Roll Dialog**: Now also counts modifiers.

## [0.0.2] - 2025-06-05

### Added
- **Roll Dialog**: A custom modal dialog appears when a skill test button is clicked, showing Attribute, Skill, Focus dice, and an optional modifier.
- **3-Die Roll Logic**: Rolls all three dice (Attribute, Skill, Focus), keeps the best two, and applies a modifier.
- **Roll Display**: Chat message includes individual die results and highlights which two were kept.
- **Pip Rendering**:
  - For Attributes and Skills using hidden range sliders.
  - Dynamic pip visuals update on slider/input changes.
- **Boons Display**: Boons shown as colored d6 icons based on value.
- **Health Bar**: Auto-calculated health boxes based on Fortitude die, showing Physical and Stun damage.
- **Derived Stats**: Guard, Toughness, Movement, and Corruption Threshold auto-calculated on actor sheet render based on attributes and skills.

## [0.0.1] - 2025-06-03
### Added
- Initial module folder structure (`scripts/`, `styles/`, `packs/`)
- Core files: `module.json`, `README.md`, `LICENSE`, `axiom-csb.js`, and stylesheets
- GitHub repository initialized at [github.com/QBallStan/axiom-csb](https://github.com/QBallStan/axiom-csb)
