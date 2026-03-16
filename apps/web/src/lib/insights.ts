/**
 * Stats insights computation
 * Extracted from the tRPC router for testability and separation of concerns.
 *
 * IMPORTANT: This function returns translation keys (strings prefixed with "stats.insights.")
 * instead of hardcoded English strings. The calling component is responsible for
 * translating title and message fields using useTranslations('stats.insights').
 *
 * Example in a React component:
 *   const t = useTranslations('stats.insights');
 *   const insights = computeInsights(timeline, envBreakdown);
 *   // Then: t(insight.title as TranslationKey), t(insight.message as TranslationKey, insight.params)
 */

export interface StatsInsight {
  type: "trend" | "pattern" | "stability" | "alert" | "neutral";
  icon: "trending-up" | "trending-down" | "clock" | "calendar" | "shield" | "alert-triangle";
  /** Translation key under stats.insights namespace */
  title: string;
  /** Translation key under stats.insights namespace */
  message: string;
  /** Interpolation params for the message translation */
  params?: Record<string, string | number>;
  value?: string;
  sentiment: "positive" | "negative" | "neutral";
}

type TimelinePoint = { date: string; events: number };
type EnvPoint = { env: string; count: number };

export function computeInsights(
  timeline: TimelinePoint[],
  envBreakdown: EnvPoint[]
): StatsInsight[] {
  if (!timeline || timeline.length === 0) {
    return [
      {
        type: "neutral",
        icon: "shield",
        title: "noDataTitle",
        message: "noDataMessage",
        sentiment: "neutral",
      },
    ];
  }

  const insights: StatsInsight[] = [];

  // Calculate total events
  const totalEvents = timeline.reduce((sum, point) => sum + point.events, 0);

  // Trend analysis: Compare last 7 days vs previous 7 days
  const last7Days = timeline.slice(-7);
  const previous7Days = timeline.slice(-14, -7);

  const last7Total = last7Days.reduce((sum, p) => sum + p.events, 0);
  const prev7Total = previous7Days.reduce((sum, p) => sum + p.events, 0);

  if (prev7Total > 0) {
    const changePercent = Math.round(((last7Total - prev7Total) / prev7Total) * 100);

    if (Math.abs(changePercent) >= 10) {
      insights.push({
        type: "trend",
        icon: changePercent > 0 ? "trending-up" : "trending-down",
        title: changePercent > 0 ? "errorsIncreasingTitle" : "errorsDecreasingTitle",
        message: changePercent > 0 ? "errorsIncreasingMessage" : "errorsDecreasingMessage",
        params: { percent: Math.abs(changePercent) },
        value: changePercent > 0
          ? `+${changePercent}%`
          : `${changePercent}%`,
        sentiment: changePercent > 0 ? "negative" : "positive",
      });
    }
  }

  // Peak day analysis
  if (timeline.length >= 7) {
    const dayTotals: Record<string, { total: number; count: number }> = {};

    timeline.forEach((point) => {
      const date = new Date(point.date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      if (!dayTotals[dayName]) {
        dayTotals[dayName] = { total: 0, count: 0 };
      }
      dayTotals[dayName].total += point.events;
      dayTotals[dayName].count += 1;
    });

    const dayAverages = Object.entries(dayTotals).map(([day, data]) => ({
      day,
      avg: data.total / data.count,
    }));

    const peakDay = dayAverages.reduce((max, curr) => (curr.avg > max.avg ? curr : max));
    const quietDay = dayAverages.reduce((min, curr) => (curr.avg < min.avg ? curr : min));

    if (peakDay.avg > quietDay.avg * 1.5) {
      insights.push({
        type: "pattern",
        icon: "calendar",
        title: "peakErrorDayTitle",
        message: "peakErrorDayMessage",
        params: { day: peakDay.day },
        value: `~${Math.round(peakDay.avg)}/day`,
        sentiment: "neutral",
      });
    }

    if (quietDay.avg < peakDay.avg * 0.5) {
      insights.push({
        type: "stability",
        icon: "shield",
        title: "mostStableDayTitle",
        message: "mostStableDayMessage",
        params: { day: quietDay.day },
        value: `~${Math.round(quietDay.avg)}/day`,
        sentiment: "positive",
      });
    }
  }

  // Environment insight
  if (envBreakdown && envBreakdown.length > 0) {
    const prodEnv = envBreakdown.find((e) => e.env === "prod" || e.env === "production");
    const totalEnvEvents = envBreakdown.reduce((sum, e) => sum + e.count, 0);

    if (prodEnv && totalEnvEvents > 0) {
      const prodPercent = Math.round((prodEnv.count / totalEnvEvents) * 100);

      if (prodPercent > 60) {
        insights.push({
          type: "alert",
          icon: "alert-triangle",
          title: "productionHeavyTitle",
          message: "productionHeavyMessage",
          params: { percent: prodPercent },
          value: `${prodPercent}%`,
          sentiment: "negative",
        });
      }
    }
  }

  // Recent spike detection (last 24h vs average)
  if (timeline.length >= 7) {
    const avgDaily = totalEvents / timeline.length;
    const lastDay = timeline[timeline.length - 1];

    if (lastDay && lastDay.events > avgDaily * 2) {
      insights.push({
        type: "alert",
        icon: "alert-triangle",
        title: "recentSpikeTitle",
        message: "recentSpikeMessage",
        params: { multiplier: Math.round(lastDay.events / avgDaily) },
        value: `${lastDay.events} errors`,
        sentiment: "negative",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: "stability",
      icon: "shield",
      title: "lookingStableTitle",
      message: "lookingStableMessage",
      sentiment: "positive",
    });
  }

  return insights.slice(0, 4);
}
