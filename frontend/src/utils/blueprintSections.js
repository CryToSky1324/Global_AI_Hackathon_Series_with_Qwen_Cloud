export const BLUEPRINT_SECTIONS = [
  {
    id: 'executive_summary',
    label: 'Executive Summary',
    shortLabel: 'Summary',
    owner: 'Root Coordinator',
    aliases: [],
    headings: ['Executive Summary'],
  },
  {
    id: 'problem_statement',
    label: 'Problem Statement',
    shortLabel: 'Problem',
    owner: 'UX Researcher',
    aliases: ['ux_strategy'],
    headings: ['Problem Statement', 'UX Strategy', 'Customer Persona'],
  },
  {
    id: 'market_analysis',
    label: 'Market Analysis',
    shortLabel: 'Market',
    owner: 'Business Analyst',
    aliases: ['business_plan'],
    headings: ['Market Analysis', 'Business Model'],
  },
  {
    id: 'market_validation',
    label: 'Market Validation',
    shortLabel: 'Validation',
    owner: 'Research Agent',
    aliases: [],
    headings: ['Market Validation', 'Key Evidence'],
  },
  {
    id: 'product_mvp',
    label: 'Product & MVP',
    shortLabel: 'MVP',
    owner: 'Product Manager',
    aliases: ['mvp_scope', 'action_items'],
    headings: ['Product & MVP', 'MVP Definition', 'Proposed Solution'],
  },
  {
    id: 'technical_architecture',
    label: 'Technical Architecture',
    shortLabel: 'Technical',
    owner: 'Technical Lead',
    aliases: [],
    headings: ['Technical Architecture'],
  },
  {
    id: 'financial_plan',
    label: 'Financial Plan',
    shortLabel: 'Financial',
    owner: 'Finance Analyst',
    aliases: ['financial_projection'],
    headings: ['Financial Plan', 'Financial Analysis'],
  },
  {
    id: 'marketing_strategy',
    label: 'Marketing Strategy',
    shortLabel: 'Marketing',
    owner: 'Marketing Strategist',
    aliases: ['go_to_market', 'marketing_strategy'],
    headings: ['Marketing Strategy'],
  },
  {
    id: 'legal_compliance',
    label: 'Legal & Compliance',
    shortLabel: 'Legal',
    owner: 'Legal Advisor',
    aliases: [],
    headings: ['Legal & Compliance'],
  },
  {
    id: 'risk_assessment',
    label: 'Risk Assessment',
    shortLabel: 'Risk',
    owner: 'Risk & Compliance',
    aliases: [],
    headings: ['Risk Assessment'],
  },
  {
    id: 'implementation_roadmap',
    label: 'Implementation Roadmap',
    shortLabel: 'Roadmap',
    owner: 'Product Manager',
    aliases: [],
    headings: ['Implementation Roadmap'],
  },
  {
    id: 'final_recommendation',
    label: 'Final Recommendation',
    shortLabel: 'Decision',
    owner: 'Root Coordinator',
    aliases: [],
    headings: ['Final Recommendation'],
  },
];

const SECTION_ALIAS_MAP = BLUEPRINT_SECTIONS.reduce((acc, section) => {
  acc[section.id] = section.id;
  section.aliases.forEach((alias) => {
    acc[alias] = section.id;
  });
  return acc;
}, {});

export function normalizeBlueprintSectionKey(key) {
  const normalized = String(key || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return SECTION_ALIAS_MAP[normalized] || normalized;
}

export function getSection(sessionDetails, sectionId) {
  const sections = sessionDetails?.sections || {};
  const section = BLUEPRINT_SECTIONS.find((item) => item.id === sectionId);
  const candidateKeys = [sectionId, ...(section?.aliases || [])];

  for (const key of candidateKeys) {
    const value = sections[key];
    if (value) return normalizeSectionValue(value, section);
  }

  const finalReportContent = getFinalReportSectionContent(sessionDetails, sectionId);
  if (finalReportContent) {
    return normalizeSectionValue({ content: finalReportContent }, section);
  }

  return null;
}

export function getSectionContent(sessionDetails, sectionId) {
  return getSection(sessionDetails, sectionId)?.content || '';
}

export function getSectionMetadata(sessionDetails, sectionId) {
  return getSection(sessionDetails, sectionId)?.metadata || {};
}

export function countGeneratedSections(sessionDetails) {
  return BLUEPRINT_SECTIONS.filter((section) => getSectionContent(sessionDetails, section.id)).length;
}

export function extractContent(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    if (typeof value.content === 'string') return value.content.trim();
    if (typeof value.text === 'string') return value.text.trim();
    return '';
  }
  return String(value).trim();
}

export function mergeBlueprintSection(sections, rawKey, rawAfter) {
  const key = normalizeBlueprintSectionKey(rawKey);
  const previous = sections?.[key] || {};
  const next = typeof rawAfter === 'object' && rawAfter !== null ? rawAfter : { content: extractContent(rawAfter) };
  const nextContent = extractContent(next);
  const previousContent = extractContent(previous);

  if (!nextContent && previousContent) {
    return {
      ...sections,
      [key]: {
        ...next,
        content: previousContent,
        status: previous.status || next.status || 'draft',
        source: previous.source || next.source || 'previous',
      },
    };
  }

  return {
    ...sections,
    [key]: next,
  };
}

function normalizeSectionValue(value, section) {
  if (!value) return null;
  if (typeof value === 'string') {
    return {
      title: section?.label || '',
      owner: section?.owner || '',
      content: value.trim(),
      metadata: {},
      body: {},
    };
  }
  if (typeof value !== 'object') {
    return {
      title: section?.label || '',
      owner: section?.owner || '',
      content: String(value).trim(),
      metadata: {},
      body: {},
    };
  }
  return {
    title: value.title || section?.label || '',
    owner: value.owner || section?.owner || value.metadata?.validated_by || '',
    content: extractContent(value),
    metadata: value.metadata || {},
    body: value.body || {},
    status: value.status,
    source: value.source,
  };
}

function getFinalReportSectionContent(sessionDetails, sectionId) {
  const section = BLUEPRINT_SECTIONS.find((item) => item.id === sectionId);
  if (!section) return '';

  const reportText = getFinalReportText(sessionDetails);
  if (!reportText) return '';

  for (const heading of section.headings) {
    const body = extractMarkdownHeading(reportText, heading);
    if (body) return body;
  }

  return '';
}

function getFinalReportText(sessionDetails) {
  if (typeof sessionDetails?.summary === 'string' && sessionDetails.summary.trim()) {
    return sessionDetails.summary;
  }

  const decisions = Array.isArray(sessionDetails?.decision_log) ? sessionDetails.decision_log : [];
  for (let index = decisions.length - 1; index >= 0; index -= 1) {
    const summary = decisions[index]?.summary;
    if (typeof summary === 'string' && summary.trim()) return summary;
  }

  return '';
}

function extractMarkdownHeading(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^#\\s+${escaped}\\s*$`, 'im');
  const match = regex.exec(markdown);
  if (!match) return '';

  const rest = markdown.slice(match.index + match[0].length);
  const nextHeading = rest.search(/^#\s+/m);
  const body = (nextHeading >= 0 ? rest.slice(0, nextHeading) : rest).trim();
  if (!body || body === 'Insufficient information from the discussion.') return '';
  return body;
}
