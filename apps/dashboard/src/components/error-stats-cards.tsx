"use client";

import { TrendingDownIcon, TrendingUpIcon, AlertCircle, CheckCircle2, Activity, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ErrorStatsCardsProps {
  totalErrors: number
  unresolvedErrors: number
  errorRate: number
  newErrors24h: number
  totalErrorsTrend?: number
  unresolvedErrorsTrend?: number
  errorRateTrend?: number
  newErrors24hTrend?: number
}

function TrendBadge({ trend }: { trend: number }) {
  const isUp = trend >= 0
  const sign = trend > 0 ? '+' : ''

  return (
    <Badge variant="outline" className="flex gap-1 rounded-xl text-xs">
      {isUp ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
      {sign}{trend.toFixed(1)}%
    </Badge>
  )
}

function TrendFooter({ trend, isNegativeGood = false, suffix }: { trend: number; isNegativeGood?: boolean; suffix: string }) {
  const isPositive = isNegativeGood ? trend < 0 : trend > 0
  const isStable = Math.abs(trend) < 1

  let message: string
  let Icon: typeof TrendingUpIcon

  if (isStable) {
    message = "Stable"
    Icon = Activity
  } else if (isPositive) {
    message = isNegativeGood ? "Improving" : "Increasing"
    Icon = isNegativeGood ? TrendingDownIcon : TrendingUpIcon
  } else {
    message = isNegativeGood ? "Worsening" : "Decreasing"
    Icon = isNegativeGood ? TrendingUpIcon : TrendingDownIcon
  }

  return (
    <div className="line-clamp-1 flex gap-2 font-medium">
      {message} {suffix} <Icon className="size-4" />
    </div>
  )
}

export function ErrorStatsCards({
  totalErrors,
  unresolvedErrors,
  errorRate,
  newErrors24h,
  totalErrorsTrend = 0,
  unresolvedErrorsTrend = 0,
  errorRateTrend = 0,
  newErrors24hTrend = 0,
}: ErrorStatsCardsProps) {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {/* Total Errors */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-2">
            <AlertCircle className="size-4 text-[hsl(var(--pulse-primary))]" />
            Total Errors
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatNumber(totalErrors)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge trend={totalErrorsTrend} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <TrendFooter trend={totalErrorsTrend} suffix="this period" />
          <div className="text-muted-foreground">
            All errors captured
          </div>
        </CardFooter>
      </Card>

      {/* Unresolved Errors */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[hsl(var(--pulse-primary))]" />
            Unresolved
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatNumber(unresolvedErrors)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge trend={unresolvedErrorsTrend} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <TrendFooter trend={unresolvedErrorsTrend} isNegativeGood suffix="trend" />
          <div className="text-muted-foreground">
            {unresolvedErrorsTrend < 0 ? "Good progress on fixes" : "Needs attention"}
          </div>
        </CardFooter>
      </Card>

      {/* Error Rate */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-2">
            <Activity className="size-4 text-[hsl(var(--pulse-primary))]" />
            Error Rate
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {errorRate.toFixed(2)}%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge trend={errorRateTrend} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <TrendFooter trend={errorRateTrend} isNegativeGood suffix="vs last period" />
          <div className="text-muted-foreground">
            {errorRate < 1 ? "Within acceptable range" : "High error rate"}
          </div>
        </CardFooter>
      </Card>

      {/* New Errors (24h) */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription className="flex items-center gap-2">
            <Clock className="size-4 text-[hsl(var(--pulse-primary))]" />
            New (24h)
          </CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {formatNumber(newErrors24h)}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TrendBadge trend={newErrors24hTrend} />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <TrendFooter trend={newErrors24hTrend} isNegativeGood suffix="from yesterday" />
          <div className="text-muted-foreground">
            Recent error activity
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
