import type { Express, Request, Response } from 'express';
import {
  createAdminAttribute,
  createAdminAvailabilityConfig,
  createAdminBrand,
  createAdminOptionGroup,
  createAdminPackagingMaster,
  createAdminUnit,
  createAdminVariantMaster,
  createAdminVertical,
  deleteAdminAttribute,
  deleteAdminAvailabilityConfig,
  deleteAdminBrand,
  deleteAdminOptionGroup,
  deleteAdminPackagingMaster,
  deleteAdminUnit,
  deleteAdminVariantMaster,
  duplicateAdminOptionGroup,
  listAdminAttributes,
  listAdminAvailabilityConfigs,
  listAdminBrands,
  listAdminOptionGroups,
  listAdminPackagingMasters,
  listAdminUnits,
  listAdminVariantMasters,
  listAdminVerticals,
  listAllCatalogMasters,
  toggleAdminAttributeStatus,
  toggleAdminAvailabilityConfigStatus,
  toggleAdminBrandStatus,
  toggleAdminBrandVerified,
  toggleAdminOptionGroupStatus,
  toggleAdminPackagingMasterStatus,
  toggleAdminUnitStatus,
  toggleAdminVariantMasterStatus,
  toggleAdminVerticalEnabled,
  updateAdminAttribute,
  updateAdminAvailabilityConfig,
  updateAdminBrand,
  updateAdminOptionGroup,
  updateAdminPackagingMaster,
  updateAdminUnit,
  updateAdminVariantMaster,
  updateAdminVertical,
} from '../db/adminMasterQueries.ts';
import { AuthRequest, requireAdmin } from '../middleware/auth.ts';
import type {
  AttributeDataType,
  AvailabilityWorkflowMode,
  KycDocCode,
  OptionGroupItem,
  PackagingMaterialType,
  UnitFamily,
  VerticalWorkflowType,
} from '../types/admin.ts';

const ALLOWED_VERTICAL_WORKFLOWS = new Set<VerticalWorkflowType>([
  'FOOD_KITCHEN',
  'GROCERY_WEIGHT',
  'PHYSICAL_RETAIL',
  'MADE_TO_ORDER',
]);

const ALLOWED_KYC_DOCS = new Set<KycDocCode>([
  'FSSAI',
  'AADHAAR',
  'PAN',
  'STORE_PHOTO',
  'GST_TRADE',
  'AGRI_LICENSE',
]);

const ALLOWED_ATTR_DATA_TYPES = new Set<AttributeDataType>([
  'TEXT',
  'NUMBER',
  'SELECT',
  'MULTI_SELECT',
  'BOOLEAN',
  'DIMENSIONS',
]);

const ALLOWED_UNIT_FAMILIES = new Set<UnitFamily>([
  'WEIGHT',
  'VOLUME',
  'LENGTH',
  'COUNT',
  'PORTION',
  'BULK_PACK',
  'AREA',
]);

const ALLOWED_PACKAGING_MATERIALS = new Set<PackagingMaterialType>([
  'FOOD_CONTAINER',
  'THERMAL_BOX',
  'ECO_BAG',
  'SEALED_POUCH',
  'BOTTLE_JAR',
  'CORRUGATED_CARTON',
]);

const ALLOWED_AVAILABILITY_MODES = new Set<AvailabilityWorkflowMode>([
  'TRACKED_INVENTORY',
  'DAILY_PREP_SLOTS',
  'MADE_TO_ORDER',
  'UNLIMITED_SERVICE',
]);

const ALLOWED_DIET_TYPES = new Set<'VEG' | 'NON_VEG' | 'EGG'>(['VEG', 'NON_VEG', 'EGG']);

function sanitizeStringArray(input: unknown, maxItems = 50, maxLen = 120): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => String(item ?? '').trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeStringRecord(input: unknown, maxKeys = 40): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const result: Record<string, string> = {};
  const entries = Object.entries(input as Record<string, unknown>).slice(0, maxKeys);
  for (const [k, v] of entries) {
    const key = String(k).trim().slice(0, 80);
    const val = String(v ?? '').trim().slice(0, 160);
    if (key) result[key] = val;
  }
  return result;
}

function sanitizeOptionGroupItems(input: unknown): OptionGroupItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .slice(0, 60)
    .map((item, idx) => {
      const diet = String(item.dietType || '').trim() as 'VEG' | 'NON_VEG' | 'EGG';
      return {
        id: String(item.id || `opt_item_${Date.now()}_${idx}`).trim().slice(0, 80),
        label: String(item.label || '').trim().slice(0, 140),
        priceDeltaPaise: Math.max(0, Math.round(Number(item.priceDeltaPaise) || 0)),
        dietType: ALLOWED_DIET_TYPES.has(diet) ? diet : undefined,
        isDefault: Boolean(item.isDefault),
        isAvailable: item.isAvailable !== false,
      };
    })
    .filter((item) => item.label.length > 0);
}

function isUniqueConstraintError(error: unknown): boolean {
  const err = error as { code?: string; cause?: { code?: string } } | null;
  return err?.code === '23505' || err?.cause?.code === '23505';
}

export function registerAdminMastersRoutes(app: Express): void {
  // =========================================================================
  // PUBLIC READ-ONLY CATALOG MASTERS (ZERO PII)
  // =========================================================================
  app.get('/api/catalog/masters', async (_req: Request, res: Response) => {
    try {
      const data = await listAllCatalogMasters();
      res.json(data);
    } catch (error) {
      console.error('Route Error GET /api/catalog/masters:', error);
      res.status(500).json({ error: 'Unable to load catalog master data right now.' });
    }
  });

  // =========================================================================
  // 1. MULTI-VERTICALS MASTER (ADMIN PROTECTED)
  // =========================================================================
  app.get('/api/admin/masters/verticals', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const verticals = await listAdminVerticals();
      res.json({ verticals });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/verticals:', error);
      res.status(500).json({ error: 'Unable to load verticals.' });
    }
  });

  app.post('/api/admin/masters/verticals', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const cleanId = String(body.id || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, '_')
        .slice(0, 60);
      const name = String(body.name || '').trim();
      const workflow = String(body.fulfillmentWorkflow || 'PHYSICAL_RETAIL').trim() as VerticalWorkflowType;

      if (!cleanId || !name || !ALLOWED_VERTICAL_WORKFLOWS.has(workflow)) {
        return res.status(400).json({ error: 'Valid vertical ID, name, and workflow are required.' });
      }

      const requiredKycDocs = sanitizeStringArray(body.requiredKycDocs, 10, 40).filter((doc): doc is KycDocCode =>
        ALLOWED_KYC_DOCS.has(doc as KycDocCode)
      );

      const created = await createAdminVertical({
        id: cleanId,
        name: name.slice(0, 120),
        hindiName: typeof body.hindiName === 'string' ? body.hindiName.trim().slice(0, 160) : '',
        icon: typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim().slice(0, 40) : 'Layers',
        isEnabled: typeof body.isEnabled === 'boolean' ? body.isEnabled : true,
        description: typeof body.description === 'string' ? body.description.trim().slice(0, 600) : '',
        specialRules: sanitizeStringArray(body.specialRules, 20, 200),
        fulfillmentWorkflow: workflow,
        requiredKycDocs: requiredKycDocs.length > 0 ? requiredKycDocs : ['AADHAAR', 'PAN', 'STORE_PHOTO'],
      });
      res.status(201).json({ vertical: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Vertical ID already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/verticals:', error);
      res.status(500).json({ error: 'Unable to create vertical.' });
    }
  });

  app.patch('/api/admin/masters/verticals/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const verticalId = String(req.params.id || '').trim();
      if (!verticalId || verticalId.length > 60) {
        return res.status(400).json({ error: 'Invalid vertical identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 120);
      if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.trim().slice(0, 160);
      if (typeof body.icon === 'string') patch.icon = body.icon.trim().slice(0, 40);
      if (typeof body.isEnabled === 'boolean') patch.isEnabled = body.isEnabled;
      if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 600);
      if (Array.isArray(body.specialRules)) {
        patch.specialRules = sanitizeStringArray(body.specialRules, 20, 200);
      }
      if (ALLOWED_VERTICAL_WORKFLOWS.has(body.fulfillmentWorkflow)) {
        patch.fulfillmentWorkflow = body.fulfillmentWorkflow;
      }
      if (Array.isArray(body.requiredKycDocs)) {
        patch.requiredKycDocs = sanitizeStringArray(body.requiredKycDocs, 10, 40).filter((doc) =>
          ALLOWED_KYC_DOCS.has(doc as KycDocCode)
        );
      }

      const updated = await updateAdminVertical(verticalId, patch);
      if (!updated) return res.status(404).json({ error: 'Vertical not found.' });
      res.json({ vertical: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/verticals/:id:', error);
      res.status(500).json({ error: 'Unable to update vertical.' });
    }
  });

  app.patch('/api/admin/masters/verticals/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const verticalId = String(req.params.id || '').trim();
      if (!verticalId || verticalId.length > 60) {
        return res.status(400).json({ error: 'Invalid vertical identifier.' });
      }
      const updated = await toggleAdminVerticalEnabled(verticalId);
      if (!updated) return res.status(404).json({ error: 'Vertical not found.' });
      res.json({ vertical: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/verticals/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle vertical status.' });
    }
  });

  // =========================================================================
  // 2. ATTRIBUTES & SPECIFICATIONS MASTER
  // =========================================================================
  app.get('/api/admin/masters/attributes', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const attributes = await listAdminAttributes();
      res.json({ attributes });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/attributes:', error);
      res.status(500).json({ error: 'Unable to load attributes.' });
    }
  });

  app.post('/api/admin/masters/attributes', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const slug = String(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')).trim();
      const dataType = String(body.dataType || 'TEXT').trim() as AttributeDataType;

      if (!name || !slug || !ALLOWED_ATTR_DATA_TYPES.has(dataType)) {
        return res.status(400).json({ error: 'Valid attribute name, slug, and dataType are required.' });
      }

      const created = await createAdminAttribute({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 120),
        hindiName: typeof body.hindiName === 'string' ? body.hindiName.trim().slice(0, 140) : '',
        slug: slug.slice(0, 80),
        dataType,
        options: sanitizeStringArray(body.options, 50, 100),
        unitSuffix: typeof body.unitSuffix === 'string' && body.unitSuffix.trim() ? body.unitSuffix.trim().slice(0, 30) : undefined,
        isRequired: Boolean(body.isRequired),
        isFilterable: body.isFilterable !== false,
        isVariantAxis: Boolean(body.isVariantAxis),
        verticals: sanitizeStringArray(body.verticals, 20, 60),
        categoryIds: sanitizeStringArray(body.categoryIds, 50, 80),
        isActive: body.isActive !== false,
      });
      res.status(201).json({ attribute: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Attribute identifier already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/attributes:', error);
      res.status(500).json({ error: 'Unable to create attribute.' });
    }
  });

  app.patch('/api/admin/masters/attributes/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const attrId = String(req.params.id || '').trim();
      if (!attrId || attrId.length > 80) {
        return res.status(400).json({ error: 'Invalid attribute identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 120);
      if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.trim().slice(0, 140);
      if (typeof body.slug === 'string') patch.slug = body.slug.trim().slice(0, 80);
      if (ALLOWED_ATTR_DATA_TYPES.has(body.dataType)) patch.dataType = body.dataType;
      if (Array.isArray(body.options)) patch.options = sanitizeStringArray(body.options, 50, 100);
      if (typeof body.unitSuffix === 'string') patch.unitSuffix = body.unitSuffix.trim().slice(0, 30);
      if (typeof body.isRequired === 'boolean') patch.isRequired = body.isRequired;
      if (typeof body.isFilterable === 'boolean') patch.isFilterable = body.isFilterable;
      if (typeof body.isVariantAxis === 'boolean') patch.isVariantAxis = body.isVariantAxis;
      if (Array.isArray(body.verticals)) patch.verticals = sanitizeStringArray(body.verticals, 20, 60);
      if (Array.isArray(body.categoryIds)) patch.categoryIds = sanitizeStringArray(body.categoryIds, 50, 80);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminAttribute(attrId, patch);
      if (!updated) return res.status(404).json({ error: 'Attribute not found.' });
      res.json({ attribute: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/attributes/:id:', error);
      res.status(500).json({ error: 'Unable to update attribute.' });
    }
  });

  app.patch('/api/admin/masters/attributes/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const attrId = String(req.params.id || '').trim();
      if (!attrId || attrId.length > 80) {
        return res.status(400).json({ error: 'Invalid attribute identifier.' });
      }
      const updated = await toggleAdminAttributeStatus(attrId);
      if (!updated) return res.status(404).json({ error: 'Attribute not found.' });
      res.json({ attribute: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/attributes/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle attribute status.' });
    }
  });

  app.delete('/api/admin/masters/attributes/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const attrId = String(req.params.id || '').trim();
      if (!attrId || attrId.length > 80) {
        return res.status(400).json({ error: 'Invalid attribute identifier.' });
      }
      const deleted = await deleteAdminAttribute(attrId);
      if (!deleted) return res.status(404).json({ error: 'Attribute not found.' });
      res.json({ deleted: true, id: attrId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/masters/attributes/:id:', error);
      res.status(500).json({ error: 'Unable to delete attribute.' });
    }
  });

  // =========================================================================
  // 3. UNITS & MEASUREMENT MASTER
  // =========================================================================
  app.get('/api/admin/masters/units', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const units = await listAdminUnits();
      res.json({ units });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/units:', error);
      res.status(500).json({ error: 'Unable to load units.' });
    }
  });

  app.post('/api/admin/masters/units', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const symbol = String(body.symbol || '').trim();
      const family = String(body.family || 'COUNT').trim() as UnitFamily;

      if (!name || !symbol || !ALLOWED_UNIT_FAMILIES.has(family)) {
        return res.status(400).json({ error: 'Valid unit name, symbol, and family are required.' });
      }

      const convRaw = body.conversionFactor;
      const conversionFactor =
        convRaw !== undefined && convRaw !== null && convRaw !== '' && Number.isFinite(Number(convRaw))
          ? Math.max(0.0001, Number(convRaw))
          : undefined;

      const created = await createAdminUnit({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 120),
        hindiName: typeof body.hindiName === 'string' ? body.hindiName.trim().slice(0, 140) : '',
        symbol: symbol.slice(0, 24),
        family,
        baseUnit: typeof body.baseUnit === 'string' && body.baseUnit.trim() ? body.baseUnit.trim().slice(0, 24) : undefined,
        conversionFactor,
        allowDecimal: Boolean(body.allowDecimal),
        allowSellerLocalOverride: Boolean(body.allowSellerLocalOverride),
        verticals: sanitizeStringArray(body.verticals, 20, 60),
        isActive: body.isActive !== false,
      });
      res.status(201).json({ unit: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Unit identifier already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/units:', error);
      res.status(500).json({ error: 'Unable to create unit.' });
    }
  });

  app.patch('/api/admin/masters/units/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const unitId = String(req.params.id || '').trim();
      if (!unitId || unitId.length > 80) {
        return res.status(400).json({ error: 'Invalid unit identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 120);
      if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.trim().slice(0, 140);
      if (typeof body.symbol === 'string') patch.symbol = body.symbol.trim().slice(0, 24);
      if (ALLOWED_UNIT_FAMILIES.has(body.family)) patch.family = body.family;
      if (typeof body.baseUnit === 'string') patch.baseUnit = body.baseUnit.trim().slice(0, 24);
      if (body.conversionFactor !== undefined) {
        patch.conversionFactor =
          body.conversionFactor === null || body.conversionFactor === ''
            ? null
            : Math.max(0.0001, Number(body.conversionFactor) || 1);
      }
      if (typeof body.allowDecimal === 'boolean') patch.allowDecimal = body.allowDecimal;
      if (typeof body.allowSellerLocalOverride === 'boolean') {
        patch.allowSellerLocalOverride = body.allowSellerLocalOverride;
      }
      if (Array.isArray(body.verticals)) patch.verticals = sanitizeStringArray(body.verticals, 20, 60);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminUnit(unitId, patch);
      if (!updated) return res.status(404).json({ error: 'Unit not found.' });
      res.json({ unit: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/units/:id:', error);
      res.status(500).json({ error: 'Unable to update unit.' });
    }
  });

  app.patch('/api/admin/masters/units/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const unitId = String(req.params.id || '').trim();
      if (!unitId || unitId.length > 80) {
        return res.status(400).json({ error: 'Invalid unit identifier.' });
      }
      const updated = await toggleAdminUnitStatus(unitId);
      if (!updated) return res.status(404).json({ error: 'Unit not found.' });
      res.json({ unit: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/units/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle unit status.' });
    }
  });

  app.delete('/api/admin/masters/units/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const unitId = String(req.params.id || '').trim();
      if (!unitId || unitId.length > 80) {
        return res.status(400).json({ error: 'Invalid unit identifier.' });
      }
      const deleted = await deleteAdminUnit(unitId);
      if (!deleted) return res.status(404).json({ error: 'Unit not found.' });
      res.json({ deleted: true, id: unitId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/masters/units/:id:', error);
      res.status(500).json({ error: 'Unable to delete unit.' });
    }
  });

  // =========================================================================
  // 4. OPTION GROUPS & CUSTOMIZATIONS MASTER
  // =========================================================================
  app.get('/api/admin/masters/option-groups', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const optionGroups = await listAdminOptionGroups();
      res.json({ optionGroups });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/option-groups:', error);
      res.status(500).json({ error: 'Unable to load option groups.' });
    }
  });

  app.post('/api/admin/masters/option-groups', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      const selectionType = body.selectionType === 'MULTIPLE' ? 'MULTIPLE' : 'SINGLE';

      if (!name) {
        return res.status(400).json({ error: 'Option group name is required.' });
      }

      const minSelect = Math.max(0, Math.round(Number(body.minSelect) || 0));
      const maxSelect = Math.max(minSelect, Math.round(Number(body.maxSelect) || 1));

      const created = await createAdminOptionGroup({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        name: name.slice(0, 140),
        hindiName: typeof body.hindiName === 'string' ? body.hindiName.trim().slice(0, 140) : '',
        verticals: sanitizeStringArray(body.verticals, 20, 60),
        categoryIds: sanitizeStringArray(body.categoryIds, 50, 80),
        selectionType,
        isRequired: Boolean(body.isRequired),
        minSelect,
        maxSelect,
        options: sanitizeOptionGroupItems(body.options),
        isActive: body.isActive !== false,
      });
      res.status(201).json({ optionGroup: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Option group identifier already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/option-groups:', error);
      res.status(500).json({ error: 'Unable to create option group.' });
    }
  });

  app.patch('/api/admin/masters/option-groups/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const groupId = String(req.params.id || '').trim();
      if (!groupId || groupId.length > 80) {
        return res.status(400).json({ error: 'Invalid option group identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 140);
      if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.trim().slice(0, 140);
      if (Array.isArray(body.verticals)) patch.verticals = sanitizeStringArray(body.verticals, 20, 60);
      if (Array.isArray(body.categoryIds)) patch.categoryIds = sanitizeStringArray(body.categoryIds, 50, 80);
      if (body.selectionType === 'SINGLE' || body.selectionType === 'MULTIPLE') {
        patch.selectionType = body.selectionType;
      }
      if (typeof body.isRequired === 'boolean') patch.isRequired = body.isRequired;
      if (Number.isFinite(Number(body.minSelect)) && body.minSelect !== undefined) {
        patch.minSelect = Math.max(0, Math.round(Number(body.minSelect)));
      }
      if (Number.isFinite(Number(body.maxSelect)) && body.maxSelect !== undefined) {
        patch.maxSelect = Math.max(1, Math.round(Number(body.maxSelect)));
      }
      if (Array.isArray(body.options)) patch.options = sanitizeOptionGroupItems(body.options);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminOptionGroup(groupId, patch);
      if (!updated) return res.status(404).json({ error: 'Option group not found.' });
      res.json({ optionGroup: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/option-groups/:id:', error);
      res.status(500).json({ error: 'Unable to update option group.' });
    }
  });

  app.post('/api/admin/masters/option-groups/:id/duplicate', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const groupId = String(req.params.id || '').trim();
      if (!groupId || groupId.length > 80) {
        return res.status(400).json({ error: 'Invalid option group identifier.' });
      }
      const newId = typeof req.body?.id === 'string' ? req.body.id.trim().slice(0, 80) : undefined;
      const duplicated = await duplicateAdminOptionGroup(groupId, newId);
      if (!duplicated) return res.status(404).json({ error: 'Option group not found.' });
      res.status(201).json({ optionGroup: duplicated });
    } catch (error) {
      console.error('Route Error POST /api/admin/masters/option-groups/:id/duplicate:', error);
      res.status(500).json({ error: 'Unable to duplicate option group.' });
    }
  });

  app.patch('/api/admin/masters/option-groups/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const groupId = String(req.params.id || '').trim();
      if (!groupId || groupId.length > 80) {
        return res.status(400).json({ error: 'Invalid option group identifier.' });
      }
      const updated = await toggleAdminOptionGroupStatus(groupId);
      if (!updated) return res.status(404).json({ error: 'Option group not found.' });
      res.json({ optionGroup: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/option-groups/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle option group status.' });
    }
  });

  app.delete('/api/admin/masters/option-groups/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const groupId = String(req.params.id || '').trim();
      if (!groupId || groupId.length > 80) {
        return res.status(400).json({ error: 'Invalid option group identifier.' });
      }
      const deleted = await deleteAdminOptionGroup(groupId);
      if (!deleted) return res.status(404).json({ error: 'Option group not found.' });
      res.json({ deleted: true, id: groupId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/masters/option-groups/:id:', error);
      res.status(500).json({ error: 'Unable to delete option group.' });
    }
  });

  // =========================================================================
  // 5. BRAND MASTER
  // =========================================================================
  app.get('/api/admin/masters/brands', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const brands = await listAdminBrands();
      res.json({ brands });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/brands:', error);
      res.status(500).json({ error: 'Unable to load brands.' });
    }
  });

  app.post('/api/admin/masters/brands', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || '').trim();
      if (!name) {
        return res.status(400).json({ error: 'Brand name is required.' });
      }

      const created = await createAdminBrand({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        code: typeof body.code === 'string' && body.code.trim() ? body.code.trim().slice(0, 40) : undefined,
        name: name.slice(0, 140),
        manufacturer:
          typeof body.manufacturer === 'string' && body.manufacturer.trim()
            ? body.manufacturer.trim().slice(0, 160)
            : undefined,
        verticals: sanitizeStringArray(body.verticals, 20, 60),
        isVerified: Boolean(body.isVerified),
        description:
          typeof body.description === 'string' && body.description.trim()
            ? body.description.trim().slice(0, 600)
            : undefined,
        isActive: body.isActive !== false,
      });
      res.status(201).json({ brand: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Brand identifier already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/brands:', error);
      res.status(500).json({ error: 'Unable to create brand.' });
    }
  });

  app.patch('/api/admin/masters/brands/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const brandId = String(req.params.id || '').trim();
      if (!brandId || brandId.length > 80) {
        return res.status(400).json({ error: 'Invalid brand identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.code === 'string') patch.code = body.code.trim().slice(0, 40);
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 140);
      if (typeof body.manufacturer === 'string') patch.manufacturer = body.manufacturer.trim().slice(0, 160);
      if (Array.isArray(body.verticals)) patch.verticals = sanitizeStringArray(body.verticals, 20, 60);
      if (typeof body.isVerified === 'boolean') patch.isVerified = body.isVerified;
      if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 600);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminBrand(brandId, patch);
      if (!updated) return res.status(404).json({ error: 'Brand not found.' });
      res.json({ brand: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/brands/:id:', error);
      res.status(500).json({ error: 'Unable to update brand.' });
    }
  });

  app.patch('/api/admin/masters/brands/:id/toggle-verified', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const brandId = String(req.params.id || '').trim();
      if (!brandId || brandId.length > 80) {
        return res.status(400).json({ error: 'Invalid brand identifier.' });
      }
      const updated = await toggleAdminBrandVerified(brandId);
      if (!updated) return res.status(404).json({ error: 'Brand not found.' });
      res.json({ brand: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/brands/:id/toggle-verified:', error);
      res.status(500).json({ error: 'Unable to toggle brand verification.' });
    }
  });

  app.patch('/api/admin/masters/brands/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const brandId = String(req.params.id || '').trim();
      if (!brandId || brandId.length > 80) {
        return res.status(400).json({ error: 'Invalid brand identifier.' });
      }
      const updated = await toggleAdminBrandStatus(brandId);
      if (!updated) return res.status(404).json({ error: 'Brand not found.' });
      res.json({ brand: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/brands/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle brand status.' });
    }
  });

  app.delete('/api/admin/masters/brands/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const brandId = String(req.params.id || '').trim();
      if (!brandId || brandId.length > 80) {
        return res.status(400).json({ error: 'Invalid brand identifier.' });
      }
      const deleted = await deleteAdminBrand(brandId);
      if (!deleted) return res.status(404).json({ error: 'Brand not found.' });
      res.json({ deleted: true, id: brandId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/masters/brands/:id:', error);
      res.status(500).json({ error: 'Unable to delete brand.' });
    }
  });

  // =========================================================================
  // 6. PRODUCT VARIANT & SIZE MASTER
  // =========================================================================
  app.get('/api/admin/masters/variants', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const variantMasters = await listAdminVariantMasters();
      res.json({ variantMasters });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/variants:', error);
      res.status(500).json({ error: 'Unable to load variant masters.' });
    }
  });

  app.post('/api/admin/masters/variants', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const sku = String(body.sku || '').trim();
      const name = String(body.name || '').trim();
      const sizeLabel = String(body.sizeLabel || '').trim();
      const vertical = String(body.vertical || '').trim();
      const categoryId = String(body.categoryId || '').trim();
      const unitId = String(body.unitId || 'unit_piece').trim();

      if (!sku || !name || !sizeLabel || !vertical || !categoryId) {
        return res.status(400).json({ error: 'SKU, name, size label, vertical, and category are required.' });
      }

      const created = await createAdminVariantMaster({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        sku: sku.slice(0, 80),
        name: name.slice(0, 180),
        sizeLabel: sizeLabel.slice(0, 80),
        vertical: vertical.slice(0, 60),
        categoryId: categoryId.slice(0, 80),
        productId: typeof body.productId === 'string' && body.productId.trim() ? body.productId.trim().slice(0, 80) : undefined,
        unitId: unitId.slice(0, 80),
        unitQuantity: Math.max(0.001, Number(body.unitQuantity) || 1),
        mrpPaise: Math.max(0, Math.round(Number(body.mrpPaise) || 0)),
        sellingPricePaise: Math.max(0, Math.round(Number(body.sellingPricePaise) || 0)),
        stockQuantity: Math.max(0, Number(body.stockQuantity) || 0),
        lowStockThreshold: Math.max(0, Number(body.lowStockThreshold) || 5),
        attributes: sanitizeStringRecord(body.attributes),
        isActive: body.isActive !== false,
      });
      res.status(201).json({ variantMaster: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Variant SKU already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/variants:', error);
      res.status(500).json({ error: 'Unable to create variant master.' });
    }
  });

  app.patch('/api/admin/masters/variants/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const variantId = String(req.params.id || '').trim();
      if (!variantId || variantId.length > 80) {
        return res.status(400).json({ error: 'Invalid variant identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.sku === 'string') patch.sku = body.sku.trim().slice(0, 80);
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 180);
      if (typeof body.sizeLabel === 'string') patch.sizeLabel = body.sizeLabel.trim().slice(0, 80);
      if (typeof body.vertical === 'string') patch.vertical = body.vertical.trim().slice(0, 60);
      if (typeof body.categoryId === 'string') patch.categoryId = body.categoryId.trim().slice(0, 80);
      if (typeof body.productId === 'string') patch.productId = body.productId.trim().slice(0, 80);
      if (typeof body.unitId === 'string') patch.unitId = body.unitId.trim().slice(0, 80);
      if (Number.isFinite(Number(body.unitQuantity)) && body.unitQuantity !== undefined) {
        patch.unitQuantity = Math.max(0.001, Number(body.unitQuantity));
      }
      if (Number.isFinite(Number(body.mrpPaise)) && body.mrpPaise !== undefined) {
        patch.mrpPaise = Math.max(0, Math.round(Number(body.mrpPaise)));
      }
      if (Number.isFinite(Number(body.sellingPricePaise)) && body.sellingPricePaise !== undefined) {
        patch.sellingPricePaise = Math.max(0, Math.round(Number(body.sellingPricePaise)));
      }
      if (Number.isFinite(Number(body.stockQuantity)) && body.stockQuantity !== undefined) {
        patch.stockQuantity = Math.max(0, Number(body.stockQuantity));
      }
      if (Number.isFinite(Number(body.lowStockThreshold)) && body.lowStockThreshold !== undefined) {
        patch.lowStockThreshold = Math.max(0, Number(body.lowStockThreshold));
      }
      if (body.attributes && typeof body.attributes === 'object') {
        patch.attributes = sanitizeStringRecord(body.attributes);
      }
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminVariantMaster(variantId, patch);
      if (!updated) return res.status(404).json({ error: 'Variant master not found.' });
      res.json({ variantMaster: updated });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Variant SKU already exists.' });
      }
      console.error('Route Error PATCH /api/admin/masters/variants/:id:', error);
      res.status(500).json({ error: 'Unable to update variant master.' });
    }
  });

  app.patch('/api/admin/masters/variants/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const variantId = String(req.params.id || '').trim();
      if (!variantId || variantId.length > 80) {
        return res.status(400).json({ error: 'Invalid variant identifier.' });
      }
      const updated = await toggleAdminVariantMasterStatus(variantId);
      if (!updated) return res.status(404).json({ error: 'Variant master not found.' });
      res.json({ variantMaster: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/variants/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle variant master status.' });
    }
  });

  app.delete('/api/admin/masters/variants/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const variantId = String(req.params.id || '').trim();
      if (!variantId || variantId.length > 80) {
        return res.status(400).json({ error: 'Invalid variant identifier.' });
      }
      const deleted = await deleteAdminVariantMaster(variantId);
      if (!deleted) return res.status(404).json({ error: 'Variant master not found.' });
      res.json({ deleted: true, id: variantId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/masters/variants/:id:', error);
      res.status(500).json({ error: 'Unable to delete variant master.' });
    }
  });

  // =========================================================================
  // 7. PACKAGING MASTER
  // =========================================================================
  app.get('/api/admin/masters/packaging', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const packagingMasters = await listAdminPackagingMasters();
      res.json({ packagingMasters });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/packaging:', error);
      res.status(500).json({ error: 'Unable to load packaging masters.' });
    }
  });

  app.post('/api/admin/masters/packaging', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const code = String(body.code || '').trim();
      const name = String(body.name || '').trim();
      const capacityLabel = String(body.capacityLabel || '').trim();
      const materialType = String(body.materialType || 'FOOD_CONTAINER').trim() as PackagingMaterialType;

      if (!code || !name || !capacityLabel || !ALLOWED_PACKAGING_MATERIALS.has(materialType)) {
        return res.status(400).json({ error: 'Valid packaging code, name, material type, and capacity are required.' });
      }

      const created = await createAdminPackagingMaster({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        code: code.slice(0, 60),
        name: name.slice(0, 160),
        hindiName: typeof body.hindiName === 'string' && body.hindiName.trim() ? body.hindiName.trim().slice(0, 160) : undefined,
        materialType,
        capacityLabel: capacityLabel.slice(0, 80),
        unitId: typeof body.unitId === 'string' && body.unitId.trim() ? body.unitId.trim().slice(0, 80) : undefined,
        feePaise: Math.max(0, Math.round(Number(body.feePaise) || 0)),
        isFoodGrade: body.isFoodGrade !== false,
        isEcoFriendly: Boolean(body.isEcoFriendly),
        isLeakProof: Boolean(body.isLeakProof),
        verticals: sanitizeStringArray(body.verticals, 20, 60),
        categoryIds: sanitizeStringArray(body.categoryIds, 50, 80),
        productIds: sanitizeStringArray(body.productIds, 50, 80),
        isActive: body.isActive !== false,
      });
      res.status(201).json({ packagingMaster: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Packaging code already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/packaging:', error);
      res.status(500).json({ error: 'Unable to create packaging master.' });
    }
  });

  app.patch('/api/admin/masters/packaging/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const pkgId = String(req.params.id || '').trim();
      if (!pkgId || pkgId.length > 80) {
        return res.status(400).json({ error: 'Invalid packaging identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.code === 'string') patch.code = body.code.trim().slice(0, 60);
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 160);
      if (typeof body.hindiName === 'string') patch.hindiName = body.hindiName.trim().slice(0, 160);
      if (ALLOWED_PACKAGING_MATERIALS.has(body.materialType)) patch.materialType = body.materialType;
      if (typeof body.capacityLabel === 'string') patch.capacityLabel = body.capacityLabel.trim().slice(0, 80);
      if (typeof body.unitId === 'string') patch.unitId = body.unitId.trim().slice(0, 80);
      if (Number.isFinite(Number(body.feePaise)) && body.feePaise !== undefined) {
        patch.feePaise = Math.max(0, Math.round(Number(body.feePaise)));
      }
      if (typeof body.isFoodGrade === 'boolean') patch.isFoodGrade = body.isFoodGrade;
      if (typeof body.isEcoFriendly === 'boolean') patch.isEcoFriendly = body.isEcoFriendly;
      if (typeof body.isLeakProof === 'boolean') patch.isLeakProof = body.isLeakProof;
      if (Array.isArray(body.verticals)) patch.verticals = sanitizeStringArray(body.verticals, 20, 60);
      if (Array.isArray(body.categoryIds)) patch.categoryIds = sanitizeStringArray(body.categoryIds, 50, 80);
      if (Array.isArray(body.productIds)) patch.productIds = sanitizeStringArray(body.productIds, 50, 80);
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminPackagingMaster(pkgId, patch);
      if (!updated) return res.status(404).json({ error: 'Packaging master not found.' });
      res.json({ packagingMaster: updated });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Packaging code already exists.' });
      }
      console.error('Route Error PATCH /api/admin/masters/packaging/:id:', error);
      res.status(500).json({ error: 'Unable to update packaging master.' });
    }
  });

  app.patch('/api/admin/masters/packaging/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const pkgId = String(req.params.id || '').trim();
      if (!pkgId || pkgId.length > 80) {
        return res.status(400).json({ error: 'Invalid packaging identifier.' });
      }
      const updated = await toggleAdminPackagingMasterStatus(pkgId);
      if (!updated) return res.status(404).json({ error: 'Packaging master not found.' });
      res.json({ packagingMaster: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/packaging/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle packaging master status.' });
    }
  });

  app.delete('/api/admin/masters/packaging/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const pkgId = String(req.params.id || '').trim();
      if (!pkgId || pkgId.length > 80) {
        return res.status(400).json({ error: 'Invalid packaging identifier.' });
      }
      const deleted = await deleteAdminPackagingMaster(pkgId);
      if (!deleted) return res.status(404).json({ error: 'Packaging master not found.' });
      res.json({ deleted: true, id: pkgId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/masters/packaging/:id:', error);
      res.status(500).json({ error: 'Unable to delete packaging master.' });
    }
  });

  // =========================================================================
  // 8. PRODUCT AVAILABILITY & STOCK CONFIGURATION MASTER
  // =========================================================================
  app.get('/api/admin/masters/availability', requireAdmin, async (_req: AuthRequest, res: Response) => {
    try {
      const availabilityConfigs = await listAdminAvailabilityConfigs();
      res.json({ availabilityConfigs });
    } catch (error) {
      console.error('Route Error GET /api/admin/masters/availability:', error);
      res.status(500).json({ error: 'Unable to load availability configs.' });
    }
  });

  app.post('/api/admin/masters/availability', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const body = req.body ?? {};
      const code = String(body.code || '').trim();
      const name = String(body.name || '').trim();
      const vertical = String(body.vertical || '').trim();
      const categoryId = String(body.categoryId || '').trim();
      const workflowMode = String(body.workflowMode || 'TRACKED_INVENTORY').trim() as AvailabilityWorkflowMode;

      if (!code || !name || !vertical || !categoryId || !ALLOWED_AVAILABILITY_MODES.has(workflowMode)) {
        return res.status(400).json({ error: 'Valid code, name, vertical, category, and workflowMode are required.' });
      }

      const created = await createAdminAvailabilityConfig({
        id: typeof body.id === 'string' ? body.id.trim().slice(0, 80) : undefined,
        code: code.slice(0, 60),
        name: name.slice(0, 180),
        vertical: vertical.slice(0, 60),
        categoryId: categoryId.slice(0, 80),
        productId: typeof body.productId === 'string' && body.productId.trim() ? body.productId.trim().slice(0, 80) : undefined,
        workflowMode,
        serviceSlots: sanitizeStringArray(body.serviceSlots, 20, 100),
        prepTimeMinutes:
          body.prepTimeMinutes !== undefined && body.prepTimeMinutes !== null && body.prepTimeMinutes !== ''
            ? Math.max(0, Math.round(Number(body.prepTimeMinutes) || 0))
            : undefined,
        dailyBatchLimit:
          body.dailyBatchLimit !== undefined && body.dailyBatchLimit !== null && body.dailyBatchLimit !== ''
            ? Math.max(0, Math.round(Number(body.dailyBatchLimit) || 0))
            : undefined,
        lowStockThreshold: Math.max(0, Math.round(Number(body.lowStockThreshold) || 5)),
        maxQtyPerOrder: Math.max(1, Math.round(Number(body.maxQtyPerOrder) || 10)),
        autoDisableOnZeroStock: body.autoDisableOnZeroStock !== false,
        allowPreOrder: Boolean(body.allowPreOrder),
        restockLeadHours:
          body.restockLeadHours !== undefined && body.restockLeadHours !== null && body.restockLeadHours !== ''
            ? Math.max(0, Math.round(Number(body.restockLeadHours) || 0))
            : undefined,
        isActive: body.isActive !== false,
      });
      res.status(201).json({ availabilityConfig: created });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Availability config code already exists.' });
      }
      console.error('Route Error POST /api/admin/masters/availability:', error);
      res.status(500).json({ error: 'Unable to create availability config.' });
    }
  });

  app.patch('/api/admin/masters/availability/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const cfgId = String(req.params.id || '').trim();
      if (!cfgId || cfgId.length > 80) {
        return res.status(400).json({ error: 'Invalid availability config identifier.' });
      }
      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};
      if (typeof body.code === 'string') patch.code = body.code.trim().slice(0, 60);
      if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 180);
      if (typeof body.vertical === 'string') patch.vertical = body.vertical.trim().slice(0, 60);
      if (typeof body.categoryId === 'string') patch.categoryId = body.categoryId.trim().slice(0, 80);
      if (typeof body.productId === 'string') patch.productId = body.productId.trim().slice(0, 80);
      if (ALLOWED_AVAILABILITY_MODES.has(body.workflowMode)) patch.workflowMode = body.workflowMode;
      if (Array.isArray(body.serviceSlots)) patch.serviceSlots = sanitizeStringArray(body.serviceSlots, 20, 100);
      if (body.prepTimeMinutes !== undefined) {
        patch.prepTimeMinutes =
          body.prepTimeMinutes === null || body.prepTimeMinutes === ''
            ? undefined
            : Math.max(0, Math.round(Number(body.prepTimeMinutes) || 0));
      }
      if (body.dailyBatchLimit !== undefined) {
        patch.dailyBatchLimit =
          body.dailyBatchLimit === null || body.dailyBatchLimit === ''
            ? undefined
            : Math.max(0, Math.round(Number(body.dailyBatchLimit) || 0));
      }
      if (Number.isFinite(Number(body.lowStockThreshold)) && body.lowStockThreshold !== undefined) {
        patch.lowStockThreshold = Math.max(0, Math.round(Number(body.lowStockThreshold)));
      }
      if (Number.isFinite(Number(body.maxQtyPerOrder)) && body.maxQtyPerOrder !== undefined) {
        patch.maxQtyPerOrder = Math.max(1, Math.round(Number(body.maxQtyPerOrder)));
      }
      if (typeof body.autoDisableOnZeroStock === 'boolean') {
        patch.autoDisableOnZeroStock = body.autoDisableOnZeroStock;
      }
      if (typeof body.allowPreOrder === 'boolean') patch.allowPreOrder = body.allowPreOrder;
      if (body.restockLeadHours !== undefined) {
        patch.restockLeadHours =
          body.restockLeadHours === null || body.restockLeadHours === ''
            ? undefined
            : Math.max(0, Math.round(Number(body.restockLeadHours) || 0));
      }
      if (typeof body.isActive === 'boolean') patch.isActive = body.isActive;

      const updated = await updateAdminAvailabilityConfig(cfgId, patch);
      if (!updated) return res.status(404).json({ error: 'Availability config not found.' });
      res.json({ availabilityConfig: updated });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return res.status(409).json({ error: 'Availability config code already exists.' });
      }
      console.error('Route Error PATCH /api/admin/masters/availability/:id:', error);
      res.status(500).json({ error: 'Unable to update availability config.' });
    }
  });

  app.patch('/api/admin/masters/availability/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const cfgId = String(req.params.id || '').trim();
      if (!cfgId || cfgId.length > 80) {
        return res.status(400).json({ error: 'Invalid availability config identifier.' });
      }
      const updated = await toggleAdminAvailabilityConfigStatus(cfgId);
      if (!updated) return res.status(404).json({ error: 'Availability config not found.' });
      res.json({ availabilityConfig: updated });
    } catch (error) {
      console.error('Route Error PATCH /api/admin/masters/availability/:id/toggle:', error);
      res.status(500).json({ error: 'Unable to toggle availability config status.' });
    }
  });

  app.delete('/api/admin/masters/availability/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const cfgId = String(req.params.id || '').trim();
      if (!cfgId || cfgId.length > 80) {
        return res.status(400).json({ error: 'Invalid availability config identifier.' });
      }
      const deleted = await deleteAdminAvailabilityConfig(cfgId);
      if (!deleted) return res.status(404).json({ error: 'Availability config not found.' });
      res.json({ deleted: true, id: cfgId });
    } catch (error) {
      console.error('Route Error DELETE /api/admin/masters/availability/:id:', error);
      res.status(500).json({ error: 'Unable to delete availability config.' });
    }
  });
}
