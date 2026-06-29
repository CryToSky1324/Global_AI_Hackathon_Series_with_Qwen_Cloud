import re
from typing import Dict, List

from ..models import (
    BLUEPRINT_SECTION_DEFINITIONS,
    BLUEPRINT_TEMPLATE_VERSION,
    CANONICAL_SECTIONS,
    ChatSession,
    ImpactAssessment,
    normalize_section_key,
)


class SessionProjectorMixin:
    def _hydrate_session_memory(self, session: ChatSession):
        if session.research_brief:
            self.memory_store.add_agent_memory(
                getattr(self, "PRODUCT_MANAGER_ROLE", "Product Manager"),
                "Prior Research Brief",
                self._compress_text(session.research_brief, 1400),
            )
        for agent_name, brief in session.agent_briefs.items():
            if agent_name in self.agents:
                self.memory_store.add_agent_memory(
                    agent_name,
                    "Prior Agent Brief",
                    self._compress_text(brief, 1200),
                )

    def _findings_from_session(
        self,
        session: ChatSession,
        agents_needed: List[str] | None = None,
    ) -> List[Dict]:
        agents_needed = agents_needed or list(self.agents.keys())
        findings = []
        for agent_name in agents_needed:
            if agent_name not in self.agents:
                continue
            content = session.agent_briefs.get(agent_name)
            if not content:
                content = f"Prior session research brief: {session.research_brief}"
            findings.append(
                {
                    "agent": agent_name,
                    "content": self._compress_text(content, 1800),
                }
            )
        if not findings:
            findings.append(
                {
                    "agent": self.COORDINATOR_ROLE,
                    "content": self._compress_text(session.research_brief, 1800),
                }
            )
        return findings

    def _build_initial_sections(self, task: str, summary_text: str) -> Dict:
        generated = getattr(self, "generated_blueprint_sections", {}) or {}
        if generated:
            return {
                section: self._normalize_projected_section(
                    section,
                    generated.get(section),
                    task,
                    source="initial_run",
                    status="draft",
                )
                for section in CANONICAL_SECTIONS
            }

        summary = summary_text or "No final blueprint was produced."
        report_sections = self._sections_from_final_report(summary)
        sections = {}
        for section in CANONICAL_SECTIONS:
            section_content = report_sections.get(section) or self._section_content(
                section,
                summary,
            )
            sections[section] = self._normalize_projected_section(
                section,
                {"content": section_content},
                task,
                source="initial_run",
                status="draft",
            )
        return sections

    def _build_refinement_section_updates(
        self,
        session: ChatSession,
        request: str,
        impact: ImpactAssessment,
        summary_text: str,
    ) -> Dict:
        updates = {}
        for section in impact.affected_sections:
            section = normalize_section_key(section)
            if section not in CANONICAL_SECTIONS:
                continue
            previous = session.sections.get(section, {})
            generated = getattr(self, "generated_blueprint_sections", {}) or {}
            section_payload = generated.get(section)
            if not section_payload:
                section_payload = {"content": self._section_content(section, summary_text)}
            updates[section] = self._normalize_projected_section(
                section,
                section_payload,
                getattr(session, "user_idea", "") or request,
                source="refinement",
                status="updated",
                extra={
                    "request": request,
                    "previous": previous,
                    "impact_rationale": impact.rationale,
                },
            )
        return updates

    def _section_content(self, section: str, summary: str) -> str:
        definition = BLUEPRINT_SECTION_DEFINITIONS.get(section, {})
        label = definition.get("title", section.replace("_", " ").title())
        basis = summary or "No synthesized blueprint output was available."
        return self._compress_text(f"{label}: {basis}", 2200)

    def _normalize_projected_section(
        self,
        section: str,
        payload,
        user_idea: str,
        source: str,
        status: str,
        extra: Dict | None = None,
    ) -> Dict:
        definition = BLUEPRINT_SECTION_DEFINITIONS.get(section, {})
        payload = payload if isinstance(payload, dict) else {"content": str(payload or "")}
        body = payload.get("body") if isinstance(payload.get("body"), dict) else {}
        metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        owner = payload.get("owner") or definition.get("owner", "Root Coordinator")
        title = payload.get("title") or definition.get("title", section.replace("_", " ").title())
        content = str(payload.get("content") or "").strip()
        if not content:
            content = self._format_section_body(body, title, owner)

        normalized = {
            "title": title,
            "owner": owner,
            "content": content,
            "body": body,
            "metadata": {
                "validated_by": metadata.get("validated_by") or owner,
                "launch_confidence": self._coerce_confidence(
                    metadata.get("launch_confidence", 0)
                ),
                "research_coverage": metadata.get("research_coverage") or "0 / 0 Objectives",
                "consensus_level": metadata.get("consensus_level") or "Weak",
            },
            "status": payload.get("status") or status,
            "source": payload.get("source") or source,
            "user_idea": payload.get("user_idea") or user_idea,
            "template_version": payload.get("template_version") or BLUEPRINT_TEMPLATE_VERSION,
        }
        if extra:
            normalized.update(extra)
        return normalized

    def _coerce_confidence(self, value) -> int:
        try:
            return max(0, min(100, int(float(str(value).replace("%", "").strip() or 0))))
        except (TypeError, ValueError):
            return 0

    def _format_section_body(self, body: Dict, title: str, owner: str) -> str:
        def text(name: str, fallback: str = "Not specified."):
            value = body.get(name)
            if isinstance(value, list):
                return "\n".join(f"- {item}" for item in value if str(item).strip()) or fallback
            return str(value or fallback).strip()

        confidence = body.get("launch_confidence", 0)
        return (
            f"## {title}\n\n"
            f"### Objective\n{text('objective')}\n\n"
            f"### Key Findings\n{text('key_findings')}\n\n"
            f"### Supporting Evidence\n{text('supporting_evidence')}\n\n"
            f"### Risks\n{text('risks')}\n\n"
            f"### Mitigation Strategy\n{text('mitigation_strategy')}\n\n"
            f"### Recommendation\n{text('recommendation')}\n\n"
            f"### Launch Confidence\n{confidence}%\n\n"
            f"### Confidence Explanation\n{text('confidence_explanation')}\n\n"
            f"### Validated By\n{body.get('validated_by') or owner}"
        )

    def _merge_section_update(self, before: Dict | None, after: Dict | None) -> Dict:
        before = before if isinstance(before, dict) else {}
        after = after if isinstance(after, dict) else {}
        previous_content = str(before.get("content") or "").strip()
        next_content = str(after.get("content") or "").strip()
        if next_content:
            return after
        if previous_content:
            merged = dict(after)
            merged["content"] = previous_content
            merged["status"] = before.get("status", merged.get("status", "draft"))
            merged["source"] = before.get("source", merged.get("source", "previous"))
            return merged
        return after

    def _sections_from_final_report(self, report: str) -> Dict[str, str]:
        heading_map = {
            "Executive Summary": "executive_summary",
            "Problem Statement": "problem_statement",
            "Market Analysis": "market_analysis",
            "Market Validation": "market_validation",
            "Product & MVP": "product_mvp",
            "MVP Definition": "product_mvp",
            "Technical Architecture": "technical_architecture",
            "Financial Analysis": "financial_plan",
            "Financial Plan": "financial_plan",
            "Marketing Strategy": "marketing_strategy",
            "Legal & Compliance": "legal_compliance",
            "Risk Assessment": "risk_assessment",
            "Implementation Roadmap": "implementation_roadmap",
            "Final Recommendation": "final_recommendation",
            "Business Model": "market_analysis",
        }
        extracted: Dict[str, str] = {}
        text = str(report or "").replace("\r\n", "\n").replace("\r", "\n")
        for match in re.finditer(r"(?m)^#\s+(.+?)\s*$", text):
            heading = match.group(1).strip()
            key = heading_map.get(heading)
            if not key:
                continue
            next_match = re.search(r"(?m)^#\s+", text[match.end() :])
            end = match.end() + next_match.start() if next_match else len(text)
            body = text[match.end() : end].strip()
            if self._is_usable_section_content(body):
                extracted.setdefault(key, self._compress_text(body, 2200))
        return extracted

    def _is_usable_section_content(self, content: str) -> bool:
        text = str(content or "").strip()
        if not text:
            return False
        missing = getattr(self, "REPORT_MISSING_TEXT", "Insufficient information from the discussion.")
        if text == missing:
            return False
        return True
