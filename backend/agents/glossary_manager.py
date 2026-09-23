import json
import os
from typing import Dict, List, Optional
from models import GlossaryTerm

GLOSSARY_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp", "glossary.json")

class GlossaryManager:
    """Manages custom multilingual terminology and brand name overrides."""
    def __init__(self):
        self.terms: Dict[str, GlossaryTerm] = {}
        self._load_default_glossary()

    def _load_default_glossary(self):
        # Pre-seed with the standard benchmark terms
        default_seed = [
            GlossaryTerm(
                id="term_001",
                sourceText="BOOSTER",
                translations={
                    "ja": "ブースター",
                    "hi": "बूस्टर",
                    "zh-CN": "助推器",
                    "ko": "부스터",
                    "de": "BOOSTER",
                    "fr": "BOOSTER",
                    "es": "PROPULSOR",
                    "ar": "معزز",
                    "he": "מאיץ",
                    "ru": "УСКОРИТЕЛЬ"
                },
                category="Gaming Powerups",
                notes="Standard power-up item"
            ),
            GlossaryTerm(
                id="term_002",
                sourceText="START GAME",
                translations={
                    "ja": "ゲーム開始",
                    "hi": "खेल शुरू करें",
                    "zh-CN": "开始游戏",
                    "ko": "게임 시작",
                    "fr": "COMMENCER LA PARTIE",
                    "de": "SPIEL STARTEN",
                    "es": "INICIAR JUEGO",
                    "ar": "ابدأ اللعبة"
                },
                category="UI Action",
                notes="Primary CTA button"
            )
        ]
        for t in default_seed:
            self.terms[t.sourceText.upper()] = t

        # Load from disk if exists
        if os.path.exists(GLOSSARY_FILE):
            try:
                with open(GLOSSARY_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        term = GlossaryTerm(**item)
                        self.terms[term.sourceText.upper()] = term
            except Exception:
                pass

    def _save_to_disk(self):
        try:
            os.makedirs(os.path.dirname(GLOSSARY_FILE), exist_ok=True)
            with open(GLOSSARY_FILE, "w", encoding="utf-8") as f:
                json.dump([t.model_dump() for t in self.terms.values()], f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def get_all_terms(self) -> List[GlossaryTerm]:
        return list(self.terms.values())

    def get_glossary_dict(self) -> Dict[str, Dict[str, str]]:
        """Returns dictionary of {UPPER_SOURCE: {LANG_CODE: TRANSLATION}}."""
        return {k: v.translations for k, v in self.terms.items()}

    def add_or_update_term(self, term: GlossaryTerm) -> GlossaryTerm:
        self.terms[term.sourceText.upper()] = term
        self._save_to_disk()
        return term

    def delete_term(self, term_id: str) -> bool:
        to_delete = None
        for k, v in self.terms.items():
            if v.id == term_id:
                to_delete = k
                break
        if to_delete:
            del self.terms[to_delete]
            self._save_to_disk()
            return True
        return False
