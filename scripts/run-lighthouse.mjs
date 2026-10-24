import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TMP_DIR = path.resolve('./.lighthouse-tmp');
const REPORT_FILE = path.resolve('./lighthouse-report.json');
const URL = process.env.LIGHTHOUSE_URL || 'https://keeptrip-app-staging.web.app/';

function cleanup() {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(REPORT_FILE)) {
    fs.rmSync(REPORT_FILE, { force: true });
  }
}

try {
  // 1. Delete if exists to ensure clean run
  cleanup();

  console.log(`[🤖] Starting Autonomous Lighthouse Audit for ${URL}...`);
  console.log(`[🤖] Creating zero-footprint temp profiles in ${TMP_DIR}`);

  // 2. Run lighthouse headless
  const cmd = `npx --yes lighthouse ${URL} --chrome-flags="--headless --user-data-dir=${TMP_DIR}" --only-categories=performance,accessibility,best-practices,seo --output json --output-path ${REPORT_FILE}`;
  try {
    const result = execSync(cmd, { stdio: 'pipe' });
    console.log(result.toString());
  } catch (cmdError) {
    if (fs.existsSync(REPORT_FILE)) {
      console.warn('[!] Lighthouse process completed with launcher cleanup warning on Windows, parsing generated report...');
    } else {
      throw cmdError;
    }
  }

  // 3. Read and parse inside the script to save AI tokens
  if (fs.existsSync(REPORT_FILE)) {
    const rawData = fs.readFileSync(REPORT_FILE, 'utf-8');
    const data = JSON.parse(rawData);
    
    const getScore = (cat) => (data.categories[cat] ? (data.categories[cat].score * 100).toFixed(0) : 'N/A');
    const getMetric = (metricId) => data.audits[metricId]?.displayValue || 'N/A';

    // 4. Output the summarized table
    console.log('\n======================================');
    console.log('   LIGHTHOUSE AUTONOMOUS REPORT');
    console.log('======================================');
    console.log(`Performance : ${getScore('performance')}`);
    console.log(`Accessibility: ${getScore('accessibility')}`);
    console.log(`Best Practices: ${getScore('best-practices')}`);
    console.log(`SEO         : ${getScore('seo')}`);
    console.log('--------------------------------------');
    console.log(`LCP (Largest Contentful Paint): ${getMetric('largest-contentful-paint')}`);
    console.log(`TBT (Total Blocking Time)     : ${getMetric('total-blocking-time')}`);
    console.log(`CLS (Cumulative Layout Shift) : ${getMetric('cumulative-layout-shift')}`);
    console.log('======================================\n');
  }

} catch (error) {
  console.error('[!] Lighthouse Audit Failed:');
  if (error.stdout) console.error('STDOUT:', error.stdout.toString());
  if (error.stderr) console.error('STDERR:', error.stderr.toString());
  if (!error.stdout && !error.stderr) console.error(error.message);
  process.exit(1);
} finally {
  // 5. Wipe out files immediately (Zero-Footprint compliance)
  console.log('[🤖] Wiping out temp files (Zero-Footprint compliance)...');
  cleanup();
  console.log('[🤖] Audit Complete.');
}
