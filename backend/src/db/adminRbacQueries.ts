import { asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { adminRolePermissions, adminTeamUsers } from './schema.ts';

export type AdminRoleKey = 'SUPER_ADMIN' | 'ADMIN_OPS' | 'ADMIN_FINANCE' | 'ADMIN_SUPPORT';

export const ALLOWED_ADMIN_ROLES: AdminRoleKey[] = [
  'SUPER_ADMIN',
  'ADMIN_OPS',
  'ADMIN_FINANCE',
  'ADMIN_SUPPORT',
];

export const ALL_ADMIN_MODULES = [
  'DASHBOARD',
  'ANALYTICS',
  'VERTICALS',
  'MASTER_CATEGORIES',
  'MASTER_BRANDS',
  'MASTER_UNITS',
  'MASTER_ATTRIBUTES',
  'MASTER_VARIANTS',
  'MASTER_ADDONS',
  'MASTER_PACKAGING',
  'MASTER_AVAILABILITY',
  'PRODUCTS',
  'APPLICATIONS',
  'SELLERS',
  'SAFETY_QUALITY',
  'CUSTOMERS',
  'SERVICE_AREAS',
  'ORDERS',
  'DELIVERY_FLEET',
  'OFFERS',
  'CMS_BANNERS',
  'BROADCASTS',
  'REVIEWS',
  'FEE_RULES',
  'PAYOUTS',
  'POLICIES_TAX',
  'UDHARI',
  'SUPPORT',
  'ROLES',
  'SETTINGS',
  'AUDIT_LOGS',
] as const;

export type AdminModuleKey = (typeof ALL_ADMIN_MODULES)[number];
export type PermissionActionKey = 'view' | 'manage' | 'approve' | 'export';

export interface ModulePermissionEntry {
  view: boolean;
  manage: boolean;
  approve: boolean;
  export: boolean;
}

export type RolePermissionMatrixDTO = Record<
  AdminRoleKey,
  Record<AdminModuleKey, ModulePermissionEntry>
>;

export interface AdminTeamUserDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRoleKey;
  status: 'ACTIVE' | 'SUSPENDED';
  assignedVillages: string[];
  lastActiveAt: string;
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildFullPermissions(): Record<AdminModuleKey, ModulePermissionEntry> {
  const map = {} as Record<AdminModuleKey, ModulePermissionEntry>;
  for (const mod of ALL_ADMIN_MODULES) {
    map[mod] = { view: true, manage: true, approve: true, export: true };
  }
  return map;
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrixDTO = {
  SUPER_ADMIN: buildFullPermissions(),
  ADMIN_OPS: {
    DASHBOARD: { view: true, manage: false, approve: false, export: true },
    ANALYTICS: { view: true, manage: false, approve: false, export: true },
    VERTICALS: { view: true, manage: true, approve: false, export: false },
    MASTER_CATEGORIES: { view: true, manage: true, approve: false, export: true },
    MASTER_BRANDS: { view: true, manage: true, approve: true, export: true },
    MASTER_UNITS: { view: true, manage: true, approve: false, export: true },
    MASTER_ATTRIBUTES: { view: true, manage: true, approve: false, export: true },
    MASTER_VARIANTS: { view: true, manage: true, approve: false, export: true },
    MASTER_ADDONS: { view: true, manage: true, approve: false, export: true },
    MASTER_PACKAGING: { view: true, manage: true, approve: false, export: true },
    MASTER_AVAILABILITY: { view: true, manage: true, approve: false, export: true },
    PRODUCTS: { view: true, manage: true, approve: true, export: true },
    APPLICATIONS: { view: true, manage: true, approve: true, export: true },
    SELLERS: { view: true, manage: true, approve: true, export: true },
    SAFETY_QUALITY: { view: true, manage: true, approve: true, export: true },
    CUSTOMERS: { view: true, manage: true, approve: false, export: true },
    SERVICE_AREAS: { view: true, manage: true, approve: false, export: true },
    ORDERS: { view: true, manage: true, approve: false, export: true },
    DELIVERY_FLEET: { view: true, manage: true, approve: true, export: true },
    OFFERS: { view: true, manage: true, approve: false, export: false },
    CMS_BANNERS: { view: true, manage: true, approve: false, export: false },
    BROADCASTS: { view: true, manage: true, approve: false, export: false },
    REVIEWS: { view: true, manage: true, approve: true, export: false },
    FEE_RULES: { view: true, manage: false, approve: false, export: false },
    PAYOUTS: { view: true, manage: false, approve: false, export: false },
    POLICIES_TAX: { view: true, manage: true, approve: false, export: false },
    UDHARI: { view: true, manage: false, approve: false, export: false },
    SUPPORT: { view: true, manage: true, approve: false, export: false },
    ROLES: { view: false, manage: false, approve: false, export: false },
    SETTINGS: { view: true, manage: false, approve: false, export: false },
    AUDIT_LOGS: { view: true, manage: false, approve: false, export: true },
  },
  ADMIN_FINANCE: {
    DASHBOARD: { view: true, manage: false, approve: false, export: true },
    ANALYTICS: { view: true, manage: false, approve: false, export: true },
    VERTICALS: { view: true, manage: false, approve: false, export: false },
    MASTER_CATEGORIES: { view: true, manage: false, approve: false, export: false },
    MASTER_BRANDS: { view: true, manage: false, approve: false, export: false },
    MASTER_UNITS: { view: false, manage: false, approve: false, export: false },
    MASTER_ATTRIBUTES: { view: false, manage: false, approve: false, export: false },
    MASTER_VARIANTS: { view: true, manage: false, approve: false, export: true },
    MASTER_ADDONS: { view: false, manage: false, approve: false, export: false },
    MASTER_PACKAGING: { view: true, manage: true, approve: false, export: true },
    MASTER_AVAILABILITY: { view: false, manage: false, approve: false, export: false },
    PRODUCTS: { view: true, manage: false, approve: false, export: true },
    APPLICATIONS: { view: true, manage: false, approve: false, export: false },
    SELLERS: { view: true, manage: false, approve: false, export: true },
    SAFETY_QUALITY: { view: true, manage: false, approve: false, export: false },
    CUSTOMERS: { view: true, manage: false, approve: false, export: true },
    SERVICE_AREAS: { view: true, manage: true, approve: false, export: true },
    ORDERS: { view: true, manage: false, approve: false, export: true },
    DELIVERY_FLEET: { view: false, manage: false, approve: false, export: false },
    OFFERS: { view: true, manage: true, approve: true, export: true },
    CMS_BANNERS: { view: false, manage: false, approve: false, export: false },
    BROADCASTS: { view: false, manage: false, approve: false, export: false },
    REVIEWS: { view: false, manage: false, approve: false, export: false },
    FEE_RULES: { view: true, manage: true, approve: true, export: true },
    PAYOUTS: { view: true, manage: true, approve: true, export: true },
    POLICIES_TAX: { view: true, manage: true, approve: true, export: true },
    UDHARI: { view: true, manage: false, approve: false, export: true },
    SUPPORT: { view: true, manage: true, approve: true, export: true },
    ROLES: { view: false, manage: false, approve: false, export: false },
    SETTINGS: { view: false, manage: false, approve: false, export: false },
    AUDIT_LOGS: { view: true, manage: false, approve: false, export: true },
  },
  ADMIN_SUPPORT: {
    DASHBOARD: { view: true, manage: false, approve: false, export: false },
    ANALYTICS: { view: true, manage: false, approve: false, export: false },
    VERTICALS: { view: false, manage: false, approve: false, export: false },
    MASTER_CATEGORIES: { view: true, manage: false, approve: false, export: false },
    MASTER_BRANDS: { view: false, manage: false, approve: false, export: false },
    MASTER_UNITS: { view: false, manage: false, approve: false, export: false },
    MASTER_ATTRIBUTES: { view: false, manage: false, approve: false, export: false },
    MASTER_VARIANTS: { view: false, manage: false, approve: false, export: false },
    MASTER_ADDONS: { view: false, manage: false, approve: false, export: false },
    MASTER_PACKAGING: { view: false, manage: false, approve: false, export: false },
    MASTER_AVAILABILITY: { view: true, manage: false, approve: false, export: false },
    PRODUCTS: { view: true, manage: false, approve: false, export: false },
    APPLICATIONS: { view: true, manage: false, approve: false, export: false },
    SELLERS: { view: true, manage: false, approve: false, export: false },
    SAFETY_QUALITY: { view: true, manage: false, approve: false, export: false },
    CUSTOMERS: { view: true, manage: true, approve: false, export: false },
    SERVICE_AREAS: { view: true, manage: false, approve: false, export: false },
    ORDERS: { view: true, manage: true, approve: false, export: false },
    DELIVERY_FLEET: { view: true, manage: false, approve: false, export: false },
    OFFERS: { view: true, manage: false, approve: false, export: false },
    CMS_BANNERS: { view: false, manage: false, approve: false, export: false },
    BROADCASTS: { view: true, manage: true, approve: false, export: false },
    REVIEWS: { view: true, manage: true, approve: true, export: false },
    FEE_RULES: { view: false, manage: false, approve: false, export: false },
    PAYOUTS: { view: false, manage: false, approve: false, export: false },
    POLICIES_TAX: { view: true, manage: false, approve: false, export: false },
    UDHARI: { view: true, manage: false, approve: false, export: false },
    SUPPORT: { view: true, manage: true, approve: true, export: true },
    ROLES: { view: false, manage: false, approve: false, export: false },
    SETTINGS: { view: false, manage: false, approve: false, export: false },
    AUDIT_LOGS: { view: true, manage: false, approve: false, export: false },
  },
};

const SEED_ADMIN_USERS: AdminTeamUserDTO[] = [
  {
    id: 'admin_super_01',
    name: 'Vikram Singh',
    email: 'vikram@grambazaar.local',
    phone: '+91 98111 22233',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    assignedVillages: ['ALL'],
    lastActiveAt: '2026-11-02T09:15:00Z',
  },
  {
    id: 'admin_ops_01',
    name: 'Meena Verma',
    email: 'meena.ops@grambazaar.local',
    phone: '+91 98111 22244',
    role: 'ADMIN_OPS',
    status: 'ACTIVE',
    assignedVillages: ['v-rampur', 'v-madhopur', 'v-shivpur'],
    lastActiveAt: '2026-11-02T08:40:00Z',
  },
  {
    id: 'admin_fin_01',
    name: 'Rajesh Tiwari',
    email: 'rajesh.fin@grambazaar.local',
    phone: '+91 98111 22255',
    role: 'ADMIN_FINANCE',
    status: 'ACTIVE',
    assignedVillages: ['ALL'],
    lastActiveAt: '2026-11-01T18:20:00Z',
  },
  {
    id: 'admin_sup_01',
    name: 'Pooja Yadav',
    email: 'pooja.support@grambazaar.local',
    phone: '+91 98111 22266',
    role: 'ADMIN_SUPPORT',
    status: 'ACTIVE',
    assignedVillages: ['v-rampur', 'v-kalyanpur'],
    lastActiveAt: '2026-11-02T09:05:00Z',
  },
];

let rbacSeedPromise: Promise<void> | null = null;

export async function ensureAdminRbacSeeded(): Promise<void> {
  if (!rbacSeedPromise) {
    rbacSeedPromise = (async () => {
      const existingUsers = await db
        .select({ id: adminTeamUsers.id })
        .from(adminTeamUsers)
        .limit(1);

      if (existingUsers.length === 0) {
        await db
          .insert(adminTeamUsers)
          .values(
            SEED_ADMIN_USERS.map((u) => ({
              externalId: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              role: u.role,
              status: u.status,
              assignedVillagesJson: JSON.stringify(u.assignedVillages),
              lastActiveAt: u.lastActiveAt,
            }))
          )
          .onConflictDoNothing();
      }

      const existingPerms = await db
        .select({ id: adminRolePermissions.id })
        .from(adminRolePermissions)
        .limit(1);

      if (existingPerms.length === 0) {
        await db
          .insert(adminRolePermissions)
          .values(
            ALLOWED_ADMIN_ROLES.map((role) => ({
              role,
              permissionsJson: JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role]),
            }))
          )
          .onConflictDoNothing();
      }
    })().catch((err) => {
      rbacSeedPromise = null;
      throw err;
    });
  }
  await rbacSeedPromise;
}

function mapAdminTeamUser(row: typeof adminTeamUsers.$inferSelect): AdminTeamUserDTO {
  const role = ALLOWED_ADMIN_ROLES.includes(row.role as AdminRoleKey)
    ? (row.role as AdminRoleKey)
    : 'ADMIN_OPS';
  return {
    id: row.externalId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role,
    status: row.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    assignedVillages: safeJsonParse<string[]>(row.assignedVillagesJson, ['ALL']),
    lastActiveAt: row.lastActiveAt,
  };
}

export async function listAdminTeamUsers(): Promise<AdminTeamUserDTO[]> {
  await ensureAdminRbacSeeded();
  const rows = await db
    .select()
    .from(adminTeamUsers)
    .orderBy(desc(adminTeamUsers.id));
  return rows.map(mapAdminTeamUser);
}

export async function getAdminRolePermissionsMatrix(): Promise<RolePermissionMatrixDTO> {
  await ensureAdminRbacSeeded();
  const rows = await db
    .select()
    .from(adminRolePermissions)
    .orderBy(asc(adminRolePermissions.id));

  const matrix: RolePermissionMatrixDTO = {
    SUPER_ADMIN: buildFullPermissions(),
    ADMIN_OPS: { ...DEFAULT_ROLE_PERMISSIONS.ADMIN_OPS },
    ADMIN_FINANCE: { ...DEFAULT_ROLE_PERMISSIONS.ADMIN_FINANCE },
    ADMIN_SUPPORT: { ...DEFAULT_ROLE_PERMISSIONS.ADMIN_SUPPORT },
  };

  for (const row of rows) {
    const role = row.role as AdminRoleKey;
    if (role === 'SUPER_ADMIN' || !ALLOWED_ADMIN_ROLES.includes(role)) continue;
    const parsed = safeJsonParse<Partial<Record<AdminModuleKey, ModulePermissionEntry>>>(
      row.permissionsJson,
      {}
    );
    matrix[role] = {
      ...DEFAULT_ROLE_PERMISSIONS[role],
      ...parsed,
    };
  }

  return matrix;
}

export async function getAdminRbacBundle(): Promise<{
  adminUsers: AdminTeamUserDTO[];
  rolePermissions: RolePermissionMatrixDTO;
}> {
  await ensureAdminRbacSeeded();
  const [adminUsers, rolePermissions] = await Promise.all([
    listAdminTeamUsers(),
    getAdminRolePermissionsMatrix(),
  ]);
  return { adminUsers, rolePermissions };
}

export async function createAdminTeamUser(input: {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRoleKey;
  status?: 'ACTIVE' | 'SUSPENDED';
  assignedVillages?: string[];
}): Promise<AdminTeamUserDTO> {
  await ensureAdminRbacSeeded();
  const externalId = input.id?.trim() || `admin_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const [inserted] = await db
    .insert(adminTeamUsers)
    .values({
      externalId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      role: input.role,
      status: input.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      assignedVillagesJson: JSON.stringify(
        Array.isArray(input.assignedVillages) && input.assignedVillages.length > 0
          ? input.assignedVillages
          : ['ALL']
      ),
      lastActiveAt: nowIso,
      updatedAt: new Date(),
    })
    .returning();

  return mapAdminTeamUser(inserted);
}

export async function updateAdminTeamUser(
  externalId: string,
  patch: Partial<{
    name: string;
    email: string;
    phone: string;
    role: AdminRoleKey;
    status: 'ACTIVE' | 'SUSPENDED';
    assignedVillages: string[];
    lastActiveAt: string;
  }>
): Promise<AdminTeamUserDTO | null> {
  await ensureAdminRbacSeeded();
  const [existing] = await db
    .select()
    .from(adminTeamUsers)
    .where(eq(adminTeamUsers.externalId, externalId))
    .limit(1);

  if (!existing) return null;

  const [updated] = await db
    .update(adminTeamUsers)
    .set({
      name: patch.name !== undefined ? patch.name.trim() : existing.name,
      email: patch.email !== undefined ? patch.email.trim().toLowerCase() : existing.email,
      phone: patch.phone !== undefined ? patch.phone.trim() : existing.phone,
      role:
        patch.role && ALLOWED_ADMIN_ROLES.includes(patch.role)
          ? patch.role
          : existing.role,
      status:
        patch.status === 'ACTIVE' || patch.status === 'SUSPENDED'
          ? patch.status
          : existing.status,
      assignedVillagesJson: Array.isArray(patch.assignedVillages)
        ? JSON.stringify(patch.assignedVillages)
        : existing.assignedVillagesJson,
      lastActiveAt:
        typeof patch.lastActiveAt === 'string' && patch.lastActiveAt.trim()
          ? patch.lastActiveAt.trim()
          : existing.lastActiveAt,
      updatedAt: new Date(),
    })
    .where(eq(adminTeamUsers.id, existing.id))
    .returning();

  return mapAdminTeamUser(updated);
}

export async function updateAdminRolePermission(input: {
  role: AdminRoleKey;
  module: AdminModuleKey;
  key: PermissionActionKey;
  value: boolean;
}): Promise<RolePermissionMatrixDTO> {
  await ensureAdminRbacSeeded();

  if (input.role === 'SUPER_ADMIN') {
    // Super Admin always retains full access
    return getAdminRolePermissionsMatrix();
  }

  const currentMatrix = await getAdminRolePermissionsMatrix();
  const nextRolePerms: Record<AdminModuleKey, ModulePermissionEntry> = {
    ...currentMatrix[input.role],
    [input.module]: {
      ...currentMatrix[input.role][input.module],
      [input.key]: Boolean(input.value),
    },
  };

  await db
    .insert(adminRolePermissions)
    .values({
      role: input.role,
      permissionsJson: JSON.stringify(nextRolePerms),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: adminRolePermissions.role,
      set: {
        permissionsJson: JSON.stringify(nextRolePerms),
        updatedAt: new Date(),
      },
    });

  return getAdminRolePermissionsMatrix();
}
