import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import {
  IMember,
  ITask,
  IProject,
  ITeam,
  IUpdate,
  IResource,
  IProgressSnapshot,
  ISubmission,
  INotification,
  IAnnouncement,
} from '@/types';

// Global in-memory cache to guarantee operational persistence even if disk is 100% read-only (EROFS)
declare global {
  // eslint-disable-next-line no-var
  var __orbit_memory_db__: Record<string, any> | undefined;
}

if (!global.__orbit_memory_db__) {
  global.__orbit_memory_db__ = {};
}

let cachedDataDir: string | null = null;

function getWritableDataDir(): string {
  if (cachedDataDir) return cachedDataDir;

  // On Vercel, AWS Lambda, or Netlify, process.cwd() is /var/task which is strictly READ-ONLY.
  // Directly use os.tmpdir() to prevent any EROFS disk write attempt.
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.NETLIFY
  ) {
    const tmpDir = path.join(os.tmpdir(), 'orbit-data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch (e) {
      // Ignored
    }
    cachedDataDir = tmpDir;
    return cachedDataDir;
  }

  const defaultDir = path.join(process.cwd(), 'data');
  const tmpDir = path.join(os.tmpdir(), 'orbit-data');

  // Test if default directory (process.cwd()/data) is writable
  try {
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    const testFile = path.join(defaultDir, `.write-test-${Date.now()}`);
    fs.writeFileSync(testFile, 'test', 'utf8');
    fs.unlinkSync(testFile);
    cachedDataDir = defaultDir;
    return cachedDataDir;
  } catch (err) {
    // Read-only filesystem (e.g. Vercel / AWS Lambda)
  }

  // Fallback to OS tmp directory
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cachedDataDir = tmpDir;
    return cachedDataDir;
  } catch (err) {
    cachedDataDir = tmpDir;
    return cachedDataDir;
  }
}

function getFilePath(filename: string): string {
  try {
    const dir = getWritableDataDir();
    const filePath = path.join(dir, filename);

    // Seed from process.cwd()/data/<filename> if file doesn't exist in target dir
    if (!fs.existsSync(filePath)) {
      const seedPath = path.join(process.cwd(), 'data', filename);
      if (fs.existsSync(seedPath)) {
        try {
          const seedContent = fs.readFileSync(seedPath, 'utf8');
          fs.writeFileSync(filePath, seedContent, 'utf8');
        } catch (err) {
          // Ignored if seed write is blocked on read-only system
        }
      }
    }
    return filePath;
  } catch (err) {
    return path.join(os.tmpdir(), 'orbit-data', filename);
  }
}

function safeReadJSON<T>(filename: string, defaultData: T = [] as any): T {
  try {
    const filePath = getFilePath(filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content || 'null');
      if (parsed !== null) {
        global.__orbit_memory_db__![filename] = parsed;
        return parsed as T;
      }
    }
  } catch (err: any) {
    console.error(`Error reading ${filename}:`, err.message);
  }

  if (global.__orbit_memory_db__![filename]) {
    return global.__orbit_memory_db__![filename] as T;
  }

  // Fallback to seed in process.cwd()/data/ if exists
  try {
    const seedPath = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, 'utf8');
      const parsed = JSON.parse(content || 'null');
      if (parsed !== null) {
        global.__orbit_memory_db__![filename] = parsed;
        return parsed as T;
      }
    }
  } catch (err) {
    // Ignored
  }

  global.__orbit_memory_db__![filename] = defaultData;
  return defaultData;
}

function safeWriteJSON(filename: string, data: any): void {
  // Always update global memory cache first
  global.__orbit_memory_db__![filename] = data;

  try {
    const filePath = getFilePath(filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err: any) {
    console.warn(`File write warning for ${filename} (${err.code || err.message}). Preserving in memory cache.`);
  }
}

const DEFAULT_PROJECT: IProject = {
  _id: 'proj-sih-2026',
  id: 'proj-sih-2026',
  name: 'SIH 2026 Submission',
  description: 'Smart India Hackathon 2026 project workspace and submission milestone',
  status: 'active',
  createdAt: '2026-08-10T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
};

const DEFAULT_ADMIN_MEMBER: IMember = {
  _id: '671a53ff-505e-4e47-b75c-13963477cfdb',
  id: '671a53ff-505e-4e47-b75c-13963477cfdb',
  name: 'Anand Awasthi',
  email: 'anandawasthi610@gmail.com',
  password: '$2a$10$em6gxiNXoqAUXV7nRAlulO65ebScda9lo6MOBJzc2qLx6w/22L6Mq',
  role: 'Admin',
  avatarUrl: '/uploads/avatar-671a53ff-505e-4e47-b75c-13963477cfdb.jpg?v=1786895601035',
  bio: 'Team Lead & Technical Lead for SIH | B.Tech CSE Student | Leading the team, managing development, and turning ideas into practical solutions. 🚀',
  skills: [
    'React.js',
    'JavaScript',
    'TypeScript',
    'HTML',
    'CSS',
    'Tailwind CSS',
    'Node.js',
    'Express.js',
    'REST APIs',
    'MongoDB',
    'MySQL',
    'Git',
    'GitHub',
    'UI/UX',
    'AI-Assisted Development',
  ],
  completionPercent: 100,
  profileComplete: true,
  createdAt: '2026-08-16T15:27:54.342Z',
  updatedAt: '2026-08-17T10:03:04.109Z',
};

function readMembers(): IMember[] {
  const members = safeReadJSON<IMember[]>('members.json', [DEFAULT_ADMIN_MEMBER]);
  if (!members.some((m) => m.email && m.email.toLowerCase() === 'anandawasthi610@gmail.com')) {
    members.unshift(DEFAULT_ADMIN_MEMBER);
  }
  return members;
}

function writeMembers(members: IMember[]): void {
  safeWriteJSON('members.json', members);
}

function readTasks(): ITask[] {
  return safeReadJSON<ITask[]>('tasks.json', []);
}

function writeTasks(tasks: ITask[]): void {
  safeWriteJSON('tasks.json', tasks);
}

function readProjects(): IProject[] {
  return safeReadJSON<IProject[]>('projects.json', [DEFAULT_PROJECT]);
}

function writeProjects(projects: IProject[]): void {
  safeWriteJSON('projects.json', projects);
}

function readTeams(): ITeam[] {
  return safeReadJSON<ITeam[]>('teams.json', []);
}

function writeTeams(teams: ITeam[]): void {
  safeWriteJSON('teams.json', teams);
}

function readUpdates(): IUpdate[] {
  return safeReadJSON<IUpdate[]>('updates.json', []);
}

function writeUpdates(updates: IUpdate[]): void {
  safeWriteJSON('updates.json', updates);
}

function readResources(): IResource[] {
  return safeReadJSON<IResource[]>('resources.json', []);
}

function writeResources(resources: IResource[]): void {
  safeWriteJSON('resources.json', resources);
}

function readProgressSnapshots(): IProgressSnapshot[] {
  return safeReadJSON<IProgressSnapshot[]>('progress_snapshots.json', []);
}

function writeProgressSnapshots(snapshots: IProgressSnapshot[]): void {
  safeWriteJSON('progress_snapshots.json', snapshots);
}

function readSubmissions(): ISubmission[] {
  return safeReadJSON<ISubmission[]>('submissions.json', []);
}

function writeSubmissions(submissions: ISubmission[]): void {
  safeWriteJSON('submissions.json', submissions);
}

function readNotifications(): INotification[] {
  return safeReadJSON<INotification[]>('notifications.json', []);
}

function writeNotifications(notifications: INotification[]): void {
  safeWriteJSON('notifications.json', notifications);
}

function formatMemberDoc(member: any): IMember {
  const doc = { ...member };
  delete doc.password;
  doc._id = doc._id || doc.id;
  doc.id = doc._id;
  if (doc.avatarUrl && (doc.avatarUrl.startsWith('data:') || doc.avatarUrl.length > 300)) {
    doc.avatarUrl = `/api/members/${doc._id}/avatar`;
  }
  return doc;
}

function populateTaskAssignedTo(task: any): ITask {
  const members = readMembers();
  const projects = readProjects();

  let assignedMemberObj: any = null;
  if (task.assignedTo) {
    const assignedId = typeof task.assignedTo === 'object' ? (task.assignedTo._id || task.assignedTo.id) : task.assignedTo;
    const foundMember = members.find((m) => m._id === assignedId || m.id === assignedId);
    if (foundMember) {
      assignedMemberObj = formatMemberDoc(foundMember);
    }
  }

  let assignedByObj: any = null;
  if (task.assignedBy) {
    const byId = typeof task.assignedBy === 'object' ? (task.assignedBy._id || task.assignedBy.id) : task.assignedBy;
    const foundBy = members.find((m) => m._id === byId || m.id === byId);
    if (foundBy) {
      assignedByObj = formatMemberDoc(foundBy);
    }
  }

  let projectObj: any = null;
  if (task.projectId) {
    const projId = typeof task.projectId === 'object' ? (task.projectId._id || task.projectId.id) : task.projectId;
    const foundProj = projects.find((p) => p._id === projId || p.id === projId);
    if (foundProj) {
      projectObj = { ...foundProj, _id: foundProj._id || foundProj.id, id: foundProj._id || foundProj.id };
    }
  }

  // Populate latest submission if exists
  const submissions = readSubmissions();
  const taskIdStr = String(task._id || task.id);
  const taskSubmissions = submissions.filter((s) => {
    const subTaskId = typeof s.taskId === 'object' ? (s.taskId._id || s.taskId.id) : s.taskId;
    return String(subTaskId) === taskIdStr;
  });
  const latestSub = taskSubmissions.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];

  return {
    ...task,
    _id: task._id || task.id,
    id: task._id || task.id,
    assignedTo: assignedMemberObj,
    assignedBy: assignedByObj,
    projectId: projectObj,
    submission: latestSub ? populateSubmission(latestSub) : null,
  };
}

function populateSubmission(sub: any): ISubmission {
  const members = readMembers();
  const tasks = readTasks();

  let submitterObj: any = null;
  if (sub.submittedBy) {
    const userId = typeof sub.submittedBy === 'object' ? (sub.submittedBy._id || sub.submittedBy.id) : sub.submittedBy;
    const foundUser = members.find((m) => m._id === userId || m.id === userId);
    if (foundUser) submitterObj = formatMemberDoc(foundUser);
  }

  let taskObj: any = null;
  if (sub.taskId) {
    const tId = typeof sub.taskId === 'object' ? (sub.taskId._id || sub.taskId.id) : sub.taskId;
    const foundTask = tasks.find((t) => t._id === tId || t.id === tId);
    if (foundTask) taskObj = { _id: foundTask._id || foundTask.id, id: foundTask._id || foundTask.id, title: foundTask.title, status: foundTask.status };
  }

  return {
    ...sub,
    _id: sub._id || sub.id,
    id: sub._id || sub.id,
    submittedBy: submitterObj,
    taskId: taskObj || sub.taskId,
  };
}

function populateTeamMembers(team: any): ITeam {
  const members = readMembers();

  const populatedMembers = (team.members || []).map((m: any) => {
    const userId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
    const foundUser = members.find((u) => u._id === userId || u.id === userId);
    return {
      ...m,
      user: foundUser ? formatMemberDoc(foundUser) : m.user,
    };
  });

  return {
    ...team,
    _id: team._id || team.id,
    id: team._id || team.id,
    members: populatedMembers,
  };
}

function populateUpdateAuthor(update: any): IUpdate {
  const members = readMembers();

  let authorObj: any = null;
  const authorId = update.authorId || (typeof update.author === 'object' ? (update.author?._id || update.author?.id) : update.author);
  if (authorId) {
    const foundAuthor = members.find((m) => m._id === authorId || m.id === authorId);
    if (foundAuthor) {
      authorObj = formatMemberDoc(foundAuthor);
    }
  }

  if (!authorObj) {
    if (update.author && typeof update.author === 'object' && update.author.name) {
      authorObj = update.author;
    } else {
      authorObj = {
        _id: update.authorId || 'anon',
        id: update.authorId || 'anon',
        name: update.authorName || 'Teammate',
        role: update.authorRole || 'Team Member',
        avatarUrl: update.authorAvatar || '',
        email: update.authorEmail || '',
      };
    }
  }

  return {
    ...update,
    _id: update._id || update.id,
    id: update._id || update.id,
    author: authorObj,
  };
}

function populateResourceAddedBy(resource: any): IResource {
  const members = readMembers();

  let addedByObj: any = null;
  if (resource.addedBy) {
    const addedById = typeof resource.addedBy === 'object' ? (resource.addedBy._id || resource.addedBy.id) : resource.addedBy;
    const foundMember = members.find((m) => m._id === addedById || m.id === addedById);
    if (foundMember) {
      addedByObj = formatMemberDoc(foundMember);
    }
  }

  return {
    ...resource,
    _id: resource._id || resource.id,
    id: resource._id || resource.id,
    addedBy: addedByObj,
  };
}

export const FileMemberStore = {
  async findOne(query: any) {
    const members = readMembers();

    if (query.email) {
      const emailLower = String(query.email).toLowerCase().trim();
      const found = members.find((m) => m.email && m.email.toLowerCase().trim() === emailLower);
      return found ? { ...found } : null;
    }

    if (query._id || query.id) {
      const targetId = query._id || query.id;
      const found = members.find((m) => m._id === targetId || m.id === targetId);
      return found ? { ...found } : null;
    }

    return null;
  },

  async findById(id: string) {
    const members = readMembers();
    const found = members.find((m) => m._id === id || m.id === id);
    if (!found) return null;
    return formatMemberDoc(found);
  },

  async create(data: Partial<IMember>) {
    const members = readMembers();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: crypto.randomUUID(),
      id: undefined,
      name: data.name || '',
      email: data.email ? data.email.toLowerCase().trim() : '',
      password: data.password || '',
      role: data.role || 'Team Member',
      avatarUrl: data.avatarUrl || '',
      bio: data.bio || '',
      skills: data.skills || [],
      completionPercent: data.completionPercent || 0,
      profileComplete: data.profileComplete ?? true,
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    members.push(newDoc);
    writeMembers(members);
    return formatMemberDoc(newDoc);
  },

  async findByIdAndUpdate(id: string, update: any, options?: any) {
    const members = readMembers();
    const index = members.findIndex((m) => m._id === id || m.id === id);
    if (index === -1) return null;

    const setFields = { ...(update.$set || update) };
    delete setFields._id;
    delete setFields.id;

    const updated = {
      ...members[index],
      ...setFields,
      updatedAt: new Date().toISOString(),
    };

    members[index] = updated;
    writeMembers(members);
    return formatMemberDoc(updated);
  },

  async findByIdAndDelete(id: string) {
    if (!id) return false;
    const members = readMembers();
    const targetId = String(id);
    const initialLen = members.length;
    const filtered = members.filter((m) => String(m._id || m.id) !== targetId);
    if (filtered.length === initialLen) {
      return false;
    }
    writeMembers(filtered);
    return true;
  },

  find(query?: any) {
    const members = readMembers();
    const formatted = members.map((m) => formatMemberDoc(m));
    return {
      select() {
        return this;
      },
      sort() {
        return formatted.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      },
      then(resolve: any) {
        resolve(formatted.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      },
    };
  },
};

export const FileTaskStore = {
  find(query: any = {}) {
    const tasks = readTasks();
    let filtered = [...tasks];

    if (query.status) {
      filtered = filtered.filter((t) => t.status === query.status);
    }
    if (query.assignedTo) {
      filtered = filtered.filter((t) => {
        if (!t.assignedTo) return false;
        const targetId = String(query.assignedTo);
        const tAssigned = typeof t.assignedTo === 'object' ? (t.assignedTo._id || t.assignedTo.id) : t.assignedTo;
        return String(tAssigned) === targetId;
      });
    }

    const populated = filtered.map(populateTaskAssignedTo);

    return {
      sort() {
        return populated.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      },
      then(resolve: any) {
        resolve(populated.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      },
    };
  },

  async findById(id: string) {
    const tasks = readTasks();
    const found = tasks.find((t) => t._id === id || t.id === id);
    if (!found) return null;
    return populateTaskAssignedTo(found);
  },

  async create(data: Partial<ITask>) {
    const tasks = readTasks();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: crypto.randomUUID(),
      id: undefined,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'General',
      assignedTo: data.assignedTo || null,
      assignedBy: data.assignedBy || null,
      projectId: data.projectId || null,
      priority: data.priority || 'medium',
      status: data.status || 'todo',
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    tasks.push(newDoc);
    writeTasks(tasks);
    return populateTaskAssignedTo(newDoc);
  },

  async findByIdAndUpdate(id: string, update: any, options?: any) {
    const tasks = readTasks();
    const index = tasks.findIndex((t) => t._id === id || t.id === id);
    if (index === -1) return null;

    const setFields = { ...(update.$set || update) };
    delete setFields._id;
    delete setFields.id;

    const updated = {
      ...tasks[index],
      ...setFields,
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updated;
    writeTasks(tasks);
    return populateTaskAssignedTo(updated);
  },

  async findByIdAndDelete(id: string) {
    const tasks = readTasks();
    const filtered = tasks.filter((t) => t._id !== id && t.id !== id);
    writeTasks(filtered);
    return true;
  },
};

export const FileSubmissionStore = {
  find(query: any = {}) {
    const submissions = readSubmissions();
    let filtered = [...submissions];

    if (query.taskId) {
      filtered = filtered.filter((s) => {
        const subTaskId = typeof s.taskId === 'object' ? (s.taskId._id || s.taskId.id) : s.taskId;
        return String(subTaskId) === String(query.taskId);
      });
    }
    if (query.submittedBy) {
      filtered = filtered.filter((s) => {
        const subUserId = typeof s.submittedBy === 'object' ? (s.submittedBy._id || s.submittedBy.id) : s.submittedBy;
        return String(subUserId) === String(query.submittedBy);
      });
    }

    const populated = filtered.map(populateSubmission);

    return {
      sort() {
        return populated.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      },
      then(resolve: any) {
        resolve(populated.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      },
    };
  },

  async findById(id: string) {
    const submissions = readSubmissions();
    const found = submissions.find((s) => s._id === id || s.id === id);
    if (!found) return null;
    return populateSubmission(found);
  },

  async findOne(query: any = {}) {
    const list = this.find(query);
    const resolved = await new Promise<any[]>((resolve) => list.then(resolve));
    return resolved[0] || null;
  },

  async create(data: Partial<ISubmission>) {
    const submissions = readSubmissions();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: crypto.randomUUID(),
      id: undefined,
      taskId: data.taskId,
      submittedBy: data.submittedBy,
      link: data.link || '',
      screenshotUrl: data.screenshotUrl || '',
      note: data.note || '',
      status: data.status || 'submitted',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    submissions.push(newDoc);
    writeSubmissions(submissions);
    return populateSubmission(newDoc);
  },

  async findByIdAndUpdate(id: string, update: any, options?: any) {
    const submissions = readSubmissions();
    const index = submissions.findIndex((s) => s._id === id || s.id === id);
    if (index === -1) return null;

    const setFields = { ...(update.$set || update) };
    delete setFields._id;
    delete setFields.id;

    const updated = {
      ...submissions[index],
      ...setFields,
      updatedAt: new Date().toISOString(),
    };

    submissions[index] = updated;
    writeSubmissions(submissions);
    return populateSubmission(updated);
  },

  async findByIdAndDelete(id: string) {
    const submissions = readSubmissions();
    const filtered = submissions.filter((s) => s._id !== id && s.id !== id);
    writeSubmissions(filtered);
    return true;
  },
};

export const FileNotificationStore = {
  find(query: any = {}) {
    const notifications = readNotifications();
    let filtered = [...notifications];

    if (query.adminId && query.adminId !== 'all') {
      filtered = filtered.filter((n) => n.adminId === query.adminId || n.adminId === 'all');
    }

    const sorted = filtered.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    return {
      sort() {
        return sorted;
      },
      then(resolve: any) {
        resolve(sorted);
      },
    };
  },

  async create(data: Partial<INotification>) {
    const notifications = readNotifications();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: crypto.randomUUID(),
      id: undefined,
      adminId: data.adminId || 'all',
      submitterName: data.submitterName || '',
      taskTitle: data.taskTitle || '',
      message: data.message || '',
      taskId: data.taskId || '',
      submissionId: data.submissionId || '',
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    notifications.unshift(newDoc);
    writeNotifications(notifications);
    return { ...newDoc };
  },

  async markAsRead(id?: string) {
    const notifications = readNotifications();
    if (id) {
      const index = notifications.findIndex((n) => n._id === id || n.id === id);
      if (index !== -1) {
        notifications[index].isRead = true;
        writeNotifications(notifications);
        return { ...notifications[index] };
      }
    } else {
      notifications.forEach((n) => (n.isRead = true));
      writeNotifications(notifications);
    }
    return { message: 'Notifications marked as read' };
  },
};

export const FileProjectStore = {
  async find(query: any = {}) {
    const projects = readProjects();
    return projects.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  },

  async findById(id: string) {
    const projects = readProjects();
    const found = projects.find((p) => p._id === id || p.id === id);
    return found ? { ...found } : null;
  },

  async create(data: Partial<IProject>) {
    const projects = readProjects();
    const now = new Date().toISOString();
    const newDoc: IProject = {
      _id: crypto.randomUUID(),
      id: undefined,
      name: data.name || '',
      description: data.description || '',
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    projects.push(newDoc);
    writeProjects(projects);
    return { ...newDoc };
  },

  async findByIdAndUpdate(id: string, update: any, options?: any) {
    const projects = readProjects();
    const index = projects.findIndex((p) => p._id === id || p.id === id);
    if (index === -1) return null;

    const setFields = { ...(update.$set || update) };
    delete setFields._id;
    delete setFields.id;

    const updated = {
      ...projects[index],
      ...setFields,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updated;
    writeProjects(projects);
    return { ...updated };
  },

  async findByIdAndDelete(id: string) {
    const projects = readProjects();
    const filtered = projects.filter((p) => p._id !== id && p.id !== id);
    writeProjects(filtered);
    return true;
  },
};

export const FileTeamStore = {
  async findAll() {
    const teams = readTeams();
    return teams.map(populateTeamMembers);
  },

  async findAvailableTeams(userId: string) {
    const teams = readTeams();
    const targetUserId = String(userId);
    const available = teams.filter((t) => {
      const isMember = (t.members || []).some((m) => {
        const uId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
        return String(uId) === targetUserId;
      });
      return !isMember;
    });
    return available.map(populateTeamMembers);
  },

  async findOne(query: any = {}) {
    const teams = readTeams();
    if (query.code) {
      const codeUpper = String(query.code).toUpperCase().trim();
      const found = teams.find((t) => t.code === codeUpper);
      return found ? populateTeamMembers(found) : null;
    }
    if (query._id || query.id) {
      const targetId = query._id || query.id;
      const found = teams.find((t) => t._id === targetId || t.id === targetId);
      return found ? populateTeamMembers(found) : null;
    }
    return null;
  },

  async findUserTeam(userId: string) {
    const teams = readTeams();
    const targetUserId = String(userId);
    const found = teams.find((t) =>
      (t.members || []).some((m) => {
        const uId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
        return String(uId) === targetUserId;
      })
    );
    return found ? populateTeamMembers(found) : null;
  },

  async create(data: Partial<ITeam>) {
    const teams = readTeams();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: crypto.randomUUID(),
      id: undefined,
      name: data.name || '',
      code: data.code || crypto.randomBytes(3).toString('hex').toUpperCase(),
      createdBy: data.createdBy || '',
      members: data.members || [],
      pendingMembers: data.pendingMembers || [],
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    teams.push(newDoc);
    writeTeams(teams);
    return populateTeamMembers(newDoc);
  },

  async createTeamWithLeader(name: string, leaderUserId: string) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const newTeamData: Partial<ITeam> = {
      name,
      code,
      createdBy: leaderUserId,
      members: [
        {
          user: leaderUserId as any,
          role: 'Team Leader',
          joinedAt: new Date().toISOString(),
        },
      ],
      pendingMembers: [],
    };
    return this.create(newTeamData);
  },

  async requestJoin(teamId: string, userId: string) {
    const teams = readTeams();
    const index = teams.findIndex((t) => t._id === teamId || t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const team = teams[index];
    if (!team.pendingMembers) team.pendingMembers = [];

    const targetUserId = String(userId);
    const isMember = (team.members || []).some((m) => {
      const uId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
      return String(uId) === targetUserId;
    });

    if (isMember) throw new Error('Already a member of this team');

    const pendingIdx = team.pendingMembers.findIndex((p) => {
      const uId = typeof p.user === 'object' ? (p.user._id || p.user.id) : p.user;
      return String(uId) === targetUserId;
    });

    if (pendingIdx !== -1) {
      team.pendingMembers[pendingIdx].status = 'pending';
      team.pendingMembers[pendingIdx].requestedAt = new Date().toISOString();
    } else {
      team.pendingMembers.push({
        user: targetUserId as any,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      });
    }

    teams[index] = team;
    writeTeams(teams);
    return populateTeamMembers(team);
  },

  async approveMemberRequest(teamId: string, userId: string) {
    const teams = readTeams();
    const index = teams.findIndex((t) => t._id === teamId || t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const team = teams[index];
    const targetUserId = String(userId);

    // Remove from pendingMembers
    team.pendingMembers = (team.pendingMembers || []).filter((p) => {
      const uId = typeof p.user === 'object' ? (p.user._id || p.user.id) : p.user;
      return String(uId) !== targetUserId;
    });

    // Add to members if not present
    const isMember = (team.members || []).some((m) => {
      const uId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
      return String(uId) === targetUserId;
    });

    if (!isMember) {
      team.members.push({
        user: targetUserId as any,
        role: 'Member',
        joinedAt: new Date().toISOString(),
      });
    }

    teams[index] = team;
    writeTeams(teams);
    return populateTeamMembers(team);
  },

  async rejectMemberRequest(teamId: string, userId: string) {
    const teams = readTeams();
    const index = teams.findIndex((t) => t._id === teamId || t.id === teamId);
    if (index === -1) throw new Error('Team not found');

    const team = teams[index];
    const targetUserId = String(userId);

    const pendingIdx = (team.pendingMembers || []).findIndex((p) => {
      const uId = typeof p.user === 'object' ? (p.user._id || p.user.id) : p.user;
      return String(uId) === targetUserId;
    });

    if (pendingIdx !== -1) {
      team.pendingMembers![pendingIdx].status = 'rejected';
    }

    teams[index] = team;
    writeTeams(teams);
    return populateTeamMembers(team);
  },

  async addMemberByCode(code: string, userId: string) {
    const teams = readTeams();
    const codeUpper = code.toUpperCase().trim();
    const index = teams.findIndex((t) => t.code === codeUpper);

    if (index === -1) {
      throw new Error('Invalid team code');
    }

    const team = teams[index];
    const targetUserId = String(userId);
    const alreadyIn = (team.members || []).some((m) => {
      const uId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
      return String(uId) === targetUserId;
    });

    if (alreadyIn) {
      throw new Error('User is already a member of this team');
    }

    const newMember = {
      user: targetUserId as any,
      role: 'Member',
      joinedAt: new Date().toISOString(),
    };

    team.members.push(newMember);
    team.updatedAt = new Date().toISOString();
    teams[index] = team;
    writeTeams(teams);
    return populateTeamMembers(team);
  },

  async removeMember(teamId: string, userId: string) {
    const teams = readTeams();
    const index = teams.findIndex((t) => t._id === teamId || t.id === teamId);
    if (index === -1) return null;

    const team = teams[index];
    const targetUserId = String(userId);
    team.members = (team.members || []).filter((m) => {
      const uId = typeof m.user === 'object' ? (m.user._id || m.user.id) : m.user;
      return String(uId) !== targetUserId;
    });

    team.updatedAt = new Date().toISOString();

    // If team has 0 members left, delete the team
    if (team.members.length === 0) {
      const filtered = teams.filter((t) => t._id !== teamId && t.id !== teamId);
      writeTeams(filtered);
      return { message: 'Team deleted as all members left' };
    }

    teams[index] = team;
    writeTeams(teams);
    return populateTeamMembers(team);
  },

  async findByIdAndUpdate(id: string, update: any, options?: any) {
    const teams = readTeams();
    const index = teams.findIndex((t) => t._id === id || t.id === id);
    if (index === -1) return null;

    const setFields = { ...(update.$set || update) };
    delete setFields._id;
    delete setFields.id;

    const updated = {
      ...teams[index],
      ...setFields,
      updatedAt: new Date().toISOString(),
    };

    teams[index] = updated;
    writeTeams(teams);
    return populateTeamMembers(updated);
  },

  async findByIdAndDelete(id: string) {
    const teams = readTeams();
    const filtered = teams.filter((t) => t._id !== id && t.id !== id);
    writeTeams(filtered);
    return true;
  },
};

export const FileUpdateStore = {
  find(query: any = {}) {
    const updates = readUpdates();
    const populated = updates.map(populateUpdateAuthor);
    return populated.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  },

  async create(data: any) {
    const updates = readUpdates();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: crypto.randomUUID(),
      id: undefined,
      authorId: data.authorId || (typeof data.author === 'object' ? (data.author?._id || data.author?.id) : data.author) || '',
      authorName: data.authorName || (typeof data.author === 'object' ? data.author?.name : '') || 'Teammate',
      authorRole: data.authorRole || (typeof data.author === 'object' ? data.author?.role : '') || 'Team Member',
      authorAvatar: data.authorAvatar || (typeof data.author === 'object' ? data.author?.avatarUrl : '') || '',
      authorEmail: data.authorEmail || (typeof data.author === 'object' ? data.author?.email : '') || '',
      author: data.author || null,
      message: data.message || '',
      type: data.type || 'general',
      isoCreatedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    updates.push(newDoc);
    writeUpdates(updates);
    return populateUpdateAuthor(newDoc);
  },

  async findByIdAndDelete(id: string) {
    if (!id) return false;
    const updates = readUpdates();
    const targetId = String(id);
    const initialLen = updates.length;
    const filtered = updates.filter((u) => String(u._id || u.id) !== targetId);
    if (filtered.length === initialLen) return false;
    writeUpdates(filtered);
    return true;
  },
};

export const FileResourceStore = {
  async find(query: any = {}) {
    const resources = readResources();
    const populated = resources.map(populateResourceAddedBy);
    return populated.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  },

  async findById(id: string) {
    const resources = readResources();
    const found = resources.find((r) => r._id === id || r.id === id);
    if (!found) return null;
    return populateResourceAddedBy(found);
  },

  async create(data: Partial<IResource>) {
    const resources = readResources();
    const now = new Date().toISOString();
    const newDoc: any = {
      _id: crypto.randomUUID(),
      id: undefined,
      title: data.title || '',
      url: data.url || '',
      category: data.category || 'Other',
      addedBy: data.addedBy || null,
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    resources.push(newDoc);
    writeResources(resources);
    return populateResourceAddedBy(newDoc);
  },

  async findByIdAndDelete(id: string) {
    const resources = readResources();
    const filtered = resources.filter((r) => r._id !== id && r.id !== id);
    writeResources(filtered);
    return true;
  },
};

export const FileProgressSnapshotStore = {
  find(query: any = {}) {
    const snapshots = readProgressSnapshots();
    const sorted = snapshots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      sort() {
        return sorted;
      },
      then(resolve: any) {
        resolve(sorted);
      },
    };
  },

  async upsertToday({
    dateStr,
    date,
    plannedPercent,
    actualPercent,
  }: {
    dateStr: string;
    date: string | Date;
    plannedPercent: number;
    actualPercent: number;
  }) {
    const snapshots = readProgressSnapshots();
    const index = snapshots.findIndex((s) => s.dateStr === dateStr);
    const now = new Date().toISOString();

    const snapshotData: IProgressSnapshot = {
      _id: index !== -1 ? snapshots[index]._id : crypto.randomUUID(),
      id: index !== -1 ? snapshots[index].id : undefined,
      dateStr,
      date: new Date(date).toISOString(),
      plannedPercent,
      actualPercent,
      createdAt: index !== -1 ? snapshots[index].createdAt : now,
      updatedAt: now,
    };
    snapshotData.id = snapshotData._id;

    if (index !== -1) {
      snapshots[index] = snapshotData;
    } else {
      snapshots.push(snapshotData);
    }

    writeProgressSnapshots(snapshots);
    return { ...snapshotData };
  },
};

// ─── Announcements Store ─────────────────────────────────────────────────────

function readAnnouncements(): IAnnouncement[] {
  return safeReadJSON<IAnnouncement[]>('announcements.json', []);
}

function writeAnnouncements(items: IAnnouncement[]): void {
  safeWriteJSON('announcements.json', items);
}

export const FileAnnouncementStore = {
  find() {
    const items = readAnnouncements();
    const sorted = [...items].sort(
      (a, b) => new Date(b.isoCreatedAt || 0).getTime() - new Date(a.isoCreatedAt || 0).getTime()
    );
    return sorted;
  },

  async create(data: Partial<IAnnouncement>) {
    const items = readAnnouncements();
    const now = new Date().toISOString();
    const newDoc: IAnnouncement = {
      _id: crypto.randomUUID(),
      id: undefined as any,
      authorId: data.authorId || 'anon',
      authorName: data.authorName || 'Teammate',
      authorAvatar: data.authorAvatar || '',
      authorRole: data.authorRole || 'member',
      message: data.message || '',
      isoCreatedAt: now,
      createdAt: now,
    };
    newDoc.id = newDoc._id;
    items.push(newDoc);
    writeAnnouncements(items);
    return newDoc;
  },

  async findByIdAndDelete(id: string) {
    if (!id) return false;
    const items = readAnnouncements();
    const targetId = String(id);
    const filtered = items.filter((a) => String(a._id || a.id) !== targetId);
    writeAnnouncements(filtered);
    return true;
  },
};


