/**
 * Stats insights computation
 * Extracted from the tRPC router for testability and separation of concerns.
 */

export interface StatsInsight {
  type: "trend" | "pattern" | "stability" | "alert" | "neutral";
  icon: "trending-up" | "trending-down" | "clock" | "calendar" | "shield" | "alert-triangle";
  title: string;
  message: string;
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
        title: "No data yet",
        message: "Start sending errors to see insights",
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
        title: changePercent > 0 ? "Errors increasing" : "Errors decreasing",
        message: `${Math.abs(changePercent)}% ${changePercent > 0 ? "more" : "fewer"} errors vs last week`,
        value: `${changePercent > 0 ? "+" : ""}${changePercent}%`,
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
        title: "Peak error day",
        message: `${peakDay.day}s have the most errors`,
        value: `~${Math.round(peakDay.avg)}/day`,
        sentiment: "neutral",
      });
    }

    if (quietDay.avg < peakDay.avg * 0.5) {
      insights.push({
        type: "stability",
        icon: "shield",
        title: "Most stable day",
        message: `${quietDay.day}s have the fewest errors`,
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
          title: "Production-heavy",
          message: `${prodPercent}% of errors are from production`,
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
        title: "Recent spike",
        message: `Today's errors are ${Math.round(lastDay.events / avgDaily)}x above average`,
        value: `${lastDay.events} errors`,
        sentiment: "negative",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: "stability",
      icon: "shield",
      title: "Looking stable",
      message: "No significant patterns or anomalies detected",
      sentiment: "positive",
    });
  }

  return insights.slice(0, 4);
}
