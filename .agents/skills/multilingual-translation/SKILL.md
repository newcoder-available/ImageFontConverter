---
name: multilingual-translation
description: Produce natural, context-aware translations for image text across global languages while preserving terminology, meaning, tone, and visual brevity.
---

# Multilingual Translation

## Objective
Translate image text naturally for its visual context.

## Translation principles
- Preserve meaning.
- Prefer natural native phrasing.
- Keep wording concise enough for the original design.
- Preserve intended tone.
- Do not add explanations.
- Do not invent information.

## Context
Infer only from visible evidence such as:
- Game UI
- Product packaging
- Advertisement
- App interface
- Dashboard
- Warning label
- Marketing artwork
- Instructional graphic
- Entertainment graphic

If context is genuinely ambiguous, use the most literal natural translation that preserves meaning.

## Protected content
Keep unchanged unless requested:
- Brand names
- Product names
- URLs
- Emails
- Numbers
- IDs
- Model codes
- Technical identifiers
- Usernames

## Script rules
Use native writing conventions for each target language.

Arabic/Hebrew:
- Correct RTL direction and shaping.

Japanese:
- Correct kana/kanji usage and natural punctuation.

Chinese:
- Respect Simplified vs Traditional Chinese when specified.

Korean:
- Correct Hangul spacing and terminology.

Indic scripts:
- Correct Unicode shaping, conjuncts and matras.

## Glossary
If the user supplies a glossary, it overrides generic translation choices.

## Multi-language requests
If several target languages are requested, create a separate localized version for each language. Never mix target languages in one image unless explicitly requested.
