---
name: multilingual-ocr-text-detection
description: Detect and map all visible text in images across multilingual scripts before localization. Use before editing text in an image.
---

# Multilingual OCR & Text Mapping

## Objective
Create an accurate internal map of every human-readable text element.

## Inspect
- Latin
- Cyrillic
- Greek
- Arabic
- Hebrew
- Indic scripts
- CJK scripts
- Japanese kana/kanji
- Korean Hangul
- Thai
- Vietnamese
- Mixed-script text
- Stylized text
- Rotated text
- Perspective text
- Text embedded in decorative artwork

## For each text region record
- Exact visible text
- Detected language/script
- Bounding region
- Reading direction
- Orientation
- Relative size
- Font characteristics
- Color
- Stroke
- Shadow
- Gradient
- Glow
- Bevel
- Extrusion
- Perspective

## Important
Do not assume the largest text is the only text.

Inspect corners, labels, badges, small print, UI elements and decorative text.

## Classification
Mark each region:
1. TRANSLATE
2. PRESERVE
3. REVIEW/AMBIGUOUS

Do not translate protected identifiers unless requested.
