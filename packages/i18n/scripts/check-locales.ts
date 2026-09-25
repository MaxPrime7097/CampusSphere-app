import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const LOCALE_DIRS = [
  path.resolve(rootDir, 'packages/i18n/src/locales'),
  path.resolve(rootDir, 'apps/sphera/src/locales'),
];

function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

function extractInterpolations(str: string): string[] {
  const matches = str.match(/\{\{([^}]+)\}\}/g);
  return matches ? matches.map((m) => m.replace(/[{}]/g, '').trim()).sort() : [];
}

interface ValidationReport {
  directory: string;
  namespace: string;
  missingInEn: string[];
  extraInEn: string[];
  mismatchedInterpolations: { key: string; fr: string[]; en: string[] }[];
}

export function checkAllLocales(): boolean {
  console.log('🔍 Checking i18n locales consistency (fr <-> en)...\n');
  let hasErrors = false;
  const reports: ValidationReport[] = [];

  for (const dir of LOCALE_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const frDir = path.join(dir, 'fr');
    const enDir = path.join(dir, 'en');

    if (!fs.existsSync(frDir)) continue;

    const frFiles = fs.readdirSync(frDir).filter((f) => f.endsWith('.json'));

    for (const file of frFiles) {
      const namespace = path.basename(file, '.json');
      const frFilePath = path.join(frDir, file);
      const enFilePath = path.join(enDir, file);

      if (!fs.existsSync(enFilePath)) {
        console.error(`❌ [${path.relative(rootDir, dir)}] Missing target file: en/${file}`);
        hasErrors = true;
        continue;
      }

      const frContent = JSON.parse(fs.readFileSync(frFilePath, 'utf8'));
      const enContent = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));

      const frFlat = flattenKeys(frContent);
      const enFlat = flattenKeys(enContent);

      const frKeys = Object.keys(frFlat);
      const enKeys = Object.keys(enFlat);

      const missingInEn = frKeys.filter((k) => !enKeys.includes(k));
      const extraInEn = enKeys.filter((k) => !frKeys.includes(k));

      const mismatchedInterpolations: { key: string; fr: string[]; en: string[] }[] = [];
      for (const key of frKeys) {
        if (enFlat[key]) {
          const frVars = extractInterpolations(frFlat[key]);
          const enVars = extractInterpolations(enFlat[key]);
          if (JSON.stringify(frVars) !== JSON.stringify(enVars)) {
            mismatchedInterpolations.push({ key, fr: frVars, en: enVars });
          }
        }
      }

      reports.push({
        directory: path.relative(rootDir, dir),
        namespace,
        missingInEn,
        extraInEn,
        mismatchedInterpolations,
      });

      if (missingInEn.length > 0 || mismatchedInterpolations.length > 0) {
        hasErrors = true;
      }
    }
  }

  // Display report
  for (const report of reports) {
    const isSuccess =
      report.missingInEn.length === 0 && report.mismatchedInterpolations.length === 0;
    const statusIcon = isSuccess ? '✅' : '❌';

    console.log(`${statusIcon} [${report.directory}] Namespace: "${report.namespace}"`);

    if (report.missingInEn.length > 0) {
      console.log(`   ⚠️  Missing keys in English (${report.missingInEn.length}):`);
      report.missingInEn.slice(0, 10).forEach((k) => console.log(`      - ${k}`));
      if (report.missingInEn.length > 10) console.log(`      ... and ${report.missingInEn.length - 10} more`);
    }

    if (report.mismatchedInterpolations.length > 0) {
      console.log(`   ⚠️  Mismatched interpolation variables:`);
      report.mismatchedInterpolations.forEach((m) => {
        console.log(`      - Key: ${m.key} (fr: [${m.fr.join(', ')}], en: [${m.en.join(', ')}])`);
      });
    }

    if (report.extraInEn.length > 0) {
      console.log(`   ℹ️  Extra keys in English (not in French): ${report.extraInEn.length}`);
    }

    console.log('');
  }

  if (hasErrors) {
    console.error('❌ i18n consistency check failed. Please sync your locale files.\n');
  } else {
    console.log('✅ All i18n locales are strictly consistent!\n');
  }

  return !hasErrors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const success = checkAllLocales();
  process.exit(success ? 0 : 1);
}
