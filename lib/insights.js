export function computeInsights({ uploadCount = 0, todoStats }) {
  const insights = [];
  const total = todoStats?.total ?? 0;
  const done = todoStats?.done ?? 0;

  if (uploadCount === 0 && total === 0) {
    insights.push('SYSTEM IDLE: No outputs and no tasks.');
  }

  if (uploadCount > 0 && done === 0) {
    insights.push('OUTPUT ACTIVE: Uploads detected, but no tasks completed.');
  }

  if (total > 0) {
    const ratio = done / total;
    if (ratio >= 0.7) {
      insights.push('TASKFLOW: High completion ratio.');
    } else if (ratio >= 0.3) {
      insights.push('TASKFLOW: Moderate completion; review priorities.');
    } else {
      insights.push('TASKFLOW: Low completion; focus required.');
    }
  }

  if (uploadCount >= 10) {
    insights.push('THROUGHPUT: Daily upload baseline reached.');
  }

  if (insights.length === 0) {
    insights.push('NO SIGNIFICANT PATTERNS DETECTED.');
  }

  return insights.slice(0, 3);
}
