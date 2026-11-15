import { prisma } from "./prisma";
import { CategoryAttributeDefinition, AttributeDataType } from "@/types/listing-engine";

export class CategoryAttributeService {
  /**
   * Formats raw Prisma CategoryAttribute record into typed CategoryAttributeDefinition
   */
  public formatAttribute(raw: any): CategoryAttributeDefinition {
    let allowedValues: string[] = [];
    if (raw.allowedValuesJson) {
      try {
        allowedValues = JSON.parse(raw.allowedValuesJson);
      } catch {
        allowedValues = [];
      }
    }

    let allowedUnits: string[] = [];
    if (raw.allowedUnitsJson) {
      try {
        allowedUnits = JSON.parse(raw.allowedUnitsJson);
      } catch {
        allowedUnits = [];
      }
    }

    let validationRules = null;
    if (raw.validationRulesJson) {
      try {
        validationRules = JSON.parse(raw.validationRulesJson);
      } catch {
        validationRules = null;
      }
    }

    return {
      id: raw.id,
      categoryId: raw.categoryId,
      name: raw.name,
      slug: raw.slug,
      dataType: raw.dataType as AttributeDataType,
      isRequired: raw.isRequired,
      allowedValues,
      defaultUnit: raw.defaultUnit,
      allowedUnits,
      validationRules,
      isCustomerVisible: raw.isCustomerVisible,
      isVariantAttribute: raw.isVariantAttribute,
      displayOrder: raw.displayOrder,
    };
  }

  /**
   * Retrieves all attributes defined for a specific category, ordered by displayOrder.
   */
  public async getAttributesForCategory(categoryId: string): Promise<CategoryAttributeDefinition[]> {
    const records = await (prisma as any).categoryAttribute.findMany({
      where: { categoryId },
      orderBy: { displayOrder: "asc" },
    });

    return records.map(this.formatAttribute);
  }

  /**
   * Retrieves all category attributes across the marketplace.
   */
  public async getAllAttributes(): Promise<CategoryAttributeDefinition[]> {
    const records = await (prisma as any).categoryAttribute.findMany({
      orderBy: [{ categoryId: "asc" }, { displayOrder: "asc" }],
    });

    return records.map(this.formatAttribute);
  }

  /**
   * Creates a new dynamic category attribute (Admin only).
   */
  public async createAttribute(
    adminEmail: string,
    input: {
      categoryId: string;
      name: string;
      slug: string;
      dataType: AttributeDataType;
      isRequired?: boolean;
      allowedValues?: string[];
      defaultUnit?: string | null;
      allowedUnits?: string[];
      validationRules?: any;
      isCustomerVisible?: boolean;
      isVariantAttribute?: boolean;
      displayOrder?: number;
    }
  ): Promise<{ success: boolean; attribute?: CategoryAttributeDefinition; error?: string }> {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      return { success: false, error: "Category not found." };
    }

    const cleanSlug = input.slug
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/(^_|_$)/g, "");

    if (!cleanSlug) {
      return { success: false, error: "Valid attribute slug identifier is required." };
    }

    try {
      const created = await (prisma as any).categoryAttribute.create({
        data: {
          categoryId: input.categoryId,
          name: input.name.trim(),
          slug: cleanSlug,
          dataType: input.dataType,
          isRequired: input.isRequired ?? false,
          allowedValuesJson: input.allowedValues ? JSON.stringify(input.allowedValues) : null,
          defaultUnit: input.defaultUnit || null,
          allowedUnitsJson: input.allowedUnits ? JSON.stringify(input.allowedUnits) : null,
          validationRulesJson: input.validationRules ? JSON.stringify(input.validationRules) : null,
          isCustomerVisible: input.isCustomerVisible ?? true,
          isVariantAttribute: input.isVariantAttribute ?? false,
          displayOrder: input.displayOrder ?? 0,
        },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "CATEGORY_ATTRIBUTE",
          entityId: created.id,
          action: "ATTRIBUTE_CREATED",
          note: `Admin created dynamic attribute "${input.name}" (${cleanSlug}) for category "${category.name}".`,
          performedBy: adminEmail,
        },
      });

      return { success: true, attribute: this.formatAttribute(created) };
    } catch (err: any) {
      if (err.code === "P2002") {
        return { success: false, error: `An attribute with slug "${cleanSlug}" already exists in this category.` };
      }
      return { success: false, error: err.message || "Failed to create category attribute." };
    }
  }

  /**
   * Updates an existing category attribute.
   */
  public async updateAttribute(
    adminEmail: string,
    id: string,
    input: Partial<{
      name: string;
      dataType: AttributeDataType;
      isRequired: boolean;
      allowedValues: string[];
      defaultUnit: string | null;
      allowedUnits: string[];
      validationRules: any;
      isCustomerVisible: boolean;
      isVariantAttribute: boolean;
      displayOrder: number;
    }>
  ): Promise<{ success: boolean; attribute?: CategoryAttributeDefinition; error?: string }> {
    const existing = await (prisma as any).categoryAttribute.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      return { success: false, error: "Category attribute not found." };
    }

    try {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.dataType !== undefined) updateData.dataType = input.dataType;
      if (input.isRequired !== undefined) updateData.isRequired = input.isRequired;
      if (input.allowedValues !== undefined) updateData.allowedValuesJson = JSON.stringify(input.allowedValues);
      if (input.defaultUnit !== undefined) updateData.defaultUnit = input.defaultUnit;
      if (input.allowedUnits !== undefined) updateData.allowedUnitsJson = JSON.stringify(input.allowedUnits);
      if (input.validationRules !== undefined) updateData.validationRulesJson = JSON.stringify(input.validationRules);
      if (input.isCustomerVisible !== undefined) updateData.isCustomerVisible = input.isCustomerVisible;
      if (input.isVariantAttribute !== undefined) updateData.isVariantAttribute = input.isVariantAttribute;
      if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

      const updated = await (prisma as any).categoryAttribute.update({
        where: { id },
        data: updateData,
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "CATEGORY_ATTRIBUTE",
          entityId: id,
          action: "ATTRIBUTE_UPDATED",
          note: `Admin updated dynamic attribute "${updated.name}" (${updated.slug}) for category "${existing.category.name}".`,
          performedBy: adminEmail,
        },
      });

      return { success: true, attribute: this.formatAttribute(updated) };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update category attribute." };
    }
  }

  /**
   * Deletes a category attribute.
   */
  public async deleteAttribute(
    adminEmail: string,
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const existing = await (prisma as any).categoryAttribute.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      return { success: false, error: "Category attribute not found." };
    }

    await (prisma as any).categoryAttribute.delete({ where: { id } });

    await prisma.auditEvent.create({
      data: {
        entityType: "CATEGORY_ATTRIBUTE",
        entityId: id,
        action: "ATTRIBUTE_DELETED",
        note: `Admin deleted dynamic attribute "${existing.name}" (${existing.slug}) from category "${existing.category.name}".`,
        performedBy: adminEmail,
      },
    });

    return { success: true };
  }
}

export const categoryAttributeService = new CategoryAttributeService();
