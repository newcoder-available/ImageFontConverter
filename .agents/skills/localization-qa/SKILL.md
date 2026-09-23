---
name: localization-qa
description: Validate multilingual image localization output against the source image for translation accuracy, text completeness, typography, layout, and visual integrity.
---

# Multilingual Localization QA

## Objective
Catch errors before the localized image is returned.

## Translation checks
- Every translatable text region was handled.
- No requested text was omitted.
- Translation is natural and contextually correct.
- No unintended translation occurred.
- No extra wording was introduced.
- Characters are correctly spelled and rendered.

## Script checks
- Correct target script
- Correct Unicode characters
- Correct shaping
- Correct RTL/LTR behavior
- Correct punctuation
- Correct Simplified/Traditional choice where applicable

## Visual checks
- Background unchanged
- Non-text objects unchanged
- Canvas unchanged
- Aspect ratio unchanged
- Transparency preserved
- Text remains within original region
- Typography visually matches
- Colors match
- Effects match
- Perspective matches
- No overlap
- No clipping

## Final decision
If any major issue is detected, perform a correction pass before output.

Do not return a partially localized image when the issue can be corrected.
