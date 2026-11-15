import { prisma } from './prisma';

export interface ProductValidationIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  field: string;
  message: string;
}

export interface ProductValidationResult {
  productId: string;
  slug: string;
  title: string;
  category: string;
  brand: string | null;
  status: 'APPROVED' | 'PENDING_REVIEW' | 'NEEDS_CORRECTION' | 'REJECTED';
  issues: ProductValidationIssue[];
  passed: boolean;
}

export class ProductDataQualityEngine {
  /**
   * Validate a single product against e-commerce data quality invariants.
   */
  public static validateProduct(p: any): ProductValidationResult {
    const issues: ProductValidationIssue[] = [];

    if (!p.title || p.title.trim().length < 5) {
      issues.push({ severity: 'CRITICAL', field: 'title', message: 'Product title is missing or under 5 characters.' });
    }
    if (!p.slug || p.slug.trim().length < 3) {
      issues.push({ severity: 'CRITICAL', field: 'slug', message: 'Product slug is missing or invalid.' });
    }
    if (!p.description || p.description.trim().length < 20) {
      issues.push({ severity: 'CRITICAL', field: 'description', message: 'Product description is missing or too brief (<20 chars).' });
    }
    if (!p.categoryId) {
      issues.push({ severity: 'CRITICAL', field: 'categoryId', message: 'Product is not assigned to a category.' });
    }
    if (!p.vendorId) {
      issues.push({ severity: 'CRITICAL', field: 'vendorId', message: 'Product has no associated seller/vendor.' });
    }

    const titleLower = (p.title || '').toLowerCase();
    const commonBrands = [
      'canon', 'sony', 'nikon', 'fujifilm', 'apple', 'samsung', 'oneplus', 'boat',
      'jbl', 'bose', 'lg', 'whirlpool', 'haier', 'ifb', 'bosch', 'dell', 'lenovo',
      'asus', 'hp', 'gopro', 'dji', 'insta360', 'marshall', 'sennheiser', 'fabindia',
      'raw mango', 'forest essentials', 'kama ayurveda', 'sleepycat', 'wakefit'
    ];

    const detectedBrandInTitle = commonBrands.find(b => titleLower.includes(b));
    if (detectedBrandInTitle && (!p.brand || !p.brand.toLowerCase().includes(detectedBrandInTitle))) {
      issues.push({
        severity: 'CRITICAL',
        field: 'brand',
        message: `Brand mismatch: Title mentions "${detectedBrandInTitle.toUpperCase()}" but database brand field is "${p.brand || 'NULL'}".`
      });
    }

    if (!p.brand) {
      issues.push({ severity: 'WARNING', field: 'brand', message: 'Brand field is null in database.' });
    }

    if (!p.basePricePaise || p.basePricePaise <= 0) {
      issues.push({ severity: 'CRITICAL', field: 'basePricePaise', message: 'Base price must be a positive integer in paise.' });
    }
    if (p.compareAtPricePaise !== null && p.compareAtPricePaise !== undefined) {
      if (p.compareAtPricePaise < p.basePricePaise) {
        issues.push({
          severity: 'CRITICAL',
          field: 'compareAtPricePaise',
          message: `M.R.P. (${p.compareAtPricePaise} paise) is lower than selling price (${p.basePricePaise} paise).`
        });
      }
    }

    if (p.stock === null || p.stock === undefined || p.stock < 0) {
      issues.push({ severity: 'CRITICAL', field: 'stock', message: 'Stock must be a non-negative integer.' });
    }

    const images = p.images || [];
    if (images.length === 0) {
      issues.push({ severity: 'CRITICAL', field: 'images', message: 'Product has no images.' });
    } else {
      const primaryUrl = images[0]?.url || '';
      if (!primaryUrl.startsWith('/') && !primaryUrl.startsWith('http://') && !primaryUrl.startsWith('https://')) {
        issues.push({ severity: 'CRITICAL', field: 'images', message: 'Primary image URL is invalid or malformed.' });
      }
    }

    let specsCount = 0;
    if (p.attributesJson) {
      try {
        const parsed = JSON.parse(p.attributesJson);
        specsCount = Object.keys(parsed).length;
      } catch {
        issues.push({ severity: 'CRITICAL', field: 'attributesJson', message: 'attributesJson contains invalid JSON.' });
      }
    }

    const catSlug = p.category?.slug || '';
    if (['cameras-photography', 'smartphones-mobile-tech', 'laptops-computers', 'smart-televisions-displays', 'refrigerators-washing-machines', 'headphones-earphones'].includes(catSlug)) {
      if (specsCount < 2) {
        issues.push({
          severity: 'WARNING',
          field: 'specifications',
          message: `Technical category "${catSlug}" requires at least 2 structured technical specifications.`
        });
      }
    }

    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;

    let status: 'APPROVED' | 'PENDING_REVIEW' | 'NEEDS_CORRECTION' | 'REJECTED' = 'APPROVED';
    if (criticalCount > 0) {
      status = 'NEEDS_CORRECTION';
    } else if (warningCount > 0) {
      status = 'PENDING_REVIEW';
    }

    return {
      productId: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category?.name || 'Uncategorized',
      brand: p.brand,
      status,
      issues,
      passed: criticalCount === 0,
    };
  }

  /**
   * Run full catalog validation and return statistical audit report.
   */
  public static async auditCatalog(): Promise<{
    total: number;
    approved: number;
    needsCorrection: number;
    pendingReview: number;
    criticalIssuesCount: number;
    warningIssuesCount: number;
    results: ProductValidationResult[];
  }> {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        vendor: true,
        images: true,
        variants: true,
      },
    });

    const results = products.map(p => this.validateProduct(p));

    const total = results.length;
    const approved = results.filter(r => r.status === 'APPROVED').length;
    const needsCorrection = results.filter(r => r.status === 'NEEDS_CORRECTION').length;
    const pendingReview = results.filter(r => r.status === 'PENDING_REVIEW').length;
    const criticalIssuesCount = results.reduce((acc, r) => acc + r.issues.filter(i => i.severity === 'CRITICAL').length, 0);
    const warningIssuesCount = results.reduce((acc, r) => acc + r.issues.filter(i => i.severity === 'WARNING').length, 0);

    return {
      total,
      approved,
      needsCorrection,
      pendingReview,
      criticalIssuesCount,
      warningIssuesCount,
      results,
    };
  }
}
