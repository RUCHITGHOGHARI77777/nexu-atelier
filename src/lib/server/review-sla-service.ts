import { prisma } from "./prisma";
import { ReviewSlaConfig, ProductSlaStatus } from "@/types/listing-engine";
import { notificationService } from "./notification-service";
import { ProductApprovalStatus } from "@prisma/client";

export class ReviewSlaService {
  /**
   * Retrieves active SLA configuration from PlatformSetting records.
   */
  public async getSlaConfig(): Promise<ReviewSlaConfig> {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: [
            "sla_review_minutes",
            "sla_reminder_intervals",
            "sla_business_hours_only",
            "sla_escalation_email",
            "sla_auto_approval_enabled",
          ],
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    let reminderIntervalsMinutes = [15, 30, 45];
    try {
      if (map.has("sla_reminder_intervals")) {
        reminderIntervalsMinutes = JSON.parse(map.get("sla_reminder_intervals")!);
      }
    } catch {}

    return {
      slaReviewMinutes: parseInt(map.get("sla_review_minutes") || "60", 10),
      reminderIntervalsMinutes,
      businessHoursOnly: map.get("sla_business_hours_only") === "true",
      escalationEmail: map.get("sla_escalation_email") || "admin@nexu.studio",
      autoApprovalEnabled: false, // Strict marketplace policy: never auto-approve on timeout
    };
  }

  /**
   * Updates SLA configuration (Admin only).
   */
  public async updateSlaConfig(
    adminEmail: string,
    config: Partial<ReviewSlaConfig>
  ): Promise<ReviewSlaConfig> {
    if (config.slaReviewMinutes !== undefined) {
      await prisma.platformSetting.upsert({
        where: { key: "sla_review_minutes" },
        create: {
          key: "sla_review_minutes",
          value: String(Math.max(5, config.slaReviewMinutes)),
          description: "Target product review SLA turnaround in minutes",
          updatedBy: adminEmail,
        },
        update: {
          value: String(Math.max(5, config.slaReviewMinutes)),
          updatedBy: adminEmail,
        },
      });
    }

    if (config.reminderIntervalsMinutes !== undefined) {
      await prisma.platformSetting.upsert({
        where: { key: "sla_reminder_intervals" },
        create: {
          key: "sla_reminder_intervals",
          value: JSON.stringify(config.reminderIntervalsMinutes),
          description: "Review reminder intervals in minutes",
          updatedBy: adminEmail,
        },
        update: {
          value: JSON.stringify(config.reminderIntervalsMinutes),
          updatedBy: adminEmail,
        },
      });
    }

    if (config.businessHoursOnly !== undefined) {
      await prisma.platformSetting.upsert({
        where: { key: "sla_business_hours_only" },
        create: {
          key: "sla_business_hours_only",
          value: String(config.businessHoursOnly),
          description: "Whether review SLA applies only during business hours",
          updatedBy: adminEmail,
        },
        update: {
          value: String(config.businessHoursOnly),
          updatedBy: adminEmail,
        },
      });
    }

    if (config.escalationEmail !== undefined) {
      await prisma.platformSetting.upsert({
        where: { key: "sla_escalation_email" },
        create: {
          key: "sla_escalation_email",
          value: config.escalationEmail.trim(),
          description: "Admin escalation recipient for SLA alerts",
          updatedBy: adminEmail,
        },
        update: {
          value: config.escalationEmail.trim(),
          updatedBy: adminEmail,
        },
      });
    }

    return this.getSlaConfig();
  }

  /**
   * Calculates current SLA status for a product.
   */
  public calculateProductSlaStatus(
    product: {
      id: string;
      title: string;
      approvalStatus: ProductApprovalStatus;
      submittedForReviewAt?: Date | null;
      reviewSlaMinutes?: number | null;
      isReviewOverdue?: boolean;
      reviewOverdueAt?: Date | null;
      slaReminderCount?: number;
      lastSlaReminderAt?: Date | null;
    },
    targetSlaMinutes: number = 60,
    referenceNow: Date = new Date()
  ): ProductSlaStatus {
    const slaMinutes = product.reviewSlaMinutes || targetSlaMinutes;
    const submittedAt = product.submittedForReviewAt || null;

    if (!submittedAt || product.approvalStatus !== ProductApprovalStatus.PENDING_REVIEW) {
      return {
        productId: product.id,
        productTitle: product.title,
        approvalStatus: product.approvalStatus,
        submittedForReviewAt: submittedAt ? submittedAt.toISOString() : null,
        slaReviewMinutes: slaMinutes,
        elapsedMinutes: 0,
        remainingMinutes: slaMinutes,
        isOverdue: false,
        overdueAt: null,
        slaReminderCount: 0,
        lastSlaReminderAt: null,
      };
    }

    const elapsedMs = referenceNow.getTime() - new Date(submittedAt).getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    const remainingMinutes = Math.max(0, slaMinutes - elapsedMinutes);
    const isOverdue = elapsedMinutes >= slaMinutes;

    return {
      productId: product.id,
      productTitle: product.title,
      approvalStatus: product.approvalStatus,
      submittedForReviewAt: submittedAt.toISOString(),
      slaReviewMinutes: slaMinutes,
      elapsedMinutes,
      remainingMinutes,
      isOverdue,
      overdueAt: isOverdue ? (product.reviewOverdueAt ? product.reviewOverdueAt.toISOString() : referenceNow.toISOString()) : null,
      slaReminderCount: product.slaReminderCount || 0,
      lastSlaReminderAt: product.lastSlaReminderAt ? product.lastSlaReminderAt.toISOString() : null,
    };
  }

  /**
   * Evaluates all pending review products against SLA thresholds, sending reminders and recording breaches.
   */
  public async processPendingReviewSlas(
    referenceNow: Date = new Date()
  ): Promise<{
    processedCount: number;
    remindersSent: number;
    breachesRecorded: number;
    overdueProductIds: string[];
  }> {
    const config = await this.getSlaConfig();

    const pendingProducts = await prisma.product.findMany({
      where: {
        approvalStatus: ProductApprovalStatus.PENDING_REVIEW,
      },
      include: {
        vendor: true,
      },
    });

    let remindersSent = 0;
    let breachesRecorded = 0;
    const overdueProductIds: string[] = [];

    for (const prod of pendingProducts) {
      const submittedAt = prod.submittedForReviewAt || prod.createdAt;
      const elapsedMs = referenceNow.getTime() - new Date(submittedAt).getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      const slaMinutes = prod.reviewSlaMinutes || config.slaReviewMinutes;

      if (elapsedMinutes >= slaMinutes) {
        // SLA Breach
        overdueProductIds.push(prod.id);

        if (!prod.isReviewOverdue) {
          await prisma.product.update({
            where: { id: prod.id },
            data: {
              isReviewOverdue: true,
              reviewOverdueAt: referenceNow,
            },
          });

          // Queue escalation notification
          await notificationService.queueNotification({
            channel: "EMAIL",
            recipient: config.escalationEmail,
            template: "ACCOUNT_RECOVERY",
            payload: {
              subject: `URGENT: Product Review SLA Overdue — "${prod.title}" (${prod.id})`,
              title: prod.title,
              vendorName: prod.vendor.name,
              elapsedMinutes,
              slaMinutes,
            },
          });

          await prisma.auditEvent.create({
            data: {
              entityType: "PRODUCT",
              entityId: prod.id,
              action: "PRODUCT_REVIEW_SLA_BREACHED",
              note: `Product "${prod.title}" breached review SLA (${elapsedMinutes} minutes elapsed vs ${slaMinutes}m SLA target). Overdue alert dispatched.`,
              performedBy: "SYSTEM_SLA_SCANNER",
            },
          });

          breachesRecorded++;
        }
      } else {
        // Check reminder intervals: e.g. [15, 30, 45]
        const intervals = [...config.reminderIntervalsMinutes].sort((a, b) => a - b);
        for (const interval of intervals) {
          if (elapsedMinutes >= interval) {
            // Check if reminder was already sent for this or higher interval
            const reminderCount = prod.slaReminderCount || 0;
            const targetCount = intervals.indexOf(interval) + 1;

            if (reminderCount < targetCount) {
              await prisma.product.update({
                where: { id: prod.id },
                data: {
                  lastSlaReminderAt: referenceNow,
                  slaReminderCount: targetCount,
                },
              });

              await notificationService.queueNotification({
                channel: "EMAIL",
                recipient: config.escalationEmail,
                template: "ACCOUNT_RECOVERY",
                payload: {
                  subject: `SLA Reminder (${interval}m): Pending Review — "${prod.title}"`,
                  title: prod.title,
                  elapsedMinutes,
                  remainingMinutes: slaMinutes - elapsedMinutes,
                },
              });

              remindersSent++;
            }
          }
        }
      }
    }

    return {
      processedCount: pendingProducts.length,
      remindersSent,
      breachesRecorded,
      overdueProductIds,
    };
  }

  /**
   * Resets and stops pending SLA timers when a product is approved, rejected, or changes requested.
   */
  public async onProductModerated(productId: string): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: {
        isReviewOverdue: false,
        reviewOverdueAt: null,
        slaReminderCount: 0,
      },
    });
  }
}

export const reviewSlaService = new ReviewSlaService();
