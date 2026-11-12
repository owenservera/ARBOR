// Read-only: opens each provider's landing page in a harness-owned tab, runs the profile's
// auth-wall/composer probe, then closes that tab. Never types, clicks, or reads page text/cookies.
import { connect } from '../src/core/cdp.mjs';
import { snapshotExpression } from '../src/core/send.mjs';
import { listProviders, getProvider } from '../src/providers/index.mjs';

const port = Number(process.argv[2] || 9333);
const only = process.argv.slice(3);
const browser = await connect({ port });
const ids = (await listProviders()).map((p) => p.id).filter((id) => !only.length || only.includes(id));
const out = [];
for (const id of ids) {
  const provider = await getProvider(id);
  let page;
  try {
    page = await browser.openPage(provider.url);
    const finalUrl = new URL(await page.url());
    const snap = await page.evaluate(snapshotExpression(provider));
    out.push({ provider: id, landed: finalUrl.hostname + finalUrl.pathname, hostOk: provider.hosts.includes(finalUrl.hostname), authWall: !!snap.authWall, composer: !!snap.composer, signedIn: !snap.authWall && !!snap.composer && provider.hosts.includes(finalUrl.hostname) });
  } catch (e) {
    out.push({ provider: id, error: e.code || e.message });
  } finally { try { await page?.close(); } catch { /* ignore */ } }
}
console.log(JSON.stringify(out, null, 2));
