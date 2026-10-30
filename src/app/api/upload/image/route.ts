import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session-helper";
import { checkRateLimit, getClientIp, SECURITY_RATE_LIMITS } from "@/lib/server/rate-limiter";
import { prisma } from "@/lib/server/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

/**
 * Validates file signature (magic bytes) to ensure file content matches image type.
 */
function validateImageMagicBytes(buffer: Buffer): { valid: boolean; ext: string; mime: string } {
  if (buffer.length < 8) return { valid: false, ext: "", mime: "" };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: "jpg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, ext: "png", mime: "image/png" };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: "webp", mime: "image/webp" };
  }

  return { valid: false, ext: "", mime: "" };
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to upload media." },
      { status: 401 }
    );
  }

  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimit(
    `${clientIp}:${user.id}`,
    "FILE_UPLOAD",
    SECURITY_RATE_LIMITS.FILE_UPLOAD
  );

  if (!rateCheck.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: `Upload rate limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": rateCheck.retryAfterSeconds.toString(),
        },
      }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file payload detected." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum size threshold of 4MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate byte signatures (magic bytes)
    const { valid, ext, mime } = validateImageMagicBytes(buffer);
    if (!valid) {
      await prisma.auditEvent.create({
        data: {
          entityType: "SECURITY",
          entityId: user.id,
          action: "MALICIOUS_UPLOAD_BLOCKED",
          performedBy: user.email,
          note: `User attempted to upload invalid or prohibited non-image file type (${file.type || "unknown"}).`,
        },
      });

      return NextResponse.json(
        { error: "Invalid file format. Only verified JPEG, PNG, or WebP images are permitted." },
        { status: 400 }
      );
    }

    // Generate cryptographically random server-side filename (prevents path traversal)
    const secureFileName = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await fs.mkdir(uploadDir, { recursive: true });
    const targetPath = path.join(uploadDir, secureFileName);

    await fs.writeFile(targetPath, buffer);

    await prisma.auditEvent.create({
      data: {
        entityType: "USER_UPLOAD",
        entityId: secureFileName,
        action: "IMAGE_UPLOADED",
        performedBy: user.email,
        note: `Patron uploaded verified ${mime} image (${file.size} bytes).`,
      },
    });

    const publicUrl = `/uploads/${secureFileName}`;
    return NextResponse.json({ success: true, url: publicUrl, mime, size: file.size });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
