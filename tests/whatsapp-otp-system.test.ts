import { describe, it, expect, beforeEach } from "vitest";
import { whatsappService } from "@/lib/server/whatsapp-service";
import { otpService } from "@/lib/server/otp-service";
import { authService } from "@/lib/server/auth-service";
import { prisma } from "@/lib/server/prisma";

describe("WhatsApp Business Cloud API & OTP Authentication Architecture", () => {
  const testPhone = "9876500001";
  const normalizedTestPhone = "919876500001";

  beforeEach(async () => {
    // Clear test OTPs for this phone
    await prisma.verificationOtp.deleteMany({
      where: { identifier: normalizedTestPhone },
    });
  });

  describe("WhatsApp Cloud API Service", () => {
    it("normalizes Indian 10-digit mobile numbers to E.164 without leading plus", () => {
      expect(whatsappService.normalizePhone("9876543210")).toBe("919876543210");
      expect(whatsappService.normalizePhone("+91 98765-43210")).toBe("919876543210");
      expect(whatsappService.normalizePhone("919876543210")).toBe("919876543210");
    });

    it("masks phone numbers safely for logs and customer UI", () => {
      const masked = whatsappService.maskPhone("9876543210");
      expect(masked).toContain("+91 987*****10");
      expect(masked).not.toBe("9876543210");
    });

    it("rejects phone numbers with invalid digit lengths", async () => {
      const result = await whatsappService.sendOtp({
        recipientPhone: "123",
        otpCode: "123456",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid international phone number format");
    });

    it("dispatches OTP in simulator mode when Meta credentials are unset or mock", async () => {
      const result = await whatsappService.sendOtp({
        recipientPhone: testPhone,
        otpCode: "654321",
        purpose: "LOGIN",
      });
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.messageId).toContain("sim_wamid_");
    });

    it("formats standard Meta Cloud API authentication template payload correctly", async () => {
      let capturedPayload: any = null;
      whatsappService.setClientForTesting({
        sendMessage: async (payload: any) => {
          capturedPayload = payload;
          return { success: true, messageId: "wamid.mock_real_123" };
        },
      });

      const res = await whatsappService.sendOtp({
        recipientPhone: "919876543210",
        otpCode: "789012",
        purpose: "REGISTRATION",
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBe("wamid.mock_real_123");
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.messaging_product).toBe("whatsapp");
      expect(capturedPayload.type).toBe("template");
      expect(capturedPayload.template.components[0].parameters[0].text).toBe("789012");

      // Reset client to default simulator
      whatsappService.setClientForTesting(null);
    });
  });

  describe("OTP Generation & Verification Engine", () => {
    it("generates a cryptographically random 6-digit OTP and hashes it in the database", async () => {
      const res = await otpService.requestOtp({
        phone: testPhone,
        purpose: "PHONE_VERIFICATION",
      });

      expect(res.success).toBe(true);
      expect(res.cooldownSeconds).toBe(60);
      expect(res.expiresInSeconds).toBe(300);
      expect(res._debugCode).toBeDefined();
      expect(res._debugCode?.length).toBe(6);

      // Verify plaintext code is NOT stored in the database (only SHA-256 hash)
      const record = await prisma.verificationOtp.findFirst({
        where: { identifier: normalizedTestPhone },
        orderBy: { createdAt: "desc" },
      });

      expect(record).not.toBeNull();
      expect(record?.otpHash).not.toBe(res._debugCode);
      expect(record?.otpHash.length).toBe(64); // SHA-256 hex string length
    });

    it("enforces a 60-second resend cooldown before allowing another OTP request", async () => {
      await otpService.requestOtp({
        phone: testPhone,
        purpose: "PHONE_VERIFICATION",
      });

      await expect(
        otpService.requestOtp({
          phone: testPhone,
          purpose: "PHONE_VERIFICATION",
        })
      ).rejects.toThrow("Please wait");
    });

    it("verifies the correct OTP code and consumes it to prevent replay attacks", async () => {
      const req = await otpService.requestOtp({
        phone: testPhone,
        purpose: "LOGIN",
      });

      const verifyRes = await otpService.verifyOtp({
        phone: testPhone,
        code: req._debugCode!,
        purpose: "LOGIN",
      });

      expect(verifyRes.success).toBe(true);
      expect(verifyRes.verified).toBe(true);

      // Attempting to verify the exact same code again must fail (consumed / replay prevention)
      const replayRes = await otpService.verifyOtp({
        phone: testPhone,
        code: req._debugCode!,
        purpose: "LOGIN",
      });

      expect(replayRes.verified).toBe(false);
      expect(replayRes.message).toContain("No active verification code found");
    });

    it("enforces the 3-attempt limit and locks the code upon repeated incorrect entries", async () => {
      await otpService.requestOtp({
        phone: testPhone,
        purpose: "PASSWORD_RESET",
      });

      // Attempt 1: incorrect
      const a1 = await otpService.verifyOtp({
        phone: testPhone,
        code: "000000",
        purpose: "PASSWORD_RESET",
      });
      expect(a1.verified).toBe(false);
      expect(a1.remainingAttempts).toBe(2);

      // Attempt 2: incorrect
      const a2 = await otpService.verifyOtp({
        phone: testPhone,
        code: "111111",
        purpose: "PASSWORD_RESET",
      });
      expect(a2.verified).toBe(false);
      expect(a2.remainingAttempts).toBe(1);

      // Attempt 3: incorrect
      const a3 = await otpService.verifyOtp({
        phone: testPhone,
        code: "222222",
        purpose: "PASSWORD_RESET",
      });
      expect(a3.verified).toBe(false);
      expect(a3.remainingAttempts).toBe(0);

      // Attempt 4: locked
      const a4 = await otpService.verifyOtp({
        phone: testPhone,
        code: "333333",
        purpose: "PASSWORD_RESET",
      });
      expect(a4.verified).toBe(false);
      expect(a4.message).toContain("Maximum verification attempts exceeded");
    });
  });

  describe("Seamless WhatsApp OTP Customer Authentication", () => {
    it("authenticates an existing or newly provisioned customer via verified WhatsApp OTP", async () => {
      const loginReq = await otpService.requestOtp({
        phone: testPhone,
        purpose: "LOGIN",
      });

      const authRes = await authService.authenticateWhatsAppOtp(testPhone, loginReq._debugCode!);

      expect(authRes.success).toBe(true);
      expect(authRes.token).toBeDefined();
      expect(authRes.user).toBeDefined();
      expect(authRes.user?.role).toBe("customer");

      // Verify session was persisted
      const session = await prisma.session.findUnique({
        where: { token: authRes.token! },
      });
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(authRes.user?.id);

      // Cleanup
      if (session) {
        await prisma.session.delete({ where: { token: session.token } });
      }
    });
  });
});
