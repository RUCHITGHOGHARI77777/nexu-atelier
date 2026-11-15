import {
  CategoryAttributeDefinition,
  SmartListingQualityResult,
  QualityIssue,
  ProductAttributesMap,
} from "@/types/listing-engine";

const PROHIBITED_CLAIMS = [
  { pattern: /\b(100%\s*cure|miracle\s*cure|guaranteed\s*cure)\b/i, message: "Prohibited therapeutic claim: absolute medical cures cannot be claimed." },
  { pattern: /\b(fda\s*approved|who\s*certified|ayush\s*guaranteed)\b/i, message: "Unverified regulatory endorsement claim detected." },
  { pattern: /\b(guaranteed\s*(wealth|fortune|income|money))\b/i, message: "Prohibited financial or astrological wealth guarantee." },
  { pattern: /\b(weight\s*loss\s*in\s*\d+\s*days|fat\s*burner)\b/i, message: "Prohibited rapid weight-loss therapeutic claim." },
  { pattern: /\b(replica|first\s*copy|1st\s*copy|counterfeit|dupe)\b/i, message: "Prohibited counterfeit/replica terminology detected." },
];

const SPAM_TITLE_WORDS = [
  "FREE", "CHEAP", "BEST QUALITY", "BUY NOW", "HOT DEAL", "LIMITED OFFER", "NO 1", "SUPER OFFER"
];

export class SmartListingQualityChecker {
  /**
   * Evaluates product data against rigorous catalog standards and category-specific dynamic attributes.
   */
  public evaluate(
    product: {
      title?: string;
      subtitle?: string;
      description?: string;
      categoryId?: string;
      brand?: string;
      basePrice?: number;
      compareAtPrice?: number | null;
      stock?: number;
      sku?: string;
      images?: string[];
      variants?: Array<{
        sku: string;
        variantType: string;
        name: string;
        value: string;
        stock: number;
        additionalPrice?: number;
      }>;
      attributes?: ProductAttributesMap;
      weight?: string;
      dimensions?: string;
    },
    categoryAttributes: CategoryAttributeDefinition[] = []
  ): SmartListingQualityResult {
    const errors: QualityIssue[] = [];
    const warnings: QualityIssue[] = [];
    const suggestions: QualityIssue[] = [];

    let coreDetailsScore = 0;
    let categoryAttributesScore = 0;
    let mediaQualityScore = 0;
    let variantsAndStockScore = 0;
    let pricingSanityScore = 0;

    const title = (product.title || "").trim();
    if (!title || title.length < 5) {
      errors.push({
        field: "title",
        message: "Product title is required and must be at least 5 characters.",
        severity: "CRITICAL",
        tip: "A strong title includes craft technique, material, and article type.",
      });
    } else {
      let titlePoints = 15;
      if (title.length < 15) {
        warnings.push({
          field: "title",
          message: "Title is brief. High-converting marketplace titles typically contain 20–60 characters.",
          severity: "MEDIUM",
          tip: "Example: 'Handwoven Chanderi Silk Saree with Zari Border'",
        });
        titlePoints -= 5;
      }

      if (title.length > 8 && title === title.toUpperCase() && /[A-Z]/.test(title)) {
        warnings.push({
          field: "title",
          message: "Title is in ALL CAPS. Use title case for a premium editorial presentation.",
          severity: "MEDIUM",
          tip: "Convert from 'SILK SCARF' to 'Silk Scarf'.",
        });
        titlePoints -= 3;
      }

      const matchedSpam: string[] = [];
      for (const spam of SPAM_TITLE_WORDS) {
        if (title.toUpperCase().includes(spam)) {
          matchedSpam.push(spam);
        }
      }
      if (matchedSpam.length > 0) {
        warnings.push({
          field: "title",
          message: `Promotional phrase(s) "${matchedSpam.join('", "')}" in title degrades search quality and brand trust.`,
          severity: "HIGH",
          tip: "Remove promotional buzzwords. Highlight craft details instead.",
        });
        titlePoints -= 4 * matchedSpam.length;
      }

      if (/[!?]{2,}/.test(title)) {
        warnings.push({
          field: "title",
          message: "Avoid repetitive exclamation marks or question marks in listing titles.",
          severity: "LOW",
        });
        titlePoints -= 2;
      }

      coreDetailsScore += Math.max(0, titlePoints);
    }

    const description = (product.description || "").trim();
    if (!description || description.length < 15) {
      errors.push({
        field: "description",
        message: "Detailed description is required (at least 15 characters).",
        severity: "CRITICAL",
        tip: "Describe the artisan process, origin, and sensory characteristics.",
      });
    } else {
      const words = description.split(/\s+/).filter(Boolean);
      let descPoints = 10;
      if (words.length < 20) {
        warnings.push({
          field: "description",
          message: `Description contains only ${words.length} words. Detailed storytelling increases patron engagement.`,
          severity: "MEDIUM",
          tip: "Elaborate on provenance, weaving/casting techniques, and styling advice.",
        });
        descPoints -= 4;
      } else {
        suggestions.push({
          field: "description",
          message: "Excellent storytelling depth.",
          severity: "LOW",
          tip: "Consider adding bullet points for dimensions and care specifications.",
        });
      }
      coreDetailsScore += Math.max(0, descPoints);
    }

    if (!product.categoryId) {
      errors.push({
        field: "categoryId",
        message: "Marketplace category selection is required.",
        severity: "CRITICAL",
      });
    } else if (categoryAttributes.length > 0) {
      const attributes = product.attributes || {};
      const requiredAttrs = categoryAttributes.filter((a) => a.isRequired);
      const optionalAttrs = categoryAttributes.filter((a) => !a.isRequired);

      let requiredMatched = 0;
      for (const reqAttr of requiredAttrs) {
        const entry = attributes[reqAttr.slug];
        const val = entry?.value;

        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          errors.push({
            field: `attributes.${reqAttr.slug}`,
            message: `Required category attribute missing: "${reqAttr.name}".`,
            severity: "CRITICAL",
            tip: `Select or provide a value for ${reqAttr.name}.`,
          });
        } else {
          let isValid = true;

          if (reqAttr.dataType === "MEASUREMENT") {
            if (reqAttr.allowedUnits && reqAttr.allowedUnits.length > 0) {
              if (!entry.unit || !reqAttr.allowedUnits.includes(entry.unit)) {
                errors.push({
                  field: `attributes.${reqAttr.slug}`,
                  message: `Invalid unit for ${reqAttr.name}. Allowed units: ${reqAttr.allowedUnits.join(", ")}.`,
                  severity: "HIGH",
                });
                isValid = false;
              }
            }
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
              errors.push({
                field: `attributes.${reqAttr.slug}`,
                message: `${reqAttr.name} must be a valid positive number.`,
                severity: "HIGH",
              });
              isValid = false;
            }
          } else if (reqAttr.dataType === "DROPDOWN") {
            if (reqAttr.allowedValues.length > 0 && !reqAttr.allowedValues.includes(String(val))) {
              errors.push({
                field: `attributes.${reqAttr.slug}`,
                message: `Invalid value for ${reqAttr.name}. Must be one of the permitted options.`,
                severity: "HIGH",
              });
              isValid = false;
            }
          } else if (reqAttr.dataType === "MULTI_SELECT") {
            if (Array.isArray(val)) {
              for (const item of val) {
                if (!reqAttr.allowedValues.includes(item)) {
                  warnings.push({
                    field: `attributes.${reqAttr.slug}`,
                    message: `Unrecognized selection "${item}" for ${reqAttr.name}.`,
                    severity: "MEDIUM",
                  });
                }
              }
            }
          }

          if (isValid) {
            requiredMatched++;
          }
        }
      }

      const reqRatio = requiredAttrs.length > 0 ? requiredMatched / requiredAttrs.length : 1;
      let optMatched = 0;
      for (const optAttr of optionalAttrs) {
        const val = attributes[optAttr.slug]?.value;
        if (val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0)) {
          optMatched++;
        }
      }
      const optRatio = optionalAttrs.length > 0 ? optMatched / optionalAttrs.length : 1;

      categoryAttributesScore = Math.round(reqRatio * 20 + optRatio * 5);
    } else {
      categoryAttributesScore = 20;
    }

    const images = (product.images || []).filter((img) => typeof img === "string" && img.trim().length > 0);
    if (images.length === 0) {
      errors.push({
        field: "images",
        message: "At least one product photograph is mandatory.",
        severity: "CRITICAL",
        tip: "Upload clear, high-resolution photographs representing the true craft color.",
      });
    } else {
      let mediaPts = 10;
      if (images.length < 3) {
        warnings.push({
          field: "images",
          message: `Only ${images.length} image(s) provided. Listings with 3+ images experience 40% fewer return inquiries.`,
          severity: "MEDIUM",
          tip: "Add close-up texture, dimensional scale, and lifestyle angles.",
        });
      } else {
        mediaPts += 7;
      }

      const uniqueImages = new Set(images);
      if (uniqueImages.size < images.length) {
        warnings.push({
          field: "images",
          message: "Duplicate images detected. Each image slot should offer a distinct angle or view.",
          severity: "MEDIUM",
        });
      } else {
        mediaPts += 3;
      }

      mediaQualityScore = mediaPts;
    }

    const variants = product.variants || [];
    if (variants.length > 0) {
      let varPts = 15;
      const seenSkus = new Set<string>();
      let totalVariantStock = 0;

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.sku || !v.sku.trim()) {
          errors.push({
            field: `variants.${i}.sku`,
            message: `Variant #${i + 1} is missing a SKU code.`,
            severity: "CRITICAL",
          });
          varPts -= 5;
        } else {
          const norm = v.sku.trim().toUpperCase();
          if (seenSkus.has(norm)) {
            errors.push({
              field: `variants.${i}.sku`,
              message: `Duplicate SKU detected: "${v.sku}". SKUs must be globally unique.`,
              severity: "CRITICAL",
            });
            varPts -= 5;
          }
          seenSkus.add(norm);
        }

        if (!v.value || !v.value.trim()) {
          errors.push({
            field: `variants.${i}.value`,
            message: `Variant #${i + 1} has no attribute value (e.g. Size or Color).`,
            severity: "CRITICAL",
          });
          varPts -= 4;
        }

        if (v.stock < 0) {
          errors.push({
            field: `variants.${i}.stock`,
            message: `Variant #${i + 1} stock cannot be negative.`,
            severity: "CRITICAL",
          });
          varPts -= 5;
        } else {
          totalVariantStock += v.stock;
        }
      }

      if (totalVariantStock === 0) {
        warnings.push({
          field: "variants",
          message: "All configured variants currently have 0 stock. Product will appear as Out of Stock.",
          severity: "HIGH",
        });
        varPts -= 3;
      }

      variantsAndStockScore = Math.max(0, varPts);
    } else {
      let stockPts = 15;
      const stock = product.stock !== undefined ? product.stock : 0;
      if (stock < 0) {
        errors.push({
          field: "stock",
          message: "Product stock cannot be negative.",
          severity: "CRITICAL",
        });
        stockPts = 0;
      } else if (stock === 0) {
        warnings.push({
          field: "stock",
          message: "Stock is set to 0. Listing will immediately show as Out of Stock upon approval.",
          severity: "MEDIUM",
        });
        stockPts -= 5;
      }

      if (!product.sku || !product.sku.trim()) {
        suggestions.push({
          field: "sku",
          message: "Master SKU is recommended for streamlined warehouse inventory management.",
          severity: "LOW",
          tip: "Example: NX-APP-SILK-001",
        });
      }

      variantsAndStockScore = stockPts;
    }

    const basePrice = product.basePrice !== undefined ? product.basePrice : 0;
    const compareAt = product.compareAtPrice !== undefined ? product.compareAtPrice : null;

    let pricePts = 15;
    if (basePrice <= 0) {
      errors.push({
        field: "basePrice",
        message: "Selling price must be greater than zero.",
        severity: "CRITICAL",
      });
      pricePts = 0;
    } else if (compareAt !== null && compareAt !== undefined && compareAt > 0) {
      if (compareAt < basePrice) {
        errors.push({
          field: "compareAtPrice",
          message: "MRP (Original Price) cannot be lower than the Selling Price.",
          severity: "CRITICAL",
          tip: "Either leave MRP empty or set it equal to or greater than selling price.",
        });
        pricePts -= 8;
      } else {
        const discountPercent = Math.round(((compareAt - basePrice) / compareAt) * 100);
        if (discountPercent > 85) {
          warnings.push({
            field: "compareAtPrice",
            message: `Discount of ${discountPercent}% is unusually steep. Consumer standards require authentic non-misleading MRPs.`,
            severity: "HIGH",
            tip: "Verify that MRP reflects realistic market valuation.",
          });
          pricePts -= 4;
        }
      }
    }

    const corpus = `${title} ${description} ${product.subtitle || ""}`;
    for (const claim of PROHIBITED_CLAIMS) {
      if (claim.pattern.test(corpus)) {
        errors.push({
          field: "description",
          message: claim.message,
          severity: "CRITICAL",
          tip: "Remove medical, therapeutic, miraculous, or counterfeit claims to comply with listing guidelines.",
        });
        pricePts -= 10;
        break;
      }
    }

    pricingSanityScore = Math.max(0, pricePts);

    const totalScore = Math.min(
      100,
      coreDetailsScore +
        categoryAttributesScore +
        mediaQualityScore +
        variantsAndStockScore +
        pricingSanityScore
    );

    const canSubmit = errors.length === 0;

    let summary = "";
    if (!canSubmit) {
      summary = `Listing has ${errors.length} blocking issue(s) that must be resolved before submission for Admin review.`;
    } else if (warnings.length > 0) {
      summary = `Ready for submission (${totalScore}/100). Resolving ${warnings.length} warning(s) will maximize patron trust and reduce inquiries.`;
    } else {
      summary = `Exemplary listing completeness (${totalScore}/100). All catalog standards and category attributes satisfied.`;
    }

    summary += " Note: Completeness score reflects catalog hygiene and does not guarantee sales volume or ranking.";

    return {
      score: totalScore,
      canSubmit,
      errors,
      warnings,
      suggestions,
      breakdown: {
        coreDetails: coreDetailsScore,
        categoryAttributes: categoryAttributesScore,
        mediaQuality: mediaQualityScore,
        variantsAndStock: variantsAndStockScore,
        pricingSanity: pricingSanityScore,
      },
      summary,
    };
  }
}

export const smartListingQualityChecker = new SmartListingQualityChecker();
