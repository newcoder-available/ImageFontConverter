import os
import sys
import cv2
import numpy as np

# Force UTF-8 on Windows stdout/stderr
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.orchestrator import LocalizationOrchestrator
from agents.classification_agent import TextClassificationAgent
from agents.glossary_manager import GlossaryManager
from sample_generator import create_gaming_ui_sample

def test_agents_and_e2e_booster():
    print("=== 1. Testing Text Classification Agent ===")
    classifier = TextClassificationAgent()
    
    # Test brand / URL / numbers
    c1, t1, h1 = classifier.classify_text("BOOSTER", box_w=400, box_h=80)
    assert c1 == "TRANSLATABLE", f"Expected TRANSLATABLE, got {c1}"
    assert t1 == "headline", f"Expected headline, got {t1}"
    print("  [PASS] 'BOOSTER' -> TRANSLATABLE, headline")

    c2, t2, _ = classifier.classify_text("https://example.com/play")
    assert c2 == "PROTECTED", f"Expected PROTECTED for URL, got {c2}"
    print("  [PASS] 'https://example.com/play' -> PROTECTED")

    c3, t3, _ = classifier.classify_text("$49.99")
    assert c3 == "PROTECTED", f"Expected PROTECTED for currency, got {c3}"
    print("  [PASS] '$49.99' -> PROTECTED")

    print("\n=== 2. Testing Multilingual Glossary Manager ===")
    glossary = GlossaryManager()
    terms = glossary.get_all_terms()
    print(f"  Loaded {len(terms)} default glossary terms.")
    g_dict = glossary.get_glossary_dict()
    assert "BOOSTER" in g_dict
    assert g_dict["BOOSTER"]["ja"] == "ブースター"
    assert g_dict["BOOSTER"]["hi"] == "बूस्टर"
    print("  [PASS] Glossary override for 'BOOSTER' -> 'ブースター' verified.")

    print("\n=== 3. Testing Orchestrator E2E Localization with QA ===")
    orchestrator = LocalizationOrchestrator()
    sample_path = create_gaming_ui_sample()
    img_bgr = cv2.imread(sample_path)
    assert img_bgr is not None

    # Analyze
    analysis, _, inpainted = orchestrator.analyze_image(img_bgr)
    print(f"  Source Language: {analysis.sourceLanguage} (confidence: {analysis.languageConfidence})")
    print(f"  Detected Script: {analysis.detectedScript}")
    print(f"  Detected {len(analysis.textBlocks)} text regions.")

    # Localize to Japanese (ja)
    variant_ja = orchestrator.localize_for_language(
        img_bgr=img_bgr,
        inpainted_bgr=inpainted,
        text_blocks=analysis.textBlocks,
        source_lang="English",
        target_lang="ja"
    )
    assert variant_ja.targetLanguage == "ja"
    assert variant_ja.qaResult is not None
    print(f"  [JA QA] Overall Score: {variant_ja.qaResult.overallScore}% Passed: {variant_ja.qaResult.overallPassed}")
    for b in variant_ja.textBlocks:
        print(f"    '{b.originalText}' -> '{b.translatedText}'")

    # Localize to Hindi (hi)
    variant_hi = orchestrator.localize_for_language(
        img_bgr=img_bgr,
        inpainted_bgr=inpainted,
        text_blocks=analysis.textBlocks,
        source_lang="English",
        target_lang="hi"
    )
    assert variant_hi.targetLanguage == "hi"
    print(f"  [HI QA] Overall Score: {variant_hi.qaResult.overallScore}% Passed: {variant_hi.qaResult.overallPassed}")

    # Localize to Arabic (ar RTL)
    variant_ar = orchestrator.localize_for_language(
        img_bgr=img_bgr,
        inpainted_bgr=inpainted,
        text_blocks=analysis.textBlocks,
        source_lang="English",
        target_lang="ar"
    )
    assert variant_ar.targetLanguage == "ar"
    print(f"  [AR QA] Overall Score: {variant_ar.qaResult.overallScore}% Passed: {variant_ar.qaResult.overallPassed}")

    print("\n=== ALL AGENT & E2E LOCALIZATION TESTS PASSED 100%! ===")

if __name__ == "__main__":
    test_agents_and_e2e_booster()
