/**
 * NEXU ATELIER — Dispute & Legal Evidence Dossier Engine
 * 
 * Invariants:
 * - Collects immutable factual snapshots from PostgreSQL records
 * - Computes a tamper-evident SHA-256 seal for the evidence dossier
 * - Logs chain-of-custody for all compilation and download events
 * - Never modifies historical records or falsifies dispute timelines
 */

import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";
import { securityAuditLedgerService } from "./security-audit-ledger-service";

export interface CompileEvidenceInput {
  orderId: string;
  disputeId?: string | null;
  evidenceType: "PAYMENT_DISPUTE" | "DELIVERY_DISPUTE" | "SELLER_FRAUD" | "RETURN_FRAUD";
  compiledByAdminId: string;
  investigationNotes?: string;
}

export class DisputeEvidenceService {
  /**
   * Compiles an immutable legal evidence dossier for an order dispute.
   */
  public async compileDossier(input: CompileEvidenceInput) {
    const { orderId, disputeId, evidenceType, compiledByAdminId, investigationNotes } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        refunds: true,
        shipments: {
          include: {
            trackingEvents: {
              orderBy: { timestamp: "asc" },
            },
          },
        },
        invoices: true,
        auditEvents: {
          orderBy: { createdAt: "asc" },
        },
        customer: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const transactionRefs = order.payments.map((p) => p.transactionRef).filter(Boolean);
    const webhookEvents = await prisma.webhookEvent.findMany({
      where: {
        OR: [
          { payloadJson: { contains: order.id } },
          ...transactionRefs.map((ref) => ({ payloadJson: { contains: ref } })),
        ],
      },
      select: {
        id: true,
        provider: true,
        eventType: true,
        status: true,
        createdAt: true,
        payloadJson: true,
      },
    });

    const securityAuditEvents = await prisma.securityAuditEvent.findMany({
      where: {
        OR: [
          { resourceId: order.id },
          { actorId: order.customerId },
        ],
      },
      orderBy: { sequenceNumber: "asc" },
      take: 20,
    });

    const caseId = `CASE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const compiledAt = new Date();

    const manifest = {
      caseId,
      evidenceType,
      compiledAt: compiledAt.toISOString(),
      compiledBy: compiledByAdminId,
      investigationNotes: investigationNotes || "Dispute evidence dossier assembled for legal verification.",
      orderSnapshot: {
        orderId: order.id,
        createdAt: order.createdAt.toISOString(),
        customer: {
          id: order.customer.id,
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customer.profile?.phone ? `${order.customer.profile.phone.slice(0, 5)}*****${order.customer.profile.phone.slice(-2)}` : null,
        },
        shippingAddress: order.shippingAddressSnapshot,
        subtotalPaise: order.subtotalPaise,
        taxPaise: order.estimatedTaxPaise,
        shippingFeePaise: order.shippingFeePaise,
        discountPaise: order.discountPaise,
        totalPaise: order.totalPaise,
        status: order.status,
        paymentStatus: order.paymentStatus,
        isCod: order.isCod,
      },
      orderItems: order.items.map((i) => ({
        id: i.id,
        title: i.title,
        vendorId: i.vendorId,
        vendorName: i.vendorName,
        quantity: i.quantity,
        unitPricePaise: i.unitPricePaise,
        lineTotalPaise: i.lineTotalPaise,
        fulfillmentStatus: i.fulfillmentStatus,
        courierName: i.courierName,
        trackingNumber: i.trackingNumber,
      })),
      paymentRecords: order.payments.map((p) => ({
        id: p.id,
        provider: p.provider,
        transactionRef: p.transactionRef,
        amountPaise: p.amountPaise,
        currency: p.currency,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt.toISOString(),
      })),
      refundRecords: order.refunds.map((r) => ({
        id: r.id,
        amountPaise: r.amountPaise,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      shipmentRecords: order.shipments.map((s) => ({
        id: s.id,
        carrierName: s.carrierName,
        trackingNumber: s.trackingNumber,
        status: s.status,
        dispatchedAt: s.dispatchedAt?.toISOString(),
        deliveredAt: s.deliveredAt?.toISOString(),
        trackingEvents: s.trackingEvents.map((te) => ({
          status: te.status,
          location: te.location,
          description: te.description,
          timestamp: te.timestamp.toISOString(),
        })),
      })),
      statutoryInvoices: order.invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        documentType: inv.documentType,
        issuerType: inv.issuerType,
        supplierLegalName: inv.supplierLegalName,
        supplierGstin: inv.supplierGstin,
        placeOfSupplyState: inv.placeOfSupplyState,
        taxableAmountPaise: inv.taxableAmountPaise,
        cgstPaise: inv.cgstPaise,
        sgstPaise: inv.sgstPaise,
        igstPaise: inv.igstPaise,
        netAmountPaise: inv.netAmountPaise,
        createdAt: inv.createdAt.toISOString(),
      })),
      verifiedWebhooksCount: webhookEvents.length,
      securityAuditTrail: securityAuditEvents.map((sa) => ({
        sequenceNumber: sa.sequenceNumber,
        action: sa.action,
        actorRole: sa.actorRole,
        timestamp: sa.timestamp.toISOString(),
        recordHash: sa.recordHash,
      })),
    };

    const manifestJson = JSON.stringify(manifest);

    const packageHash = crypto.createHash("sha256").update(manifestJson, "utf8").digest("hex");

    const pkg = await prisma.disputeEvidencePackage.create({
      data: {
        caseId,
        disputeId: disputeId || null,
        orderId,
        evidenceType,
        packageHash,
        evidenceManifestJson: manifestJson,
        compiledBy: compiledByAdminId,
        compiledAt,
      },
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: compiledByAdminId,
      actorRole: "ADMIN",
      action: "EVIDENCE_DOSSIER_COMPILED",
      resourceType: "DISPUTE_EVIDENCE",
      resourceId: pkg.id,
      details: {
        caseId,
        orderId,
        packageHash,
        evidenceType,
      },
    });

    return {
      packageId: pkg.id,
      caseId,
      packageHash,
      compiledAt: compiledAt.toISOString(),
      manifest,
    };
  }

  /**
   * Tracks download and verifies package integrity before export.
   */
  public async getEvidencePackageForDownload(packageIdOrCaseId: string, downloadedByAdminId: string) {
    const pkg = await prisma.disputeEvidencePackage.findFirst({
      where: {
        OR: [{ id: packageIdOrCaseId }, { caseId: packageIdOrCaseId }],
      },
    });

    if (!pkg) {
      throw new Error(`Evidence package #${packageIdOrCaseId} not found.`);
    }

    const recomputedHash = crypto
      .createHash("sha256")
      .update(pkg.evidenceManifestJson, "utf8")
      .digest("hex");

    const isTamperFree = recomputedHash === pkg.packageHash;

    const updatedPkg = await prisma.disputeEvidencePackage.update({
      where: { id: pkg.id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
        lastDownloadedBy: downloadedByAdminId,
      },
    });

    await securityAuditLedgerService.recordSecurityEvent({
      actorId: downloadedByAdminId,
      actorRole: "ADMIN",
      action: "EVIDENCE_DOSSIER_DOWNLOADED",
      resourceType: "DISPUTE_EVIDENCE",
      resourceId: pkg.id,
      details: {
        caseId: pkg.caseId,
        downloadCount: updatedPkg.downloadCount,
        integrityVerified: isTamperFree,
      },
    });

    return {
      package: updatedPkg,
      isTamperFree,
      manifest: JSON.parse(pkg.evidenceManifestJson),
    };
  }

  /**
   * Lists historical dispute evidence packages.
   */
  public async listPackages() {
    return prisma.disputeEvidencePackage.findMany({
      orderBy: { compiledAt: "desc" },
      take: 50,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            totalPaise: true,
            status: true,
          },
        },
      },
    });
  }
}

export const disputeEvidenceService = new DisputeEvidenceService();

