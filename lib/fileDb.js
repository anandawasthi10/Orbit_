import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const MEMBERS_FILE_PATH = path.join(DATA_DIR, 'members.json');
const TASKS_FILE_PATH = path.join(DATA_DIR, 'tasks.json');
const UPDATES_FILE_PATH = path.join(DATA_DIR, 'updates.json');
const PROGRESS_FILE_PATH = path.join(DATA_DIR, 'progress_snapshots.json');
const PROJECTS_FILE_PATH = path.join(DATA_DIR, 'projects.json');
const RESOURCES_FILE_PATH = path.join(DATA_DIR, 'resources.json');
const TEAMS_FILE_PATH = path.join(DATA_DIR, 'teams.json');

const DEFAULT_PROJECT = {
  _id: 'proj-sih-2026',
  id: 'proj-sih-2026',
  name: 'SIH 2026 Submission',
  description: 'Smart India Hackathon 2026 project workspace and submission milestone',
  status: 'active',
  createdAt: '2026-08-10T00:00:00.000Z',
  updatedAt: '2026-08-10T00:00:00.000Z',
};

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEMBERS_FILE_PATH)) {
    fs.writeFileSync(MEMBERS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(TASKS_FILE_PATH)) {
    fs.writeFileSync(TASKS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(UPDATES_FILE_PATH)) {
    fs.writeFileSync(UPDATES_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(PROGRESS_FILE_PATH)) {
    fs.writeFileSync(PROGRESS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(PROJECTS_FILE_PATH)) {
    fs.writeFileSync(PROJECTS_FILE_PATH, JSON.stringify([DEFAULT_PROJECT], null, 2), 'utf8');
  }
  if (!fs.existsSync(RESOURCES_FILE_PATH)) {
    fs.writeFileSync(RESOURCES_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(TEAMS_FILE_PATH)) {
    fs.writeFileSync(TEAMS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
  }
}

export function readMembers() {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(MEMBERS_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading members.json', err);
    return [];
  }
}

export function writeMembers(members) {
  ensureDataFiles();
  fs.writeFileSync(MEMBERS_FILE_PATH, JSON.stringify(members, null, 2), 'utf8');
}

export function readTasks() {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(TASKS_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading tasks.json', err);
    return [];
  }
}

export function writeTasks(tasks) {
  ensureDataFiles();
  fs.writeFileSync(TASKS_FILE_PATH, JSON.stringify(tasks, null, 2), 'utf8');
}

export function readUpdates() {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(UPDATES_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading updates.json', err);
    return [];
  }
}

export function writeUpdates(updates) {
  ensureDataFiles();
  fs.writeFileSync(UPDATES_FILE_PATH, JSON.stringify(updates, null, 2), 'utf8');
}

export function readProgressSnapshots() {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(PROGRESS_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading progress_snapshots.json', err);
    return [];
  }
}

export function writeProgressSnapshots(snapshots) {
  ensureDataFiles();
  fs.writeFileSync(PROGRESS_FILE_PATH, JSON.stringify(snapshots, null, 2), 'utf8');
}

export function readProjects() {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(PROJECTS_FILE_PATH, 'utf8');
    const projects = JSON.parse(data || '[]');
    if (projects.length === 0) {
      writeProjects([DEFAULT_PROJECT]);
      return [DEFAULT_PROJECT];
    }
    return projects;
  } catch (err) {
    console.error('Error reading projects.json', err);
    return [DEFAULT_PROJECT];
  }
}

export function writeProjects(projects) {
  ensureDataFiles();
  fs.writeFileSync(PROJECTS_FILE_PATH, JSON.stringify(projects, null, 2), 'utf8');
}

export function readResources() {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(RESOURCES_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading resources.json', err);
    return [];
  }
}

export function writeResources(resources) {
  ensureDataFiles();
  fs.writeFileSync(RESOURCES_FILE_PATH, JSON.stringify(resources, null, 2), 'utf8');
}

function populateTaskAssignedTo(task) {
  if (!task.assignedTo) return { ...task, assignedTo: null };

  if (typeof task.assignedTo === 'object' && task.assignedTo.name) {
    return task;
  }

  const members = readMembers();
  const assignedId = String(task.assignedTo);
  const foundMember = members.find((m) => m._id === assignedId || m.id === assignedId);

  if (foundMember) {
    return {
      ...task,
      assignedTo: {
        _id: foundMember._id,
        id: foundMember._id,
        name: foundMember.name,
        avatarUrl: foundMember.avatarUrl || '',
        role: foundMember.role || '',
        email: foundMember.email || '',
      },
    };
  }

  return { ...task, assignedTo: null };
}

function populateUpdateAuthor(update) {
  if (!update.author) return { ...update, author: null };

  if (typeof update.author === 'object' && update.author.name) {
    return update;
  }

  const members = readMembers();
  const authorId = String(update.author);
  const foundMember = members.find((m) => m._id === authorId || m.id === authorId);

  if (foundMember) {
    return {
      ...update,
      author: {
        _id: foundMember._id,
        id: foundMember._id,
        name: foundMember.name,
        avatarUrl: foundMember.avatarUrl || '',
        role: foundMember.role || '',
        email: foundMember.email || '',
      },
    };
  }

  return { ...update, author: null };
}

export const FileMemberStore = {
  async findOne({ email, _id }) {
    const members = readMembers();
    const found = members.find(
      (m) =>
        (email && m.email.toLowerCase() === email.toLowerCase().trim()) ||
        (_id && (m._id === _id || m.id === _id))
    );
    if (!found) return null;
    return formatMemberDoc(found);
  },

  async findById(id) {
    return this.findOne({ _id: id });
  },

  async create(data) {
    const members = readMembers();
    const now = new Date().toISOString();
    const newDoc = {
      _id: crypto.randomUUID(),
      name: data.name || '',
      email: data.email ? data.email.toLowerCase().trim() : '',
      password: data.password || '',
      role: data.role || 'Team Member',
      avatarUrl: data.avatarUrl || '',
      bio: data.bio || '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      completionPercent: data.completionPercent || 0,
      profileComplete: data.profileComplete ?? false,
      createdAt: now,
      updatedAt: now,
    };
    members.push(newDoc);
    writeMembers(members);
    return formatMemberDoc(newDoc);
  },

  async findByIdAndUpdate(id, update, options) {
    const members = readMembers();
    const index = members.findIndex((m) => m._id === id || m.id === id);
    if (index === -1) return null;

    const setFields = update.$set || update;
    const updated = {
      ...members[index],
      ...setFields,
      updatedAt: new Date().toISOString(),
    };

    members[index] = updated;
    writeMembers(members);
    return formatMemberDoc(updated);
  },

  find() {
    const members = readMembers();
    const formatted = members.map((m) => formatMemberDoc(m));
    return {
      select() {
        return this;
      },
      sort() {
        return formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      },
      then(resolve) {
        resolve(formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      },
    };
  },
};

export const FileTaskStore = {
  async find(query = {}) {
    const tasks = readTasks();
    let filtered = [...tasks];

    if (query.status) {
      filtered = filtered.filter((t) => t.status === query.status);
    }

    const populated = filtered.map(populateTaskAssignedTo);

    return {
      sort() {
        return populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      },
      then(resolve) {
        resolve(populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      },
    };
  },

  async findById(id) {
    const tasks = readTasks();
    const found = tasks.find((t) => t._id === id || t.id === id);
    if (!found) return null;
    return populateTaskAssignedTo(found);
  },

  async create(data) {
    const tasks = readTasks();
    const now = new Date().toISOString();
    const newDoc = {
      _id: crypto.randomUUID(),
      id: undefined,
      title: data.title || '',
      category: data.category || 'General',
      assignedTo: data.assignedTo || null,
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

  async findByIdAndUpdate(id, update, options) {
    const tasks = readTasks();
    const index = tasks.findIndex((t) => t._id === id || t.id === id);
    if (index === -1) return null;

    const setFields = update.$set || update;

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

  async findByIdAndDelete(id) {
    const tasks = readTasks();
    const filtered = tasks.filter((t) => t._id !== id && t.id !== id);
    writeTasks(filtered);
    return true;
  },
};

export const FileUpdateStore = {
  async find(query = {}) {
    const updates = readUpdates();
    const populated = updates.map(populateUpdateAuthor);
    const sorted = populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      sort() {
        return sorted;
      },
      then(resolve) {
        resolve(sorted);
      },
    };
  },

  async create(data) {
    const updates = readUpdates();
    const now = new Date().toISOString();
    const newDoc = {
      _id: crypto.randomUUID(),
      id: undefined,
      author: data.author || null,
      message: data.message || '',
      type: data.type || 'general',
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    updates.push(newDoc);
    writeUpdates(updates);
    return populateUpdateAuthor(newDoc);
  },

  async findByIdAndDelete(id) {
    const updates = readUpdates();
    const filtered = updates.filter((u) => u._id !== id && u.id !== id);
    writeUpdates(filtered);
    return true;
  },
};

export const FileProgressSnapshotStore = {
  async find(query = {}) {
    const snapshots = readProgressSnapshots();
    const sorted = snapshots.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      sort() {
        return sorted;
      },
      then(resolve) {
        resolve(sorted);
      },
    };
  },

  async upsertToday({ dateStr, date, plannedPercent, actualPercent }) {
    const snapshots = readProgressSnapshots();
    const index = snapshots.findIndex((s) => s.dateStr === dateStr);
    const now = new Date().toISOString();

    let updatedDoc;
    if (index !== -1) {
      updatedDoc = {
        ...snapshots[index],
        plannedPercent,
        actualPercent,
        updatedAt: now,
      };
      snapshots[index] = updatedDoc;
    } else {
      updatedDoc = {
        _id: crypto.randomUUID(),
        dateStr,
        date: new Date(date).toISOString(),
        plannedPercent,
        actualPercent,
        createdAt: now,
        updatedAt: now,
      };
      snapshots.push(updatedDoc);
    }

    writeProgressSnapshots(snapshots);
    return updatedDoc;
  },
};

function formatMemberDoc(doc) {
  return {
    ...doc,
    id: doc._id,
    toJSON() {
      const copy = { ...doc, id: doc._id };
      delete copy.password;
      return copy;
    },
    toObject() {
      const copy = { ...doc, id: doc._id };
      delete copy.password;
      return copy;
    },
  };
}

function populateResourceAddedBy(resource) {
  if (!resource.addedBy) return { ...resource, addedBy: null };
  if (typeof resource.addedBy === 'object' && resource.addedBy.name) {
    return resource;
  }
  const members = readMembers();
  const addedById = String(resource.addedBy);
  const foundMember = members.find((m) => m._id === addedById || m.id === addedById);
  return {
    ...resource,
    addedBy: foundMember
      ? {
          _id: foundMember._id,
          id: foundMember._id,
          name: foundMember.name,
          avatarUrl: foundMember.avatarUrl || '',
          role: foundMember.role || '',
          email: foundMember.email || '',
        }
      : null,
  };
}

export const FileProjectStore = {
  async find(query = {}) {
    const projects = readProjects();
    const sorted = projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted;
  },

  async findById(id) {
    const projects = readProjects();
    return projects.find((p) => p._id === id || p.id === id) || null;
  },

  async create(data) {
    const projects = readProjects();
    const now = new Date().toISOString();
    const newDoc = {
      _id: `proj-${crypto.randomUUID()}`,
      name: data.name,
      description: data.description || '',
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    projects.push(newDoc);
    writeProjects(projects);
    return newDoc;
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const projects = readProjects();
    const index = projects.findIndex((p) => p._id === id || p.id === id);
    if (index === -1) return null;

    const updated = {
      ...projects[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    projects[index] = updated;
    writeProjects(projects);
    return updated;
  },

  async findByIdAndDelete(id) {
    const projects = readProjects();
    const filtered = projects.filter((p) => p._id !== id && p.id !== id);
    writeProjects(filtered);
    return true;
  },
};

export const FileResourceStore = {
  async find(query = {}) {
    const resources = readResources();
    const populated = resources.map(populateResourceAddedBy);
    const sorted = populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted;
  },

  async findById(id) {
    const resources = readResources();
    const found = resources.find((r) => r._id === id || r.id === id);
    return found ? populateResourceAddedBy(found) : null;
  },

  async create(data) {
    const resources = readResources();
    const now = new Date().toISOString();
    const newDoc = {
      _id: `res-${crypto.randomUUID()}`,
      title: data.title,
      url: data.url,
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

  async findByIdAndDelete(id) {
    const resources = readResources();
    const filtered = resources.filter((r) => r._id !== id && r.id !== id);
    writeResources(filtered);
    return true;
  },
};

export function readTeams() {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(TEAMS_FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading teams.json', err);
    return [];
  }
}

export function writeTeams(teams) {
  ensureDataFiles();
  fs.writeFileSync(TEAMS_FILE_PATH, JSON.stringify(teams, null, 2), 'utf8');
}

function populateTeamMembers(team) {
  if (!team) return null;
  const members = readMembers();

  const populatedMembers = (team.members || []).map((m) => {
    const userIdStr = typeof m.user === 'object' ? String(m.user._id || m.user.id) : String(m.user);
    const foundUser = members.find((mem) => String(mem._id) === userIdStr || String(mem.id) === userIdStr);
    return {
      _id: m._id || crypto.randomUUID(),
      role: m.role || 'Member',
      joinedAt: m.joinedAt || team.createdAt || new Date().toISOString(),
      user: foundUser
        ? {
            _id: foundUser._id,
            id: foundUser._id,
            name: foundUser.name,
            avatarUrl: foundUser.avatarUrl || '',
            email: foundUser.email || '',
            role: foundUser.role || '',
          }
        : (typeof m.user === 'object' ? m.user : { _id: userIdStr, id: userIdStr, name: 'Teammate', email: '' }),
    };
  });

  return {
    ...team,
    _id: team._id || team.id,
    id: team._id || team.id,
    members: populatedMembers,
  };
}

export const FileTeamStore = {
  async findOne(query = {}) {
    const teams = readTeams();
    let found = null;
    if (query.code) {
      const codeUpper = String(query.code).toUpperCase().trim();
      found = teams.find((t) => t.code && String(t.code).toUpperCase() === codeUpper);
    } else if (query._id || query.id) {
      const id = String(query._id || query.id);
      found = teams.find((t) => String(t._id) === id || String(t.id) === id);
    } else if (query['members.user']) {
      const userId = String(query['members.user']);
      found = teams.find((t) =>
        (t.members || []).some((m) => {
          const mUserId = typeof m.user === 'object' ? String(m.user._id || m.user.id) : String(m.user);
          return mUserId === userId;
        })
      );
    }
    return found ? populateTeamMembers(found) : null;
  },

  async findUserTeam(userId) {
    return this.findOne({ 'members.user': userId });
  },

  async create(data) {
    const teams = readTeams();
    const now = new Date().toISOString();
    const newDoc = {
      _id: `team-${crypto.randomUUID()}`,
      name: data.name,
      code: data.code,
      createdBy: data.createdBy,
      members: data.members || [],
      createdAt: now,
      updatedAt: now,
    };
    newDoc.id = newDoc._id;
    teams.push(newDoc);
    writeTeams(teams);
    return populateTeamMembers(newDoc);
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const teams = readTeams();
    const index = teams.findIndex((t) => String(t._id) === String(id) || String(t.id) === String(id));
    if (index === -1) return null;

    const setFields = update.$set || update;
    const updated = {
      ...teams[index],
      ...setFields,
      updatedAt: new Date().toISOString(),
    };
    teams[index] = updated;
    writeTeams(teams);
    return populateTeamMembers(updated);
  },

  async findByIdAndDelete(id) {
    const teams = readTeams();
    const filtered = teams.filter((t) => String(t._id) !== String(id) && String(t.id) !== String(id));
    writeTeams(filtered);
    return true;
  },
};
