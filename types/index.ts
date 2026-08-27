export interface IMember {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  completionPercent?: number;
  profileComplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITask {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  category?: 'Research' | 'Frontend' | 'Backend' | 'DevOps' | 'UI/UX' | 'Documentation' | 'General' | string;
  assignedTo?: IMember | string | null;
  assignedBy?: IMember | string | null;
  projectId?: IProject | string | null;
  status?: 'todo' | 'in_progress' | 'completed' | 'pending' | 'submitted' | 'approved' | 'rejected' | string;
  priority?: 'low' | 'medium' | 'high' | string;
  deadline?: string | null;
  submission?: ISubmission | null;
  submittedAt?: string | null;
  submittedBy?: IMember | string | null;
  submittedByName?: string;
  submissionNote?: string;
  submissionFile?: string;
  submissionFiles?: string[];
  submissionLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISubmission {
  _id?: string;
  id?: string;
  taskId: ITask | string;
  submittedBy: IMember | string;
  link: string; // Required URL
  screenshotUrl?: string; // Optional image preview URL / base64
  note?: string;
  status?: 'submitted' | 'approved' | 'rejected' | string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface INotification {
  _id?: string;
  id?: string;
  type?: 'task_submitted' | string;
  taskId: string;
  taskTitle: string;
  memberName?: string;
  memberId?: string;
  adminId?: string;
  submitterName?: string;
  message?: string;
  submissionId?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface IProject {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  status?: 'planning' | 'active' | 'completed' | string;
  totalTasks?: number;
  completedTasks?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITeamMember {
  _id?: string;
  role?: string;
  joinedAt?: string;
  user: IMember | string;
}

export interface IPendingTeamMember {
  _id?: string;
  user: IMember | string;
  requestedAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ITeam {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  createdBy: string;
  members: ITeamMember[];
  pendingMembers?: IPendingTeamMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpdate {
  _id?: string;
  id?: string;
  author?: IMember | string | null;
  user?: string;
  avatarUrl?: string;
  message: string;
  type?: string;
  time?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IResource {
  _id?: string;
  id?: string;
  title: string;
  url: string;
  category?: string;
  addedBy?: IMember | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProgressSnapshot {
  _id?: string;
  id?: string;
  dateStr: string;
  date: string;
  plannedPercent: number;
  actualPercent: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IDashboardStats {
  overallProgress: number;
  activeTasksCount: number;
  completedTasksCount: number;
  todoTasksCount: number;
  submittedTasksCount?: number;
  approvedTasksCount?: number;
  totalTasks: number;
  hasTeam: boolean;
  teamMembersCount: number;
  membersWithStats: Array<IMember & { completionPercentage?: number }>;
  recentTasks: ITask[];
  recentUpdates: IUpdate[];
}
