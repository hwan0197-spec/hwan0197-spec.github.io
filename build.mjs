// 정적 블로그 빌드: posts/*.md → docs/ (GitHub Pages가 main 브랜치의 /docs를 서비스)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const SITE = {
  title: '작은가게 웹 가이드',
  description: '1인 사업자와 소상공인을 위한 랜딩페이지·상담 폼·업무 자동화 실전 가이드',
  url: 'https://hwan0197-spec.github.io',
  lang: 'ko',
  // 크몽 서비스가 승인되면 주소를 넣으세요. 비어 있으면 글 하단 안내 박스가 숨겨집니다.
  kmongUrl: '',
  // 검색엔진 소유 확인용 (서치콘솔·서치어드바이저에서 받은 content 값)
  googleVerification: 'wZaLj_VsEKPHZphGS7Xo48Ho-4D0jX2NqfaCgEIiJbo',
  naverVerification: '7759fb7f9fcf2142e7113ee5398f6b665ece1880',
  // 애드센스 승인 후 게시자 ID (예: ca-pub-0000000000000000)
  adsenseClient: '',
};

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'docs');

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = d => { const [y, m, day] = d.split('-'); return `${y}년 ${+m}월 ${+day}일`; };

// 제목에 id를 붙여 목차 링크가 동작하게 함
const slugify = t => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const ext = /^https?:\/\//.test(href) && !href.startsWith(SITE.url);
      return `<a href="${href}"${title ? ` title="${esc(title)}"` : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    },
  },
});

function layout({ title, description, canonical, body, type = 'website', extraHead = '' }) {
  const fullTitle = title ? `${title} | ${SITE.title}` : SITE.title;
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title || SITE.title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${esc(SITE.title)}">
<meta property="og:locale" content="ko_KR">
<meta property="og:image" content="${SITE.url}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${SITE.googleVerification ? `<meta name="google-site-verification" content="${SITE.googleVerification}">` : ''}
${SITE.naverVerification ? `<meta name="naver-site-verification" content="${SITE.naverVerification}">` : ''}
${SITE.adsenseClient ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}" crossorigin="anonymous"></script>` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.title)}" href="${SITE.url}/feed.xml">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="/style.css">
${extraHead}
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="brand" href="/">작은가게 <b>웹 가이드</b></a>
  <nav><a href="/">글 목록</a><a href="/about/">소개</a></nav>
</div></header>
<main class="wrap">${body}</main>
<footer class="site-footer"><div class="wrap">
  <p>© ${new Date().getFullYear()} ${esc(SITE.title)} · <a href="/about/">소개</a> · <a href="/privacy/">개인정보처리방침</a> · <a href="/feed.xml">RSS</a></p>
</div></footer>
</body>
</html>`;
}

// ── 글 읽기
const posts = fs.readdirSync(path.join(ROOT, 'posts'))
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const { data, content } = matter(fs.readFileSync(path.join(ROOT, 'posts', f), 'utf8'));
    const slug = f.replace(/\.md$/, '');
    const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);
    const html = marked.parse(content);
    const toc = [...html.matchAll(/<h2 id="([^"]+)">(.+?)<\/h2>/g)].map(m => ({ id: m[1], text: m[2] }));
    const minutes = Math.max(1, Math.round(content.replace(/```[\s\S]*?```/g, '').length / 500));
    return { ...data, slug, date, html, toc, minutes };
  })
  .filter(p => !p.draft)
  .sort((a, b) => b.date.localeCompare(a.date));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const write = (rel, content) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };

// ── 글 페이지
for (const p of posts) {
  const url = `${SITE.url}/posts/${p.slug}/`;
  // 같은 분류 글을 먼저, 모자라면 최신 글로 채움
  const others = posts.filter(o => o.slug !== p.slug);
  const related = [...others.filter(o => o.category && o.category === p.category), ...others.filter(o => !o.category || o.category !== p.category)].slice(0, 3);
  const cta = SITE.kmongUrl ? `
<aside class="cta">
  <p class="cta-title">랜딩페이지, 직접 만들 시간이 없다면</p>
  <p>기획부터 반응형 제작, 상담 폼 연동, 배포까지 대신 해드립니다. 크몽 안전결제로 진행돼요.</p>
  <a class="btn" href="${SITE.kmongUrl}" target="_blank" rel="noopener">크몽에서 서비스 보기 →</a>
</aside>` : '';
  const jsonld = { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.updated || p.date, mainEntityOfPage: url, image: `${SITE.url}/og.png`, publisher: { '@type': 'Organization', name: SITE.title } };
  const body = `
<article class="post">
  <p class="meta">${esc(p.category || '')} · ${fmtDate(p.date)}${p.updated ? ` (수정 ${fmtDate(p.updated)})` : ''} · ${p.minutes}분 읽기</p>
  <h1>${esc(p.title)}</h1>
  <p class="lede">${esc(p.description)}</p>
  ${p.toc.length > 2 ? `<nav class="toc"><p>목차</p><ol>${p.toc.map(t => `<li><a href="#${t.id}">${t.text}</a></li>`).join('')}</ol></nav>` : ''}
  <div class="content">${p.html}</div>
  ${cta}
</article>
${related.length ? `<section class="related"><h2>함께 보면 좋은 글</h2>${related.map(o => `<a class="card" href="/posts/${o.slug}/"><span>${esc(o.category || '')}</span><b>${esc(o.title)}</b></a>`).join('')}</section>` : ''}`;
  write(`posts/${p.slug}/index.html`, layout({ title: p.title, description: p.description, canonical: url, body, type: 'article', extraHead: `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` }));
}

// ── 목록
write('index.html', layout({
  title: '', description: SITE.description, canonical: `${SITE.url}/`,
  body: `
<section class="hero"><h1>가게 홍보에 필요한 웹 도구,<br>쉽게 설명해 드립니다</h1><p>${esc(SITE.description)}</p></section>
<section class="list">${posts.map(p => `
  <a class="item" href="/posts/${p.slug}/">
    <span class="meta">${esc(p.category || '')} · ${fmtDate(p.date)}</span>
    <h2>${esc(p.title)}</h2>
    <p>${esc(p.description)}</p>
  </a>`).join('')}
</section>`,
}));

// ── 고정 페이지
const pages = {
  about: ['소개', `<article class="post"><h1>소개</h1><div class="content">
<p><b>작은가게 웹 가이드</b>는 1인 사업자와 소상공인이 온라인으로 고객을 모을 때 필요한 도구를 쉽게 설명하는 블로그입니다.</p>
<p>랜딩페이지 제작 비용, 상담 신청 폼 만드는 법, 반복 업무 자동화처럼 <b>직접 해보거나 맡기기 전에 알아두면 돈과 시간을 아끼는 정보</b>를 다룹니다.</p>
<h2>글 작성 방식</h2>
<p>글 초안은 AI 도구의 도움을 받아 작성하고, 운영자가 내용을 검토한 뒤 게시합니다. 가격이나 정책처럼 바뀔 수 있는 정보는 출처와 기준 날짜를 함께 적습니다. 틀린 내용을 발견하시면 알려주세요.</p>
</div></article>`],
  privacy: ['개인정보처리방침', `<article class="post"><h1>개인정보처리방침</h1><div class="content">
<p>이 블로그는 회원가입이나 댓글 기능이 없으며, 방문자의 개인정보를 직접 수집하지 않습니다.</p>
<h2>쿠키와 광고</h2>
<p>이 사이트는 방문 통계 분석과 광고 게재를 위해 Google 등 제3자 서비스를 사용할 수 있으며, 이 과정에서 쿠키가 사용될 수 있습니다. Google은 쿠키를 사용해 사용자의 이 사이트 및 다른 사이트 방문 기록을 바탕으로 광고를 게재할 수 있습니다.</p>
<p>맞춤 광고는 <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google 광고 설정</a>에서 끌 수 있습니다.</p>
<h2>시행일</h2><p>2026년 9월 30일</p>
</div></article>`],
};
for (const [slug, [title, body]] of Object.entries(pages)) {
  write(`${slug}/index.html`, layout({ title, description: `${SITE.title} ${title}`, canonical: `${SITE.url}/${slug}/`, body }));
}

// ── 404
write('404.html', layout({ title: '페이지를 찾을 수 없어요', description: SITE.description, canonical: `${SITE.url}/404.html`, body: `<section class="hero"><h1>페이지를 찾을 수 없어요</h1><p><a href="/">글 목록으로 돌아가기</a></p></section>` }));

// ── sitemap, robots, rss
const latest = posts.map(p => p.updated || p.date).sort().at(-1);
const urls = [[`${SITE.url}/`, latest], ...posts.map(p => [`${SITE.url}/posts/${p.slug}/`, p.updated || p.date]), [`${SITE.url}/about/`]];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `<url><loc>${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
const rfc822 = d => new Date(`${d}T09:00:00+09:00`).toUTCString();
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(SITE.title)}</title><link>${SITE.url}/</link><description>${esc(SITE.description)}</description><language>ko</language>\n${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE.url}/posts/${p.slug}/</link><guid>${SITE.url}/posts/${p.slug}/</guid><pubDate>${rfc822(p.date)}</pubDate><description>${esc(p.description)}</description></item>`).join('\n')}\n</channel></rss>\n`);
if (SITE.adsenseClient) write('ads.txt', `google.com, ${SITE.adsenseClient.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`);

// ── 정적 파일
fs.cpSync(path.join(ROOT, 'static'), OUT, { recursive: true });
write('.nojekyll', '');
console.log(`built ${posts.length} posts → docs/`);
