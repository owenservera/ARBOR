import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('./ux/render.mjs', import.meta.url), 'utf8');

describe('Wiki is a real PWA tab', () => {
  it('has a Wiki tab, selectable local panel and the default Talk tab', () => {
    expect(html).toMatch(/id="tab-wiki"[^>]*role="tab"[^>]*aria-controls="v-wiki"/);
    expect(html).toMatch(/id="v-wiki"[^>]*role="tabpanel"/);
    expect(html).toMatch(/id="tab-talk"[^>]*class="tab on"/);
  });
  it('routes through goTab and never tears away the phone document', () => {
    expect(app).toContain("if (tab === 'wiki') void refreshWiki()");
    expect(app).toContain("S.tab = tab");
    expect(render).toContain("options.onNavigate(tab)");
    expect(render).not.toContain("location.assign('/wiki')");
    expect(app).not.toContain("window.open('/wiki'");
  });
  it('reads the Host Wiki rather than a local hardcoded replacement', () => {
    expect(app).toContain("HOST_PREVIEW ? '/api/wiki' : '/mobile/api/wiki'");
    expect(app).toContain('Wiki read refused');
    expect(app).toContain('wiki.revision < S.wiki.revision');
    expect(app).toContain('clearWiki(');
  });
});
