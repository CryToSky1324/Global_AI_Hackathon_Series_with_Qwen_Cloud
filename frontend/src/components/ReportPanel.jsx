import React, { useState } from 'react';
import { FileText, BadgeCheck, BarChart3, DollarSign, Map, AlertCircle, ShieldCheck, Rocket, Scale, SearchCheck, Target } from 'lucide-react';
import { BLUEPRINT_SECTIONS, getSection } from '../utils/blueprintSections';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Map },
  ...BLUEPRINT_SECTIONS.map((section) => ({
    id: section.id,
    label: section.shortLabel,
    icon: {
      executive_summary: BadgeCheck,
      problem_statement: Target,
      market_analysis: BarChart3,
      market_validation: SearchCheck,
      financial_plan: DollarSign,
      marketing_strategy: Rocket,
      legal_compliance: Scale,
      risk_assessment: ShieldCheck,
    }[section.id] || FileText,
  })),
];

function EmptySection({ children }) {
  return <p className="report-empty-copy">{children}</p>;
}

export default function ReportPanel({ sessionDetails }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!sessionDetails) {
    return (
      <div className="report-container">
        <div className="report-placeholder">
          <FileText size={48} className="text-muted" />
          <h3>Startup Blueprint</h3>
          <p>
            Select a saved session or generate a new boardroom run to view the
            final investor-ready output.
          </p>
        </div>
      </div>
    );
  }

  const { user_idea, research_brief } = sessionDetails;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': {
        let pmPlan = '';
        let researchSummary = '';
        let sources = [];

        if (research_brief) {
          pmPlan = research_brief.pm_research_plan || '';
          if (research_brief.research) {
            researchSummary = research_brief.research.research_summary || '';
            sources = research_brief.research.sources || [];
          } else if (typeof research_brief.research_brief === 'string') {
            try {
              const parsed = JSON.parse(research_brief.research_brief);
              researchSummary = parsed.research_summary || '';
              sources = parsed.sources || [];
            } catch (e) {}
          }
        }

        return (
          <div className="report-section">
            <h4>Blueprint Overview</h4>
            <div className="report-highlight">
              <strong>Core Startup Idea</strong>
              <p>"{user_idea}"</p>
            </div>

            {pmPlan && (
              <div className="report-brief-block">
                <h5>Product Manager Research Plan</h5>
                <div className="report-text">{pmPlan}</div>
              </div>
            )}

            {researchSummary && (
              <div className="report-brief-block success">
                <h5>Swarm Research Findings</h5>
                <div className="report-text">{researchSummary}</div>
              </div>
            )}

            {sources.length > 0 && (
              <div className="report-brief-block">
                <h5>Research Sources ({sources.length})</h5>
                <ul className="source-list">
                  {sources.map((url, i) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!pmPlan && !researchSummary && (
              <div className="report-placeholder compact">
                <AlertCircle size={24} />
                <p>No research data available for this session yet.</p>
              </div>
            )}
          </div>
        );
      }

      default:
        {
          const section = BLUEPRINT_SECTIONS.find((item) => item.id === activeTab);
          const value = getSection(sessionDetails, activeTab);
          const content = value?.content || '';
          if (!section) return null;
          return (
            <div className="report-section">
              <h4>{section.label}</h4>
              {value?.metadata && (
                <div className="report-section-meta">
                  <span>{value.metadata.launch_confidence ?? 0}% confidence</span>
                  <span>{value.metadata.consensus_level || 'Weak'} consensus</span>
                </div>
              )}
              {content ? (
                <div className="report-text">{content}</div>
              ) : (
                <EmptySection>Not generated yet.</EmptySection>
              )}
            </div>
          );
        }
    }
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <div className="panel-title">
          <FileText size={18} />
          <h3>Blueprint Output</h3>
        </div>
        <div className="report-tabs" role="tablist" aria-label="Blueprint report sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`report-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="report-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
