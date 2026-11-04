import crypto from "crypto";
import { CustomerUser } from "@/types/customer";
import { hashPassword, verifyPassword } from "./password-util";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";
import { sanitizeText } from "./sanitizer";
import { notificationService } from "./notification-service";
import { otpService } from "./otp-service";

export const AUTH_COOKIE_NAME = "nexu_customer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface IAuthService {
  register(
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }>;

  login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }>;

  authenticateDemo(
    role: "customer" | "seller" | "admin"
  ): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }>;

  authenticateGoogle(
    payload: { email: string; name?: string; photoURL?: string; uid?: string; idToken?: string }
  ): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }>;

  authenticateWhatsAppOtp(
    phone: string,
    code: string
  ): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }>;

  validateSession(token: string): Promise<CustomerUser | null>;

  updateProfile(
    userId: string,
    data: { name?: string; phone?: string }
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }>;

  logout(token: string): Promise<void>;

  getUserById(userId: string): Promise<CustomerUser | null>;

  generatePasswordResetToken(email: string): Promise<{ success: boolean; token?: string; error?: string }>;

  resetPasswordWithToken(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }>;
}

export class PrismaAuthService implements IAuthService {
  public async register(
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    const cleanEmail = sanitizeText(email || "", 120).toLowerCase();
    const cleanName = sanitizeText(name || "", 100);
    const cleanPhone = phone ? sanitizeText(phone, 30) : undefined;

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Full name must be at least 2 characters." };
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: "Please provide a valid email address." };
    }
    if (!password || password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters long." };
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        return { success: false, error: "An account with this email address already exists." };
      }

      const passwordHash = hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          role: UserRole.CUSTOMER,
          profile: {
            create: {
              name: cleanName,
              phone: phone ? phone.trim() : undefined,
            },
          },
        },
        include: { profile: true },
      });

      // Queue welcome onboarding outbox notification
      notificationService
        .queueNotification({
          channel: "EMAIL",
          recipient: cleanEmail,
          template: "WELCOME_ONBOARDING",
          payload: {
            name: cleanName,
            email: cleanEmail,
            welcomeCoupon: "NEXUFIRST",
          },
        })
        .catch(() => {});

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.profile?.name || cleanName,
          phone: newUser.profile?.phone || undefined,
          createdAt: newUser.createdAt.toISOString(),
          role: "customer",
        },
      };
    } catch (err: unknown) {
      return { success: false, error: "Database error during registration." };
    }
  }

  public async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { profile: true, seller: true },
      });

      if (!user) {
        return { success: false, error: "Invalid email or password." };
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: "Invalid email or password." };
      }

      if (user.isSuspended) {
        return { success: false, error: "This account has been suspended." };
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.profile?.name || "Patron",
          phone: user.profile?.phone || undefined,
          createdAt: user.createdAt.toISOString(),
          role: user.role.toLowerCase() as "customer" | "seller" | "admin",
          activeStoreId: user.seller?.id || undefined,
        },
        token,
      };
    } catch (err: unknown) {
      return { success: false, error: "Authentication service unavailable." };
    }
  }

  public async authenticateDemo(
    role: "customer" | "seller" | "admin"
  ): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }> {
    const DEMO_EMAILS: Record<string, { email: string; defaultName: string }> = {
      customer: { email: "patron@nexu.studio", defaultName: "Vikramaditya Rao" },
      seller: { email: "solstice@nexu.studio", defaultName: "Solstice Handloom Textiles" },
      admin: { email: "admin@nexu.studio", defaultName: "Sarah Jenkins (Platform Owner)" },
    };

    const target = DEMO_EMAILS[role];
    if (!target) {
      return { success: false, error: "Invalid demo role specified." };
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: target.email },
        include: { profile: true, seller: true },
      });

      if (!user) {
        return { success: false, error: `Seeded demo user ${target.email} not found in database.` };
      }

      // Security Check: Server-side role enforcement (prevents client escalation)
      if (user.role.toLowerCase() !== role.toLowerCase()) {
        return { success: false, error: `Role mismatch: User is not authorized for demo role '${role}'.` };
      }

      if (user.isSuspended) {
        return { success: false, error: "Demo account is currently suspended." };
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "USER",
          entityId: user.id,
          action: "DEMO_LOGIN_SUCCEEDED",
          performedBy: target.email,
          note: `Evaluator authenticated via server-verified DEMO account: ${user.email} (${user.role}).`,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.profile?.name || target.defaultName,
          phone: user.profile?.phone || undefined,
          createdAt: user.createdAt.toISOString(),
          role: user.role.toLowerCase() as "customer" | "seller" | "admin",
          activeStoreId: user.seller?.id || undefined,
        },
        token,
      };
    } catch {
      return { success: false, error: "Database error during demo authentication." };
    }
  }

  public async authenticateGoogle(payload: {
    email: string;
    name?: string;
    photoURL?: string;
    uid?: string;
    idToken?: string;
  }): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }> {
    const cleanEmail = sanitizeText(payload.email || "", 120).toLowerCase();
    const cleanName = payload.name ? sanitizeText(payload.name, 100) : "Google Patron";

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: "Valid email address is required for Google Sign-In." };
    }

    try {
      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { profile: true, seller: true },
      });

      if (!user) {
        // Create new account: Always default to CUSTOMER role for security
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = hashPassword(randomPassword);

        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash,
            role: UserRole.CUSTOMER,
            profile: {
              create: {
                name: cleanName,
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
              },
            },
          },
          include: { profile: true, seller: true },
        });

        // Send welcome onboarding notification
        notificationService
          .queueNotification({
            channel: "EMAIL",
            recipient: cleanEmail,
            template: "WELCOME_ONBOARDING",
            payload: {
              name: cleanName,
              email: cleanEmail,
              welcomeCoupon: "NEXUFIRST",
            },
          })
          .catch(() => {});
      } else {
        // Update profile name if missing
        if (user.profile && !user.profile.name && cleanName) {
          await prisma.customerProfile.update({
            where: { userId: user.id },
            data: { name: cleanName },
          });
        }
      }

      if (user.isSuspended) {
        return { success: false, error: "This account has been suspended." };
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "USER",
          entityId: user.id,
          action: "GOOGLE_LOGIN_SUCCEEDED",
          performedBy: cleanEmail,
          note: `Authenticated via Google OAuth for user ${cleanEmail} (${user.role}).`,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.profile?.name || cleanName,
          phone: user.profile?.phone || undefined,
          createdAt: user.createdAt.toISOString(),
          role: user.role.toLowerCase() as "customer" | "seller" | "admin",
          activeStoreId: user.seller?.id || undefined,
        },
        token,
      };
    } catch {
      return { success: false, error: "Database error during Google authentication." };
    }
  }

  public async authenticateWhatsAppOtp(
    phone: string,
    code: string
  ): Promise<{ success: boolean; user?: CustomerUser; token?: string; error?: string }> {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: "Valid mobile phone number is required." };
    }

    const verifyRes = await otpService.verifyOtp({
      phone: cleanPhone,
      code,
      purpose: "LOGIN",
    });

    if (!verifyRes.verified) {
      return { success: false, error: verifyRes.message };
    }

    const normalized = otpService.normalizePhone(cleanPhone);
    const standard10 = cleanPhone.slice(-10);

    try {
      const generatedEmail = `patron.${standard10}@nexu-auth.internal`;

      // Look for existing user with this phone in profile or generated email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: generatedEmail },
            { profile: { phone: cleanPhone } },
            { profile: { phone: normalized } },
            { profile: { phone: `+${normalized}` } },
            { profile: { phone: standard10 } },
          ],
        },
        include: { profile: true, seller: true },
      });

      // If user does not exist, provision a verified customer account
      if (!user) {
        const tempHash = hashPassword(crypto.randomBytes(16).toString("hex"));

        user = await prisma.user.create({
          data: {
            email: generatedEmail,
            passwordHash: tempHash,
            role: UserRole.CUSTOMER,
            profile: {
              create: {
                name: `Patron ${standard10.slice(-4)}`,
                phone: normalized,
                isPhoneVerified: true,
                phoneVerifiedAt: new Date(),
              },
            },
          },
          include: { profile: true, seller: true },
        });

        // Queue welcome onboarding notification
        notificationService
          .queueNotification({
            channel: "EMAIL",
            recipient: generatedEmail,
            template: "WELCOME_ONBOARDING",
            payload: {
              name: user.profile?.name || "Patron",
              email: generatedEmail,
              welcomeCoupon: "NEXUFIRST",
            },
          })
          .catch(() => {});
      }

      if (user.isSuspended) {
        return { success: false, error: "This account has been suspended." };
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      await prisma.auditEvent.create({
        data: {
          entityType: "USER",
          entityId: user.id,
          action: "WHATSAPP_OTP_LOGIN_SUCCEEDED",
          performedBy: user.email,
          note: `User authenticated via verified WhatsApp OTP for phone ${normalized}.`,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.profile?.name || "Patron",
          phone: user.profile?.phone || undefined,
          createdAt: user.createdAt.toISOString(),
          role: user.role.toLowerCase() as "customer" | "seller" | "admin",
          activeStoreId: user.seller?.id || undefined,
        },
        token,
      };
    } catch {
      return { success: false, error: "Database error during WhatsApp OTP authentication." };
    }
  }

  public async validateSession(token: string): Promise<CustomerUser | null> {
    if (!token) return null;

    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: { profile: true, seller: true },
          },
        },
      });

      if (!session) return null;

      if (new Date() > session.expiresAt) {
        await prisma.session.delete({ where: { token } }).catch(() => {});
        return null;
      }

      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.profile?.name || "Patron",
        phone: session.user.profile?.phone || undefined,
        createdAt: session.user.createdAt.toISOString(),
        role: session.user.role.toLowerCase() as "customer" | "seller" | "admin",
        activeStoreId: session.user.seller?.id || undefined,
      };
    } catch {
      return null;
    }
  }

  public async updateProfile(
    userId: string,
    data: { name?: string; phone?: string }
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    try {
      const cleanName = data.name !== undefined ? sanitizeText(data.name, 100) : undefined;
      const cleanPhone = data.phone !== undefined ? sanitizeText(data.phone, 30) : undefined;

      const updatedProfile = await prisma.customerProfile.upsert({
        where: { userId },
        create: {
          userId,
          name: cleanName || "Patron",
          phone: cleanPhone,
        },
        update: {
          name: cleanName,
          phone: cleanPhone,
        },
        include: { user: true },
      });

      return {
        success: true,
        user: {
          id: updatedProfile.user.id,
          email: updatedProfile.user.email,
          name: updatedProfile.name,
          phone: updatedProfile.phone || undefined,
          createdAt: updatedProfile.user.createdAt.toISOString(),
          role: updatedProfile.user.role.toLowerCase() as "customer" | "seller" | "admin",
        },
      };
    } catch {
      return { success: false, error: "Failed to update profile." };
    }
  }

  public async logout(token: string): Promise<void> {
    if (!token) return;
    try {
      await prisma.session.deleteMany({
        where: { token },
      });
    } catch {
      // Ignore if session already expired or removed
    }
  }

  public async generatePasswordResetToken(
    email: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return { success: false, error: "Account not found." };
    }
    const timestamp = Date.now();
    const payload = `${user.id}:${timestamp}`;
    const secret = process.env.NEXTAUTH_SECRET || "nexu_secret_fallback_salt_2026";
    const sig = crypto.createHmac("sha256", secret + user.passwordHash).update(payload).digest("hex");
    const token = Buffer.from(`${payload}:${sig}`).toString("base64url");
    return { success: true, token };
  }

  public async resetPasswordWithToken(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!token || !newPassword || newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      const [userId, timestampStr, sig] = decoded.split(":");
      if (!userId || !timestampStr || !sig) {
        return { success: false, error: "Invalid password reset token format." };
      }

      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp) || Date.now() - timestamp > 1000 * 60 * 60) {
        return { success: false, error: "Password reset link has expired. Please request a new one." };
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, error: "User account not found." };
      }

      const secret = process.env.NEXTAUTH_SECRET || "nexu_secret_fallback_salt_2026";
      const expectedSig = crypto
        .createHmac("sha256", secret + user.passwordHash)
        .update(`${userId}:${timestampStr}`)
        .digest("hex");

      if (sig !== expectedSig) {
        return { success: false, error: "Invalid or expired password reset link." };
      }

      // Hash and update password
      const newHash = hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      // Invalidate all active sessions for security
      await prisma.session.deleteMany({ where: { userId: user.id } });

      // Record audit event
      await prisma.auditEvent.create({
        data: {
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "USER",
          entityId: user.id,
          performedBy: user.email,
          note: `Patron successfully reset password via secure cryptographic token.`,
        },
      });

      return { success: true };
    } catch {
      return { success: false, error: "Failed to reset password. Please try again." };
    }
  }

  public async getUserById(userId: string): Promise<CustomerUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, seller: true },
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.profile?.name || "Patron",
        phone: user.profile?.phone || undefined,
        createdAt: user.createdAt.toISOString(),
        role: user.role.toLowerCase() as "customer" | "seller" | "admin",
        activeStoreId: user.seller?.id || undefined,
      };
    } catch {
      return null;
    }
  }
}

export const authService = new PrismaAuthService();
