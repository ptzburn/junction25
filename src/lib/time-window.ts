function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatRange(start: Date, end: Date) {
  return `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

export type DeliveryBucket = "under-30" | "30-60" | "over-60";

export function classifyDeliveryWindow(minutes: number | null): DeliveryBucket {
  if (minutes === null) {
    return "30-60";
  }
  if (minutes < 30) {
    return "under-30";
  }
  if (minutes <= 60) {
    return "30-60";
  }
  return "over-60";
}

export function computeEtaWindow(timeOfDeliveryParam?: string | null) {
  const parsedDelivery = timeOfDeliveryParam ? new Date(timeOfDeliveryParam) : null;
  const hasValidDelivery = Boolean(parsedDelivery && !Number.isNaN(parsedDelivery.getTime()));
  const now = new Date();

  let etaText: string;
  let minutesUntilDelivery: number | null = null;
  if (hasValidDelivery && parsedDelivery) {
    const start = new Date(parsedDelivery.getTime() - 10 * 60_000);
    const end = new Date(parsedDelivery.getTime() + 10 * 60_000);
    etaText = formatRange(start, end);
    minutesUntilDelivery = Math.max(0, Math.round((parsedDelivery.getTime() - now.getTime()) / 60_000));
  }
  else {
    const start = new Date(now.getTime() + 20 * 60_000);
    const end = new Date(now.getTime() + 40 * 60_000);
    etaText = formatRange(start, end);
    minutesUntilDelivery = 30;
  }

  return {
    etaText,
    parsedDelivery: hasValidDelivery && parsedDelivery ? parsedDelivery : null,
    hasDeliveryParam: hasValidDelivery,
    minutesUntilDelivery,
    bucket: classifyDeliveryWindow(minutesUntilDelivery),
  };
}
