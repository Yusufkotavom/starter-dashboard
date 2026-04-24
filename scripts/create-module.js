#!/usr/bin/env node

/**
 * Feature Module Generator Builder
 * 
 * Run: node scripts/create-module.js <module-name>
 * Example: node scripts/create-module.js inventory
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
Usage:
  node scripts/create-module.js <module-name>

Example:
  node scripts/create-module.js inventory
  node scripts/create-module.js orders

This script copies the 'products' feature as a baseline, and creates a new generic boilerplate feature with your custom <module-name>.
  `);
  process.exit(0);
}

const targetNamePlural = args[0].toLowerCase();
const targetNameSingular = targetNamePlural.endsWith('s') 
  ? targetNamePlural.slice(0, -1) 
  : targetNamePlural;

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const SourceNames = {
  plural: 'products',
  singular: 'product',
  pluralCap: 'Products',
  singularCap: 'Product',
  upperSingular: 'PRODUCT',
  upperPlural: 'PRODUCTS'
};

const TargetNames = {
  plural: targetNamePlural,
  singular: targetNameSingular,
  pluralCap: capitalize(targetNamePlural),
  singularCap: capitalize(targetNameSingular),
  upperSingular: targetNameSingular.toUpperCase(),
  upperPlural: targetNamePlural.toUpperCase()
};

const SRC_FEATURE = path.join(ROOT, 'src', 'features', 'products');
const DEST_FEATURE = path.join(ROOT, 'src', 'features', targetNamePlural);

if (fs.existsSync(DEST_FEATURE)) {
  console.error(`❌ Module '${targetNamePlural}' already exists at ${DEST_FEATURE}`);
  process.exit(1);
}

// Ensure source exists
if (!fs.existsSync(SRC_FEATURE)) {
  console.error(`❌ Template source feature '${SRC_FEATURE}' does not exist.`);
  process.exit(1);
}

function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    
    fs.readdirSync(src).forEach((childItemName) => {
      let destChildName = childItemName;
      // Replace file names
      destChildName = destChildName.replace(/products/g, TargetNames.plural);
      destChildName = destChildName.replace(/product/g, TargetNames.singular);
      
      const srcPath = path.join(src, childItemName);
      const destPath = path.join(dest, destChildName);
      copyRecursiveSync(srcPath, destPath);
    });
  } else {
    // Read file, replace content, write file
    let content = fs.readFileSync(src, 'utf8');
    
    // Replace exact text matches (Order matters - plural first, then singular)
    content = content.replace(new RegExp(SourceNames.pluralCap, 'g'), TargetNames.pluralCap);
    content = content.replace(new RegExp(SourceNames.plural, 'g'), TargetNames.plural);
    content = content.replace(new RegExp(SourceNames.singularCap, 'g'), TargetNames.singularCap);
    content = content.replace(new RegExp(SourceNames.singular, 'g'), TargetNames.singular);

    fs.writeFileSync(dest, content, 'utf8');
  }
}

const SRC_PAGE = path.join(ROOT, 'src', 'app', 'dashboard', 'product');
const DEST_PAGE = path.join(ROOT, 'src', 'app', 'dashboard', targetNameSingular);

try {
  console.log(`\n🚀 Generating new module: ${TargetNames.pluralCap}`);
  
  // Clone the feature directory
  copyRecursiveSync(SRC_FEATURE, DEST_FEATURE);
  console.log(`✅ Feature logic generated in: src/features/${TargetNames.plural}`);
  
  // Clone the page route directory
  if (fs.existsSync(SRC_PAGE) && !fs.existsSync(DEST_PAGE)) {
    copyRecursiveSync(SRC_PAGE, DEST_PAGE);
    console.log(`✅ Page routes generated in: src/app/dashboard/${TargetNames.singular}`);
  }
  
  console.log(`\n📝 Next Steps for you:\n`);
  
  console.log(`1. Update the columns configuration in:`);
  console.log(`   src/features/${TargetNames.plural}/components/${TargetNames.singular}-tables/columns.tsx`);
  
  console.log(`2. Update navigation config to add your new menu item in:`);
  console.log(`   src/config/nav-config.ts`);
  
  console.log(`\n🎉 You can now visit: http://localhost:3000/dashboard/${TargetNames.singular} \n`);

} catch (error) {
  console.error("❌ Failed to generate module:", error);
}
