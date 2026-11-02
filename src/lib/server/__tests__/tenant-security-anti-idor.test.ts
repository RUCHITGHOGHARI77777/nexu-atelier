import { describe, it, expect } from "vitest";
import {
  assertZeroClientTrust,
  verifyZeroClientTrust,
  AntiIdorSecurityViolationError,
} from "../zero-client-trust";
import {
  createScopedTenantClient,
  TenantScopedPrismaClient,
} from "../tenant-scoped-prisma";
import {
  platformAuditService,
  HighPrivilegeAction,
} from "../platform-audit-service";

describe("NEXU PLATFORM — Multi-Tenant Security & Anti-IDOR Enforcement", () => {
  describe("1. Zero Client Trust Enforcement", () => {
    it("strictly rejects payload with mismatched claimed storeId against authenticated session", () => {
      const maliciousPayload = {
        claimedStoreId: "sup_khurja_02", // Attacker trying to target Khurja Ceramics
        authenticatedStoreId: "sup_jaipur_01", // Authenticated as Jaipur Handlooms
        userRole: "seller",
        actionContext: "POST /api/seller/products",
      };

      expect(() => assertZeroClientTrust(maliciousPayload)).toThrow(AntiIdorSecurityViolationError);
      expect(() => assertZeroClientTrust(maliciousPayload)).toThrow(
        /Zero Client Trust Violation/i
      );

      const check = verifyZeroClientTrust(maliciousPayload);
      expect(check.authorized).toBe(false);
      expect(check.error).toBeDefined();
    });

    it("accepts requests where claimed storeId matches authenticated session", () => {
      const legitimatePayload = {
        claimedStoreId: "sup_jaipur_01",
        authenticatedStoreId: "sup_jaipur_01",
        userRole: "seller",
        actionContext: "PATCH /api/seller/profile",
      };

      const result = assertZeroClientTrust(legitimatePayload);
      expect(result.authorized).toBe(true);
      expect(result.verifiedStoreId).toBe("sup_jaipur_01");

      const check = verifyZeroClientTrust(legitimatePayload);
      expect(check.authorized).toBe(true);
      expect(check.verifiedStoreId).toBe("sup_jaipur_01");
    });

    it("accepts requests where client omitted storeId by automatically binding to authenticated storeId", () => {
      const implicitPayload = {
        claimedStoreId: undefined,
        authenticatedStoreId: "sup_surat_03",
        userRole: "seller",
        actionContext: "POST /api/seller/orders/status",
      };

      const result = assertZeroClientTrust(implicitPayload);
      expect(result.authorized).toBe(true);
      expect(result.verifiedStoreId).toBe("sup_surat_03");
    });

    it("permits Super Admin to govern across tenant stores", () => {
      const adminPayload = {
        claimedStoreId: "sup_khurja_02",
        authenticatedStoreId: "admin_master_01",
        userRole: "admin",
        actionContext: "Admin Tenant Inspection",
      };

      const result = assertZeroClientTrust(adminPayload);
      expect(result.authorized).toBe(true);
      expect(result.verifiedStoreId).toBe("sup_khurja_02");
    });
  });

  describe("2. Scoped Prisma Middleware & Logical Tenant Enclosure", () => {
    it("fails to instantiate TenantScopedPrismaClient without verified session storeId", () => {
      expect(() => createScopedTenantClient("")).toThrow(AntiIdorSecurityViolationError);
      expect(() => createScopedTenantClient(null as any)).toThrow(AntiIdorSecurityViolationError);
    });

    it("instantiates scoped client bound to verified session storeId", () => {
      const scopedDb = createScopedTenantClient("sup_jaipur_01");
      expect(scopedDb).toBeInstanceOf(TenantScopedPrismaClient);
      expect(scopedDb.activeStoreId).toBe("sup_jaipur_01");
    });

    it("enforces tenant boundary on StoreProduct queries", async () => {
      const scopedDb = createScopedTenantClient("sup_jaipur_01");
      const products = await scopedDb.StoreProduct.findMany({ take: 5 });

      expect(Array.isArray(products)).toBe(true);
      for (const prod of products) {
        expect(prod.vendorId).toBe("sup_jaipur_01");
      }
    });

    it("throws AntiIdorSecurityViolationError when attempting to query order line belonging to another tenant", async () => {
      const scopedDb = createScopedTenantClient("sup_jaipur_01");
      // An order line that belongs to another seller or does not exist
      await expect(
        scopedDb.StoreOrder.findOrderLineById("non_existent_or_other_seller_item")
      ).rejects.toThrow(AntiIdorSecurityViolationError);
    });

    it("throws AntiIdorSecurityViolationError when attempting to access cross-tenant payout or return", async () => {
      const scopedDb = createScopedTenantClient("sup_surat_03");

      await expect(
        scopedDb.StoreInvoice.findPayoutById("payout_belonging_to_jaipur")
      ).rejects.toThrow(AntiIdorSecurityViolationError);

      await expect(
        scopedDb.StoreReturn.findReturnById("return_belonging_to_khurja")
      ).rejects.toThrow(AntiIdorSecurityViolationError);
    });
  });

  describe("3. Immutable Audit Trail for High-Privilege Actions", () => {
    const highPrivilegeActions: HighPrivilegeAction[] = [
      "Payout Handle Change",
      "Tax ID Update",
      "Return Refund",
      "Admin Store Suspension",
      "Database Node Upgrade",
    ];

    it("successfully logs all 5 high-privilege actions with cryptographic hash chaining", async () => {
      for (const action of highPrivilegeActions) {
        const entry = await platformAuditService.recordAudit({
          action,
          entityType: action === "Database Node Upgrade" ? "INFRASTRUCTURE" : "STORE",
          entityId: `entity_${action.replace(/\s+/g, "_").toLowerCase()}`,
          storeId: "sup_jaipur_01",
          performedBy: "compliance_officer@nexu.studio",
          details: {
            testRun: true,
            highPrivilegeAction: action,
            timestamp: new Date().toISOString(),
          },
        });

        expect(entry.id).toBeDefined();
        expect(entry.sequence).toBeGreaterThan(0);
        expect(entry.action).toBe(action);
        expect(entry.hash).toBeDefined();
        expect(entry.previousHash).toBeDefined();
      }
    });

    it("verifies the cryptographic integrity of the audit ledger with zero tampering", () => {
      const verification = platformAuditService.verifyAuditIntegrity();
      expect(verification.intact).toBe(true);
      expect(verification.verifiedEntries).toBeGreaterThanOrEqual(5);
      expect(verification.tamperDetectedAtSequence).toBeUndefined();
    });

    it("filters audit entries by storeId and high-privilege action accurately", async () => {
      const taxUpdates = await platformAuditService.getAuditLogs({
        action: "Tax ID Update",
      });

      expect(taxUpdates.length).toBeGreaterThan(0);
      expect(taxUpdates.every((log) => log.action === "Tax ID Update")).toBe(true);

      const storeLogs = await platformAuditService.getAuditLogs({
        storeId: "sup_jaipur_01",
      });

      expect(storeLogs.length).toBeGreaterThan(0);
      for (const log of storeLogs) {
        expect(["sup_jaipur_01", "PLATFORM_GLOBAL"]).toContain(log.storeId);
      }
    });
  });
});

