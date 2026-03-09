export const analyticsConfig = {
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
  enabled: Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GTM_ID),
} as const;
