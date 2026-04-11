import React from 'react';
import { X, ShieldCheck, ShieldAlert, ShieldX, Shield, AlertTriangle } from 'lucide-react';

// Verdict config: color classes, icon, label
const VERDICT_CONFIG = {
  original: {
    label: "Original Work",
    icon: ShieldCheck,
    barColor: "#1D9E75",        // teal
    bgClass: "bg-green-50 border-green-200",
    textClass: "text-green-800",
    description: "Your code appears to be original. No significant similarities found."
  },
  similar: {
    label: "Similar Approach",
    icon: Shield,
    barColor: "#EF9F27",        // amber
    bgClass: "bg-yellow-50 border-yellow-200",
    textClass: "text-yellow-800",
    description: "Your code shares structural patterns with another submission. This is common when students learn from the same resources."
  },
  suspect: {
    label: "Suspicious Similarity",
    icon: ShieldAlert,
    barColor: "#D85A30",        // coral
    bgClass: "bg-orange-50 border-orange-200",
    textClass: "text-orange-800",
    description: "High structural overlap detected. Please make sure this is your own independent work."
  },
  copied: {
    label: "Likely Copied",
    icon: ShieldX,
    barColor: "#E24B4A",        // red
    bgClass: "bg-red-50 border-red-200",
    textClass: "text-red-800",
    description: "This code appears to be a structural clone of another submission, possibly with renamed variables."
  },
  error: {
    label: "Analysis Error",
    icon: AlertTriangle,
    barColor: "#888780",
    bgClass: "bg-gray-50 border-gray-200",
    textClass: "text-gray-800",
    description: "Could not complete the plagiarism check."
  }
};

// Score bar component
function ScoreBar({ score, color }) {
  return (
    <div style={{ background: '#e5e7eb', borderRadius: 6, height: 10, width: '100%', overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(score, 100)}%`,
        height: '100%',
        background: color,
        borderRadius: 6,
        transition: 'width 0.8s ease'
      }} />
    </div>
  );
}

// Metric card
function MetricCard({ label, value }) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      border: '1px solid var(--color-border-tertiary)',
      borderRadius: 8,
      padding: '10px 14px',
      minWidth: 100
    }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function PlagReport({ report, onClose }) {
  if (!report) return null;

  const verdict = report.verdict || 'error';
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.error;
  const VerdictIcon = config.icon;
  const gemini = report.gemini_analysis || {};
  const metrics = report.submitted_metrics || {};
  const score = report.overall_score || 0;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-tertiary)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 600,
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: 28,
        position: 'relative'
      }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 18,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', padding: 4
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>
            Plagiarism Report
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            Checked against {report.total_submissions_checked || 0} submissions · Powered by AST analysis + Gemini
          </p>
        </div>

        {/* Verdict banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderRadius: 10,
          border: '1px solid',
          marginBottom: 20,
          background: config.bgClass.includes('green') ? '#EAF3DE' :
                      config.bgClass.includes('yellow') ? '#FAEEDA' :
                      config.bgClass.includes('orange') ? '#FAECE7' :
                      config.bgClass.includes('red') ? '#FCEBEB' : '#F1EFE8',
          borderColor: config.bgClass.includes('green') ? '#639922' :
                       config.bgClass.includes('yellow') ? '#BA7517' :
                       config.bgClass.includes('orange') ? '#993C1D' :
                       config.bgClass.includes('red') ? '#A32D2D' : '#888780',
        }}>
          <VerdictIcon size={22} color={config.barColor} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 15, color: config.barColor }}>{config.label}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {config.description}
            </div>
          </div>
        </div>

        {/* Score */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Similarity score</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: config.barColor }}>{score}%</span>
          </div>
          <ScoreBar score={score} color={config.barColor} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            <span>0% — Original</span>
            <span>30%</span>
            <span>60%</span>
            <span>100% — Copied</span>
          </div>
        </div>

        {/* AST Structural metrics */}
        {Object.keys(metrics).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
              Your code structure
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <MetricCard label="Functions" value={metrics.num_functions ?? 0} />
              <MetricCard label="Loops" value={metrics.num_loops ?? 0} />
              <MetricCard label="Conditionals" value={metrics.num_conditionals ?? 0} />
              <MetricCard label="Max depth" value={metrics.nesting_depth ?? 0} />
              <MetricCard label="List comps" value={metrics.list_comps ?? 0} />
              <MetricCard label="Recursive" value={metrics.uses_recursion ? "Yes" : "No"} />
            </div>
          </div>
        )}

        {/* Gemini analysis */}
        {gemini && gemini.verdict && gemini.verdict !== 'error' && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
              AI analysis
            </p>

            {/* Explanation */}
            <div style={{
              background: 'var(--color-background-secondary)',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 12,
              fontSize: 14,
              color: 'var(--color-text-primary)',
              lineHeight: 1.6
            }}>
              {gemini.explanation}
            </div>

            {/* Similarities & Differences */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {gemini.similarities?.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#A32D2D', margin: '0 0 6px' }}>Similarities detected</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {gemini.similarities.map((s, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {gemini.differences?.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#3B6D11', margin: '0 0 6px' }}>Genuine differences</p>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {gemini.differences.map((d, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Educational note */}
            {gemini.educational_note && (
              <div style={{
                background: 'var(--color-background-info)',
                border: '1px solid var(--color-border-info)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--color-text-info)'
              }}>
                💡 {gemini.educational_note}
              </div>
            )}
          </div>
        )}

        {/* Matches found info */}
        {report.matches_found > 0 && (
          <div style={{
            borderTop: '1px solid var(--color-border-tertiary)',
            paddingTop: 14,
            fontSize: 12,
            color: 'var(--color-text-tertiary)'
          }}>
            {report.matches_found} submission{report.matches_found > 1 ? 's' : ''} matched above threshold
            {gemini.is_renamed_copy && (
              <span style={{ color: '#A32D2D', marginLeft: 8 }}>· Possible renamed copy detected</span>
            )}
          </div>
        )}

        {report.matches_found === 0 && report.status === 'success' && (
          <div style={{
            borderTop: '1px solid var(--color-border-tertiary)',
            paddingTop: 14,
            fontSize: 12,
            color: 'var(--color-text-tertiary)'
          }}>
            No significant matches found among {report.total_submissions_checked} stored submissions.
          </div>
        )}

      </div>
    </div>
  );
}