import { describe, it, expect } from 'vitest';
import { prisma } from '../prisma';
import fs from 'fs';
import path from 'path';

describe('NEXU ATELIER — Catalog Image Integrity & Uniqueness Regression Suite', () => {
  it('ensures every product has at least one valid ProductImage', async () => {
    const products = await prisma.product.findMany({
      include: {
        images: true,
      },
    });

    expect(products.length).toBeGreaterThan(0);

    for (const p of products) {
      expect(p.images.length, `Product #${p.id} (${p.title}) has 0 images`).toBeGreaterThan(0);
    }
  });

  it('guarantees 100% primary image uniqueness across all catalog products (zero duplicate groups)', async () => {
    const products = await prisma.product.findMany({
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const primaryUrlMap = new Map<string, string[]>();

    for (const p of products) {
      const primary = p.images.find((img) => img.isPrimary) || p.images[0];
      expect(primary, `Product #${p.id} missing primary image`).toBeDefined();
      expect(primary.url, `Product #${p.id} has empty image URL`).toBeTruthy();

      const existing = primaryUrlMap.get(primary.url) || [];
      existing.push(p.id);
      primaryUrlMap.set(primary.url, existing);
    }

    const duplicates: { url: string; count: number; products: string[] }[] = [];
    for (const [url, pids] of primaryUrlMap.entries()) {
      if (pids.length > 1) {
        duplicates.push({ url, count: pids.length, products: pids });
      }
    }

    expect(
      duplicates,
      `Found ${duplicates.length} duplicate primary image groups: ${JSON.stringify(duplicates, null, 2)}`
    ).toHaveLength(0);

    expect(primaryUrlMap.size).toBe(products.length);
  });

  it('verifies no product uses the known broken 404 television image', async () => {
    const brokenPattern = 'photo-1593359677875-a55490b7ae56';
    const brokenImages = await prisma.productImage.findMany({
      where: {
        url: { contains: brokenPattern },
      },
    });

    expect(
      brokenImages.length,
      `Found ${brokenImages.length} images using confirmed 404 URL '${brokenPattern}'`
    ).toBe(0);
  });

  it('verifies all local static product images exist on disk', async () => {
    const localImages = await prisma.productImage.findMany({
      where: {
        url: { startsWith: '/' },
      },
    });

    expect(localImages.length).toBeGreaterThan(0);

    for (const img of localImages) {
      const cleanPath = img.url.replace(/^\//, '').split('?')[0];
      const diskPath = path.join(process.cwd(), 'public', cleanPath);
      const exists = fs.existsSync(diskPath);
      expect(exists, `Local static asset missing on disk: ${diskPath}`).toBe(true);
    }
  });

  it('verifies all primary images possess descriptive alt text', async () => {
    const primaryImages = await prisma.productImage.findMany({
      where: { isPrimary: true },
    });

    for (const img of primaryImages) {
      expect(img.alt, `Image #${img.id} has missing alt text`).toBeTruthy();
      expect(img.alt.trim().length, `Image #${img.id} has too short alt text`).toBeGreaterThan(5);
    }
  });
});

