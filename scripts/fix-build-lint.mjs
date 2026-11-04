import fs from 'fs';

// 1. AdminCommandCenterSaaS.tsx
let adminPath = 'src/components/admin/AdminCommandCenterSaaS.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');
adminContent = adminContent.replace("Shopify's monthly", "Shopify&apos;s monthly");
fs.writeFileSync(adminPath, adminContent);
console.log('Fixed AdminCommandCenterSaaS.tsx');

// 2. FloatingPhoneSimulator.tsx
let phonePath = 'src/components/demo/FloatingPhoneSimulator.tsx';
let phoneContent = fs.readFileSync(phonePath, 'utf8');
phoneContent = phoneContent.replace(
  'Click "Send Direct Test OTP" below to simulate an active delivery without carrier cost.',
  'Click &quot;Send Direct Test OTP&quot; below to simulate an active delivery without carrier cost.'
);
fs.writeFileSync(phonePath, phoneContent);
console.log('Fixed FloatingPhoneSimulator.tsx');

// 3. SupplierProductCreationWizard.tsx
let wizPath = 'src/components/seller/SupplierProductCreationWizard.tsx';
let wizContent = fs.readFileSync(wizPath, 'utf8');
wizContent = wizContent.replace("We'll recommend optimal selling price", "We&apos;ll recommend optimal selling price");
fs.writeFileSync(wizPath, wizContent);
console.log('Fixed SupplierProductCreationWizard.tsx');

