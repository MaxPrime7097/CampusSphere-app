export interface AdminStatSummary {
  totalUsers: number;
  newUsersToday: number;
  activeGroups: number;
  totalResources: number;
  pendingResources: number;
  reportedContent: number;
}

export interface AdminUserOverview {
  totalUsers: number;
  newUsersToday: number;
  activeGroups: number;
}
