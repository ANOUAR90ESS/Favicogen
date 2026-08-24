/**
 * Google Play Compliance & Production Readiness Validator
 * Validates meta tags, manifest configurations, privacy declarations,
 * and high-resolution assets for Google Play Store compliance.
 */

export interface ComplianceCheckResult {
  id: string;
  name: string;
  category: 'metadata' | 'manifest' | 'privacy' | 'assets' | 'policies';
  status: 'pass' | 'warn' | 'fail';
  details: string;
  recommendation?: string;
}

export interface ProductionCheckReport {
  passed: boolean;
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failures: number;
  };
  checks: ComplianceCheckResult[];
}

/** True when the resource responds; used instead of asserting it exists. */
async function headRequestSucceeds(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function runProductionComplianceCheck(): Promise<ProductionCheckReport> {
  const checks: ComplianceCheckResult[] = [];

  // 1. Meta Tags & HTML Head Validation
  const title = document.title || '';
  if (title.length > 0) {
    if (title.length <= 50) {
      checks.push({
        id: 'meta-title',
        name: 'App Title Tag',
        category: 'metadata',
        status: 'pass',
        details: `Title is present and concise ("${title}", ${title.length} chars). Play Store requires <= 30 chars for listing title.`,
      });
    } else {
      checks.push({
        id: 'meta-title',
        name: 'App Title Tag',
        category: 'metadata',
        status: 'warn',
        details: `Title is "${title}" (${title.length} chars). For Google Play Store title, keep listing name <= 30 chars.`,
        recommendation: 'Use "Logo & Favicon Studio" for the Google Play Store title.',
      });
    }
  } else {
    checks.push({
      id: 'meta-title',
      name: 'App Title Tag',
      category: 'metadata',
      status: 'fail',
      details: 'Missing <title> tag in document head.',
      recommendation: 'Add <title>Logo & Favicon Studio</title> to index.html.',
    });
  }

  // Viewport Meta Tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta && viewportMeta.getAttribute('content')?.includes('width=device-width')) {
    checks.push({
      id: 'meta-viewport',
      name: 'Responsive Viewport Meta',
      category: 'metadata',
      status: 'pass',
      details: 'Responsive viewport meta tag correctly configured.',
    });
  } else {
    checks.push({
      id: 'meta-viewport',
      name: 'Responsive Viewport Meta',
      category: 'metadata',
      status: 'fail',
      details: 'Missing or incomplete viewport meta tag.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    });
  }

  // Description Meta Tag
  const descMeta = document.querySelector('meta[name="description"]');
  const descContent = descMeta?.getAttribute('content') || '';
  if (descContent.length >= 10) {
    checks.push({
      id: 'meta-description',
      name: 'Store & SEO Description',
      category: 'metadata',
      status: 'pass',
      details: `Meta description is present (${descContent.length} chars).`,
    });
  } else {
    checks.push({
      id: 'meta-description',
      name: 'Store & SEO Description',
      category: 'metadata',
      status: 'warn',
      details: 'Meta description is missing or too short.',
      recommendation: 'Provide a descriptive meta tag for search engine and store indexing.',
    });
  }

  // Theme Color Meta Tag
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    checks.push({
      id: 'meta-theme-color',
      name: 'PWA / Mobile Theme Color',
      category: 'metadata',
      status: 'pass',
      details: `Theme color configured: ${themeColorMeta.getAttribute('content')}`,
    });
  } else {
    checks.push({
      id: 'meta-theme-color',
      name: 'PWA / Mobile Theme Color',
      category: 'metadata',
      status: 'warn',
      details: 'No <meta name="theme-color"> tag found in head.',
      recommendation: 'Add <meta name="theme-color" content="#4f46e5"> for consistent status bar color on mobile.',
    });
  }

  // 2. Web App Manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    checks.push({
      id: 'manifest-link',
      name: 'Web App Manifest Link',
      category: 'manifest',
      status: 'pass',
      details: `Manifest linked at: ${manifestLink.getAttribute('href')}`,
    });
  } else {
    checks.push({
      id: 'manifest-link',
      name: 'Web App Manifest Link',
      category: 'manifest',
      status: 'warn',
      details: 'Web App Manifest is not linked in index.html.',
      recommendation: 'Add <link rel="manifest" href="/manifest.json"> in index.html.',
    });
  }

  // 3. Privacy Policy & Legal Declarations
  // These used to be hard-coded `pass` entries that asserted the documents
  // existed without looking. One of them reported the privacy policy was
  // reachable while its link was in fact 404ing on a case-sensitive host.
  const legalPaths = ['/legal/PRIVACY_POLICY.md', '/legal/TERMS_OF_SERVICE.md'];
  for (const legalPath of legalPaths) {
    const reachable = await headRequestSucceeds(legalPath);
    checks.push({
      id: `legal-${legalPath}`,
      name: `Legal document reachable (${legalPath})`,
      category: 'privacy',
      status: reachable ? 'pass' : 'fail',
      details: reachable
        ? `${legalPath} responds successfully.`
        : `${legalPath} did not respond. The in-app modal will show text the published URL does not serve.`,
      recommendation: reachable ? undefined : `Publish the file at ${legalPath}.`,
    });
  }

  // 4. Manifest and its declared icons
  const manifestHref = manifestLink?.getAttribute('href');
  if (manifestHref) {
    try {
      const response = await fetch(manifestHref);
      const manifest = await response.json();
      const icons: Array<{ src?: string; sizes?: string }> = manifest.icons || [];

      const missing: string[] = [];
      for (const icon of icons) {
        if (icon.src && !(await headRequestSucceeds(icon.src))) missing.push(icon.src);
      }

      checks.push({
        id: 'manifest-icons',
        name: 'Manifest icons resolve',
        category: 'assets',
        status: missing.length === 0 ? 'pass' : 'fail',
        details:
          missing.length === 0
            ? `All ${icons.length} declared icons resolve.`
            : `Declared but missing: ${missing.join(', ')}. Browsers will refuse to offer installation.`,
        recommendation: missing.length === 0 ? undefined : 'Add the missing icon files to public/.',
      });

      const has512 = icons.some((icon) => icon.sizes?.includes('512'));
      checks.push({
        id: 'manifest-512',
        name: 'Google Play 512x512 icon declared',
        category: 'assets',
        status: has512 ? 'pass' : 'warn',
        details: has512
          ? 'A 512x512 icon is declared in the manifest.'
          : 'No 512x512 icon in the manifest; Play Store submissions require one.',
      });
    } catch (err) {
      checks.push({
        id: 'manifest-parse',
        name: 'Manifest parses',
        category: 'manifest',
        status: 'fail',
        details: `Could not read ${manifestHref}: ${String(err)}`,
      });
    }
  }

  // Calculation
  const failures = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const passed = checks.filter((c) => c.status === 'pass').length;

  const report: ProductionCheckReport = {
    passed: failures === 0,
    timestamp: new Date().toISOString(),
    summary: {
      total: checks.length,
      passed,
      warnings,
      failures,
    },
    checks,
  };

  // Console Output Formatting
  console.groupCollapsed(
    `%c🛡️ [Google Play Compliance & Production Check] %c${report.passed ? '✅ PASSED' : '⚠️ ATTENTION NEEDED'} (${passed}/${checks.length} checks)`,
    'color: #4f46e5; font-weight: bold; font-size: 12px;',
    report.passed ? 'color: #10b981; font-weight: bold;' : 'color: #f59e0b; font-weight: bold;'
  );

  console.table(
    checks.map((c) => ({
      Category: c.category.toUpperCase(),
      Requirement: c.name,
      Status: c.status === 'pass' ? '✅ PASS' : c.status === 'warn' ? '⚠️ WARN' : '❌ FAIL',
      Details: c.details,
    }))
  );

  if (warnings > 0 || failures > 0) {
    console.group('🔧 Recommendations:');
    checks
      .filter((c) => c.recommendation)
      .forEach((c) => {
        console.warn(`• [${c.name}]: ${c.recommendation}`);
      });
    console.groupEnd();
  }

  console.groupEnd();

  return report;
}
