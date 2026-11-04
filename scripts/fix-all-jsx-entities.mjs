import fs from 'fs';

// Fix FloatingPhoneSimulator.tsx
let phonePath = 'src/components/demo/FloatingPhoneSimulator.tsx';
let phone = fs.readFileSync(phonePath, 'utf8');
phone = phone.replace(
  '<span className="font-semibold text-slate-200 flex items-center gap-1">\n                      <Bell className="w-3 h-3 text-emerald-400" />\n                      <span>HDFC Bank SMS Alert</span>',
  '<span className="font-semibold text-slate-200 flex items-center gap-1">\n                      <Bell className="w-3 h-3 text-emerald-400" />\n                      <span>HDFC Bank Transaction Alert</span>'
);
phone = phone.replace(
  '"Acct XX4921 debited for',
  '&quot;Acct XX4921 debited for'
);
phone = phone.replace(
  'Confirmed at {brandName}."',
  'Confirmed at {brandName}.&quot;'
);
fs.writeFileSync(phonePath, phone);
console.log('Fixed FloatingPhoneSimulator.tsx');

// Fix SupplierProductCreationWizard.tsx
let wizPath = 'src/components/seller/SupplierProductCreationWizard.tsx';
let wiz = fs.readFileSync(wizPath, 'utf8');
wiz = wiz.replace("piece's identity", "piece&apos;s identity");
wiz = wiz.replace("seller's product", "seller&apos;s product");
fs.writeFileSync(wizPath, wiz);
console.log('Fixed SupplierProductCreationWizard.tsx');

