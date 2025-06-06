# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

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
