import { prisma } from "./prisma";
import { SupplierDraftRecord, SupplierDraftData } from "@/types/listing-engine";

export class SupplierDraftService {
  /**
   * Formats raw Prisma SupplierDraft record into typed SupplierDraftRecord
   */
  public formatDraft(raw: any): SupplierDraftRecord {
    let draftData: SupplierDraftData = {};
    try {
      draftData = typeof raw.draftDataJson === "string" ? JSON.parse(raw.draftDataJson) : raw.draftDataJson;
    } catch {
      draftData = {};
    }

    return {
      id: raw.id,
      sellerId: raw.sellerId,
      productId: raw.productId,
      draftKey: raw.draftKey,
      title: raw.title,
      categoryId: raw.categoryId,
      draftData,
      version: raw.version,
      isSubmitted: raw.isSubmitted,
      updatedAt: raw.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves an active draft for a seller and draftKey.
   */
  public async getDraft(
    sellerId: string,
    draftKey: string
  ): Promise<SupplierDraftRecord | null> {
    const raw = await (prisma as any).supplierDraft.findUnique({
      where: {
        sellerId_draftKey: {
          sellerId,
          draftKey,
        },
      },
    });

    if (!raw) return null;
    return this.formatDraft(raw);
  }

  /**
   * Saves or updates a supplier draft in PostgreSQL with optimistic locking and conflict detection.
   */
  public async saveDraft(
    sellerId: string,
    payload: {
      draftKey: string;
      productId?: string | null;
      title?: string;
      categoryId?: string;
      draftData: SupplierDraftData;
      clientVersion?: number;
    }
  ): Promise<{
    success: boolean;
    draft?: SupplierDraftRecord;
    conflict?: boolean;
    serverDraft?: SupplierDraftRecord;
    error?: string;
  }> {
    const { draftKey, productId, title, categoryId, draftData, clientVersion = 1 } = payload;

    const existing = await (prisma as any).supplierDraft.findUnique({
      where: {
        sellerId_draftKey: {
          sellerId,
          draftKey,
        },
      },
    });

    if (existing) {
      // Conflict detection: if client version is older than existing version, return conflict
      if (clientVersion < existing.version) {
        return {
          success: false,
          conflict: true,
          serverDraft: this.formatDraft(existing),
          error: "A newer draft version exists on the server. Please resolve the edit conflict.",
        };
      }

      const updated = await (prisma as any).supplierDraft.update({
        where: { id: existing.id },
        data: {
          productId: productId !== undefined ? productId : existing.productId,
          title: title || draftData.title || existing.title,
          categoryId: categoryId || draftData.categoryId || existing.categoryId,
          draftDataJson: JSON.stringify(draftData),
          version: existing.version + 1,
          isSubmitted: false,
        },
      });

      return { success: true, draft: this.formatDraft(updated) };
    }

    // Create new draft
    const created = await (prisma as any).supplierDraft.create({
      data: {
        sellerId,
        productId: productId || null,
        draftKey,
        title: title || draftData.title || "Untitled Draft Piece",
        categoryId: categoryId || draftData.categoryId || null,
        draftDataJson: JSON.stringify(draftData),
        version: 1,
        isSubmitted: false,
      },
    });

    return { success: true, draft: this.formatDraft(created) };
  }

  /**
   * Lists all active unsubmitted drafts for a seller.
   */
  public async listDrafts(sellerId: string): Promise<SupplierDraftRecord[]> {
    const rawList = await (prisma as any).supplierDraft.findMany({
      where: {
        sellerId,
        isSubmitted: false,
      },
      orderBy: { updatedAt: "desc" },
    });

    return rawList.map(this.formatDraft);
  }

  /**
   * Discards a draft permanently.
   */
  public async discardDraft(sellerId: string, draftKey: string): Promise<boolean> {
    try {
      await (prisma as any).supplierDraft.deleteMany({
        where: {
          sellerId,
          draftKey,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Marks a draft as submitted after successful product submission or creation.
   */
  public async markDraftSubmitted(sellerId: string, draftKey: string): Promise<void> {
    try {
      await (prisma as any).supplierDraft.updateMany({
        where: {
          sellerId,
          draftKey,
        },
        data: {
          isSubmitted: true,
        },
      });
    } catch {
      // Ignored
    }
  }
}

export const supplierDraftService = new SupplierDraftService();
