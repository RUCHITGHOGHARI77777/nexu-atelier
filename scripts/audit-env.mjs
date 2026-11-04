import fs from 'fs';

function auditEnv() {
  const envFile = fs.readFileSync('.env', 'utf8');
  const lines = envFile.split('\n');
  const audited = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();

    let status = 'Configured';
    if (!val || val === '""' || val === "''") {
      status = 'Missing / Empty';
    } else if (val.includes('placeholder') || val.includes('your_') || val.includes('example')) {
      status = 'Placeholder';
    } else if (val.startsWith('demo_') || val.startsWith('test_')) {
      status = 'Demo / Sandbox';
    } else {
      status = 'Active Value';
    }

    audited.push({
      key,
      status,
      isSecret: key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD') || key.includes('TOKEN') || key.includes('URL'),
      preview: val.length > 8 ? `${val.slice(0, 3)}...${val.slice(-3)}` : '***'
    });
  }

  console.log(JSON.stringify(audited, null, 2));
}

auditEnv();

