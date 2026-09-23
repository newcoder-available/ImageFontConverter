---
name: multilingual-image-localization
description: Localize text in existing images into any requested target language while preserving the original artwork, layout, typography, visual effects, transparency, and non-text elements. Use for multilingual image translation and localization tasks.
---

# Multilingual Image Localization

## Mission
Translate visible text in an existing image into the user's requested target language while preserving the original artwork as faithfully as possible.

This is an IMAGE LOCALIZATION task, not a redesign task.

## Golden Rule
Treat the source image as the visual source of truth.

Only modify pixels belonging to requested text regions. Protect everything else.

## Required inputs
- Source image
- Target language
- Optional translation instructions
- Optional glossary/brand terminology

## Workflow
1. Inspect the entire image.
2. Detect every meaningful text region.
3. Identify source language for each region.
4. Classify text: translatable, protected, or ambiguous.
5. Translate translatable text into the requested target language.
6. Select script-appropriate typography.
7. Replace only the text regions.
8. Reproduce original text effects.
9. Fit translated text into the original region.
10. Compare output against the source.
11. Run localization QA.
12. Return the localized image.

## Preserve
- Canvas size and aspect ratio
- Background
- Transparency
- Objects and illustrations
- Characters and faces
- Logos and brand marks
- Icons
- Colors
- Lighting
- Shadows
- Gradients
- Textures
- Perspective
- Composition
- Position and hierarchy

## Text preservation
Preserve unless explicitly asked to translate:
- Brand names
- Product names
- Proper nouns
- URLs
- Email addresses
- Numbers
- Measurements
- Model numbers
- Technical identifiers
- Usernames
- Legal identifiers

## Typography
Match:
- Font weight
- Font width
- Font height
- Size
- Alignment
- Tracking
- Kerning
- Perspective
- Rotation
- Stroke
- Shadow
- Glow
- Bevel
- Extrusion
- Gradient
- Highlights
- Reflections
- Texture

Use a native typeface for the target script when the original font does not support it.

## Text fitting
If translated text is longer:
- Reduce font size minimally.
- Adjust tracking minimally.
- Use controlled horizontal scaling only if necessary.

If shorter:
- Preserve visual prominence.
- Keep the visual footprint close to the source.

Never overlap protected artwork.

## Supported language families
Handle Latin, Cyrillic, Greek, Arabic, Hebrew, Devanagari, Bengali, Gurmukhi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Sinhala, Thai, Lao, Khmer, Myanmar, Japanese, Simplified Chinese, Traditional Chinese, Korean, Vietnamese and other Unicode scripts.

Never invent or approximate characters.

## Output
Return a visually faithful localized image. Do not add explanatory text inside the artwork.
