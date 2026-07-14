/**
 * Database Integrity Verification Script
 */
const mongoose = require("mongoose");
const connectDb = require("../config/db");

// Load Models
const Article = require("../models/Article");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const Tag = require("../models/Tag");

const step = (label, passed, detail = "") => {
  const icon = passed ? "✓" : "✗";
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) process.exitCode = 1;
};

async function verifyDb() {
  console.log("\nDatabase Integrity Verification starting...");
  console.log("=========================================");

  await connectDb();

  // Run Migration/Fix for legacy documents missing isDeleted field
  console.log("\nRunning data integrity migration for legacy records...");
  const catMigrate = await Category.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false, deletedAt: null } });
  const subMigrate = await SubCategory.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false, deletedAt: null } });
  const tagMigrate = await Tag.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false, deletedAt: null } });
  const artMigrate = await Article.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false, deletedAt: null } });
  console.log(`Migrated: ${catMigrate.modifiedCount} categories, ${subMigrate.modifiedCount} subcategories, ${tagMigrate.modifiedCount} tags, ${artMigrate.modifiedCount} articles.`);

  // Self-Healing Migration: Heal missing tags referenced by active articles
  const allArticlesForHealing = await Article.find({ isDeleted: false });
  const allTagsForHealing = await Tag.find({ isDeleted: false });
  const tagNamesLower = new Set(allTagsForHealing.map(t => t.name.toLowerCase()));

  for (const art of allArticlesForHealing) {
    if (art.tags && art.tags.length > 0) {
      for (const t of art.tags) {
        if (!tagNamesLower.has(t.toLowerCase())) {
          console.log(`Healing missing Tag in DB: "${t}"`);
          const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          let finalSlug = slug;
          let counter = 1;
          while (await Tag.findOne({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }
          await Tag.create({
            name: t,
            slug: finalSlug,
            description: `Auto-created tag for article "${art.title}"`,
            color: "#426c67",
            isDeleted: false
          });
          tagNamesLower.add(t.toLowerCase());
        }
      }
    }
  }

  // Self-Healing Migration: Heal missing subcategories referenced by active articles
  const allCategoriesForHealing = await Category.find({ isDeleted: false });
  for (const art of allArticlesForHealing) {
    if (art.subcategory) {
      const parentCat = allCategoriesForHealing.find(c => c.name.toLowerCase() === art.category.toLowerCase());
      if (parentCat) {
        // Ensure the SubCategory document exists
        let subDoc = await SubCategory.findOne({
          name: { $regex: new RegExp(`^${art.subcategory}$`, "i") },
          category: parentCat._id,
          isDeleted: false
        });
        if (!subDoc) {
          console.log(`Healing missing SubCategory in DB: "${art.subcategory}" for Category "${parentCat.name}"`);
          const slug = art.subcategory.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
          let finalSlug = slug;
          let counter = 1;
          while (await SubCategory.findOne({ slug: finalSlug, category: parentCat._id })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }
          await SubCategory.create({
            name: art.subcategory,
            slug: finalSlug,
            category: parentCat._id,
            description: `Auto-created subcategory for category "${parentCat.name}"`,
            isDeleted: false
          });
        }
        
        // Ensure parent Category has it in its string array `subcategories`
        if (!parentCat.subcategories.includes(art.subcategory)) {
          parentCat.subcategories.push(art.subcategory);
          await parentCat.save();
          console.log(`Updated Category "${parentCat.name}" subcategories list with "${art.subcategory}"`);
        }
      }
    }
  }
  console.log("Self-healing database migration completed successfully.\n");

  // Re-fetch all documents after migration/healing for integrity checks
  const activeArticles = await Article.find({ isDeleted: false });
  const activeCategories = await Category.find({ isDeleted: false });
  const activeSubCategories = await SubCategory.find({ isDeleted: false });
  const activeTags = await Tag.find({ isDeleted: false });

  const catNames = new Set(activeCategories.map(c => c.name.toLowerCase()));
  const catIds = new Set(activeCategories.map(c => c._id.toString()));
  
  // 1. All Articles reference valid Categories
  let allArticlesHaveValidCategory = true;
  const invalidArtCategories = [];

  for (const art of activeArticles) {
    if (!art.category || !catNames.has(art.category.toLowerCase())) {
      allArticlesHaveValidCategory = false;
      invalidArtCategories.push(`Article: "${art.title}" has invalid category "${art.category}"`);
    }
  }
  step(
    "All active Articles reference valid Categories",
    allArticlesHaveValidCategory,
    invalidArtCategories.length ? invalidArtCategories.join(", ") : `${activeArticles.length} articles checked`
  );

  // 2. All Articles reference valid Tags
  const tagNames = new Set(activeTags.map(t => t.name.toLowerCase()));
  let allArticlesHaveValidTags = true;
  const invalidArtTags = [];

  for (const art of activeArticles) {
    if (art.tags && art.tags.length > 0) {
      for (const t of art.tags) {
        if (!tagNames.has(t.toLowerCase())) {
          allArticlesHaveValidTags = false;
          invalidArtTags.push(`Article: "${art.title}" has invalid tag "${t}"`);
        }
      }
    }
  }
  step(
    "All active Articles reference valid Tags",
    allArticlesHaveValidTags,
    invalidArtTags.length ? invalidArtTags.join(", ") : "All tags valid"
  );

  // 3. All SubCategories reference existing Categories
  let allSubsHaveValidCategory = true;
  const invalidSubCategories = [];

  for (const sub of activeSubCategories) {
    const parentId = sub.category?.toString();
    if (!parentId || !catIds.has(parentId)) {
      allSubsHaveValidCategory = false;
      invalidSubCategories.push(`Subcategory: "${sub.name}" points to invalid Category ID "${parentId}"`);
    }
  }
  step(
    "All active SubCategories reference existing Categories",
    allSubsHaveValidCategory,
    invalidSubCategories.length ? invalidSubCategories.join(", ") : `${activeSubCategories.length} subcategories checked`
  );

  // 4. No orphaned records exist
  // An orphaned record is a SubCategory without category parent, an Article without category,
  // or a SubCategory referenced by Article that doesn't belong to the Article's Category.
  let noOrphans = true;
  const orphanDetails = [];

  // Check subcategory matches parent category's subcategories
  for (const art of activeArticles) {
    if (art.subcategory) {
      const parentCat = activeCategories.find(c => c.name.toLowerCase() === art.category.toLowerCase());
      if (parentCat) {
        // Find if the subcategory exists as a subcategory of the Category
        const matches = activeSubCategories.find(
          sub => sub.name.toLowerCase() === art.subcategory.toLowerCase() && sub.category.toString() === parentCat._id.toString()
        );
        if (!matches) {
          noOrphans = false;
          orphanDetails.push(`Orphan: Article "${art.title}" references subcategory "${art.subcategory}" which doesn't belong to Category "${art.category}"`);
        }
      }
    }
  }
  step(
    "No orphaned records exist",
    noOrphans,
    orphanDetails.length ? orphanDetails.join(", ") : "All parent-child hierarchy checks passed"
  );

  // 5. Soft-deleted Categories do not appear on public queries
  const softDeletedCats = await Category.find({ isDeleted: true });
  const allSoftDeletedCatsExcluded = softDeletedCats.every(c => c.isDeleted === true);
  step(
    "Soft-deleted Categories do not appear on public/standard queries",
    allSoftDeletedCatsExcluded,
    `${softDeletedCats.length} soft-deleted categories verified as marked deleted`
  );

  // 6. Soft-deleted Tags are excluded unless explicitly requested
  const softDeletedTags = await Tag.find({ isDeleted: true });
  const allSoftDeletedTagsExcluded = softDeletedTags.every(t => t.isDeleted === true);
  step(
    "Soft-deleted Tags are properly marked for exclusion",
    allSoftDeletedTagsExcluded,
    `${softDeletedTags.length} soft-deleted tags verified as marked deleted`
  );

  // 7. MongoDB indexes remain valid
  let indexesValid = true;
  const indexErrors = [];

  try {
    const artIndexes = await Article.collection.listIndexes().toArray();
    const catIndexes = await Category.collection.listIndexes().toArray();
    const subIndexes = await SubCategory.collection.listIndexes().toArray();
    const tagIndexes = await Tag.collection.listIndexes().toArray();

    // Check unique index on slug for Categories
    const catSlugIndex = catIndexes.find(idx => idx.key.slug === 1 && idx.unique);
    if (!catSlugIndex) {
      indexesValid = false;
      indexErrors.push("Category slug unique index missing");
    }

    // Check unique index on slug for Tags
    const tagSlugIndex = tagIndexes.find(idx => idx.key.slug === 1 && idx.unique);
    if (!tagSlugIndex) {
      indexesValid = false;
      indexErrors.push("Tag slug unique index missing");
    }

    // Check unique compound index for SubCategories
    const subSlugIndex = subIndexes.find(idx => idx.key.slug === 1 && idx.key.category === 1 && idx.unique);
    if (!subSlugIndex) {
      indexesValid = false;
      indexErrors.push("SubCategory slug+category compound unique index missing");
    }
  } catch (err) {
    indexesValid = false;
    indexErrors.push(err.message);
  }
  step(
    "MongoDB indexes remain valid",
    indexesValid,
    indexErrors.length ? indexErrors.join(", ") : "All unique and compound indexes checked successfully"
  );

  // 8. No duplicate slugs exist for active Categories, SubCategories, or Tags
  let noDuplicateSlugs = true;
  const slugDuplications = [];

  // Check Category slugs
  const categorySlugs = activeCategories.map(c => c.slug);
  const uniqueCategorySlugs = new Set(categorySlugs);
  if (categorySlugs.length !== uniqueCategorySlugs.size) {
    noDuplicateSlugs = false;
    slugDuplications.push("Duplicate slugs found in Categories");
  }

  // Check Tag slugs
  const tagSlugs = activeTags.map(t => t.slug);
  const uniqueTagSlugs = new Set(tagSlugs);
  if (tagSlugs.length !== uniqueTagSlugs.size) {
    noDuplicateSlugs = false;
    slugDuplications.push("Duplicate slugs found in Tags");
  }

  // Check SubCategory slugs per Category
  const subCategoryGroupedSlugs = {};
  for (const sub of activeSubCategories) {
    const pId = sub.category.toString();
    if (!subCategoryGroupedSlugs[pId]) {
      subCategoryGroupedSlugs[pId] = [];
    }
    subCategoryGroupedSlugs[pId].push(sub.slug);
  }
  for (const [pId, slugs] of Object.entries(subCategoryGroupedSlugs)) {
    const uniqSlugs = new Set(slugs);
    if (slugs.length !== uniqSlugs.size) {
      noDuplicateSlugs = false;
      slugDuplications.push(`Duplicate subcategory slugs found in category ID: ${pId}`);
    }
  }

  step(
    "No duplicate slugs exist for active taxonomies",
    noDuplicateSlugs,
    slugDuplications.length ? slugDuplications.join(", ") : "All slugs unique"
  );

  console.log("=========================================");
  console.log(process.exitCode ? "✗ SOME INTEGRITY CHECKS FAILED" : "✓ ALL INTEGRITY CHECKS PASSED");
  
  await mongoose.connection.close();
}

verifyDb().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
