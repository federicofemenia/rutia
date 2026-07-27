export const RouteSessionStatus = {
  InProgress: 'in_progress',
  Finished: 'finished',
} as const;

export type RouteSessionStatus = (typeof RouteSessionStatus)[keyof typeof RouteSessionStatus];
