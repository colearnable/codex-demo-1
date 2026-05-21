#!/usr/bin/env node
// Builds the encrypted prompt page from build-prompt.md.
// Pipeline: render markdown → wrap in styled shell → staticrypt → patch noindex → mv to prompt.html.
// Idempotent and never overwrites build-prompt.md or the staging file with encrypted output.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MD_PATH = path.join(ROOT, 'build-prompt.md');
const OUT_PATH = path.join(ROOT, 'prompt.html');
const PASSWORD = process.env.STATICRYPT_PASSWORD;

if (!PASSWORD) {
  console.error('ERROR: STATICRYPT_PASSWORD env var is required.');
  console.error('Run with: STATICRYPT_PASSWORD=yourpassword node tools/encrypt-prompt.js');
  process.exit(1);
}

if (!fs.existsSync(MD_PATH)) {
  console.error('ERROR: build-prompt.md not found at repo root.');
  process.exit(1);
}

const markdown = fs.readFileSync(MD_PATH, 'utf8');
if (markdown.includes('</script>')) {
  console.error('ERROR: build-prompt.md contains "</script>" which would break the embed.');
  process.exit(1);
}

const renderedBody = execSync(`npx --yes marked -i "${MD_PATH}"`, { encoding: 'utf8' });

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>BUILD PROMPT // ACCESS GRANTED</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/png" href="favicon.png" />
    <style>
      :root{--orange:#f6511d;--yellow:#ffb400;--cyan:#00a6ed;--green:#7fb800;--navy:#0d2c54;--bg:#040d1a;--text:#f4f8ff;--muted:#afc6e3}
      *{box-sizing:border-box}html{scroll-behavior:smooth}
      body{margin:0;font-family:Inter,system-ui,sans-serif;color:var(--text);background:radial-gradient(80% 55% at 50% -5%,rgba(0,166,237,.22),transparent 70%),radial-gradient(60% 60% at 12% 0%,rgba(246,81,29,.17),transparent 66%),linear-gradient(180deg,#08162b 0%,var(--bg) 100%);line-height:1.65;min-height:100vh}
      .scanlines{position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.02) 0 1px,transparent 1px 4px);z-index:1}
      main{position:relative;z-index:2;width:min(880px,92vw);margin:2rem auto 4rem}
      .topbar{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 1.25rem;border:1px solid rgba(0,166,237,.35);border-radius:18px;background:rgba(7,18,34,.66);backdrop-filter:blur(10px);margin-bottom:1.5rem;flex-wrap:wrap}
      .crumb{font-family:"Space Grotesk",sans-serif;letter-spacing:.07em;color:var(--yellow);font-weight:700;text-decoration:none}
      .crumb:hover{filter:brightness(1.15)}
      .actions{display:flex;gap:.6rem;flex-wrap:wrap}
      .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;min-height:38px;padding:.5rem .9rem;border-radius:10px;text-decoration:none;font-weight:700;font-family:"Space Grotesk",sans-serif;letter-spacing:.04em;font-size:.85rem;border:0;cursor:pointer}
      .btn-primary{background:linear-gradient(135deg,var(--orange),var(--yellow));color:#121212}
      .btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
      .btn.copied{background:linear-gradient(135deg,var(--green),var(--cyan));color:#021018}
      .panel{background:linear-gradient(160deg,rgba(13,44,84,.56),rgba(13,44,84,.2));border:1px solid rgba(0,166,237,.36);border-radius:24px;padding:clamp(1.4rem,3vw,2.4rem);box-shadow:0 16px 40px rgba(0,0,0,.34),inset 0 0 0 1px rgba(255,255,255,.05)}
      .eyebrow{font-family:"Space Grotesk",sans-serif;letter-spacing:.16em;color:var(--green);font-weight:700;font-size:.78rem;text-transform:uppercase;margin:0 0 .35rem}
      h1.title{font-family:"Space Grotesk",sans-serif;font-size:clamp(1.6rem,3.4vw,2.4rem);margin:0 0 1.4rem;color:var(--yellow);letter-spacing:.02em}
      .content h2{font-family:"Space Grotesk",sans-serif;letter-spacing:.04em;color:var(--cyan);margin:2rem 0 .6rem;font-size:1.2rem;padding-bottom:.4rem;border-bottom:1px dashed rgba(0,166,237,.25)}
      .content h2:first-of-type{margin-top:.2rem}
      .content p{margin:.55rem 0;color:#dde9f8}
      .content ul,.content ol{margin:.4rem 0 1rem;padding-left:1.35rem;color:#dde9f8}
      .content li{margin:.2rem 0}
      .content code{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:.88em;background:rgba(0,166,237,.12);border:1px solid rgba(0,166,237,.22);padding:.1rem .4rem;border-radius:6px;color:#e7f3ff}
      .content strong{color:#fff}
      .content hr{border:0;border-top:1px dashed rgba(0,166,237,.3);margin:1.6rem 0}
      footer{text-align:center;color:#92adcc;padding:1.5rem 1rem 0;font-size:.85rem}
      .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
      .skip-link{position:absolute;left:.75rem;top:.75rem;z-index:1000;padding:.65rem 1rem;background:var(--yellow);color:#0a0a0a;font-family:"Space Grotesk",sans-serif;font-weight:700;letter-spacing:.06em;border-radius:10px;text-decoration:none;transform:translateY(-200%);transition:transform .18s ease}
      .skip-link:focus{transform:translateY(0);outline:2px solid var(--cyan);outline-offset:2px}
      .btn.copy-failed{background:linear-gradient(135deg,#b33,#f6511d);color:#fff}
      .btn:focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
      .crumb:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}
      #prompt-content:focus{outline:none}
      @media (max-width:640px){.topbar{flex-direction:column;align-items:stretch}.actions{justify-content:center}.btn{flex:1}}
      @media (prefers-reduced-motion: reduce){
        *,*::before,*::after{animation-duration:.001ms !important;transition-duration:.001ms !important}
      }
    </style>
  </head>
  <body>
    <a class="skip-link" href="#prompt-content">Skip to prompt</a>
    <div class="scanlines" aria-hidden="true"></div>
    <main id="main">
      <nav class="topbar" aria-label="Prompt page">
        <a class="crumb" href="index.html">&larr; BACK TO PORTFOLIO</a>
        <div class="actions">
          <button id="copy-btn" class="btn btn-primary" type="button" aria-describedby="copy-status">&#9635; COPY ENTIRE PROMPT</button>
        </div>
      </nav>
      <article class="panel" aria-labelledby="prompt-heading">
        <p class="eyebrow" aria-hidden="true">&#9654; ACCESS GRANTED &middot; BUILD PROMPT // SOURCE</p>
        <h1 id="prompt-heading" class="title">The Prompt That Built This Site</h1>
        <div class="content" id="prompt-content" tabindex="-1">
__RENDERED_BODY__
        </div>
      </article>
      <footer>Neon clean. Arcade mean.</footer>
    </main>
    <p id="copy-status" class="sr-only" role="status" aria-live="polite"></p>
    <script id="raw-prompt" type="text/markdown">__RAW_MARKDOWN__</script>
    <script>
      (function(){
        var MAX_VOLUME=0.75;
        var coin=new Audio('assets/coin.mp3');
        coin.preload='auto';
        // Single coin clink when the prompt unlocks.
        setTimeout(function(){
          try{
            var s=coin.cloneNode(true);
            s.volume=Math.min(MAX_VOLUME,0.5);
            s.play().catch(function(){});
          }catch(e){}
        }, 120);
      })();
    </script>
    <script>
      (function(){
        var btn=document.getElementById('copy-btn');
        var raw=document.getElementById('raw-prompt');
        var status=document.getElementById('copy-status');
        if(!btn||!raw) return;
        btn.addEventListener('click',function(){
          var text=raw.textContent||'';
          var done=function(ok){
            var original=btn.textContent;
            btn.textContent=ok?'✓ COPIED':'⚠ COPY FAILED';
            btn.classList.add(ok?'copied':'copy-failed');
            if(status) status.textContent=ok?'Prompt copied to clipboard.':'Could not copy. Please copy manually.';
            setTimeout(function(){
              btn.textContent=original;
              btn.classList.remove('copied','copy-failed');
              if(status) status.textContent='';
            },2200);
          };
          function fallback(t){
            try{
              var ta=document.createElement('textarea');
              ta.value=t;ta.setAttribute('readonly','');ta.style.position='absolute';ta.style.left='-9999px';
              document.body.appendChild(ta);ta.select();
              var ok=document.execCommand('copy');
              document.body.removeChild(ta);
              return ok;
            }catch(e){return false;}
          }
          if(navigator.clipboard&&window.isSecureContext){
            navigator.clipboard.writeText(text).then(function(){done(true);},function(){done(fallback(text));});
          } else {done(fallback(text));}
        });
      })();
    </script>
  </body>
</html>
`;

const promptSource = SHELL
  .replace('__RENDERED_BODY__', renderedBody)
  .replace('__RAW_MARKDOWN__', markdown);

const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'encrypt-prompt-'));
const stageSource = path.join(stageDir, 'prompt-source.html');
const stageOutDir = path.join(stageDir, 'encrypted');
fs.writeFileSync(stageSource, promptSource);

console.log(`[stage] wrote source to ${stageSource}`);

const customTemplate = path.join(ROOT, 'templates', 'staticrypt-gate.html');
const staticryptArgs = [
  '--yes', 'staticrypt', stageSource,
  '--password', PASSWORD,
  '--short',
  '-d', stageOutDir,
  '-t', customTemplate,
  '--template-title', 'ACCESS GRANTED',
  '--template-button', '▶ PRESS START',
  '--template-placeholder', 'ENTER CODE',
  '--template-instructions', 'You found the slot. Now feed it the code.',
  '--template-error', 'WRONG CODE — TRY AGAIN',
  '--template-remember', 'Remember this cabinet',
];

const sr = spawnSync('npx', staticryptArgs, { stdio: 'inherit' });
if (sr.status !== 0) {
  console.error('staticrypt failed with code', sr.status);
  process.exit(sr.status || 1);
}

const stagedOutput = path.join(stageOutDir, 'prompt-source.html');
if (!fs.existsSync(stagedOutput)) {
  console.error('ERROR: staticrypt produced no output at', stagedOutput);
  process.exit(1);
}

let encrypted = fs.readFileSync(stagedOutput, 'utf8');
if (!/<meta\s+name="robots"/i.test(encrypted)) {
  encrypted = encrypted.replace(
    /(<meta\s+name="viewport"[^>]*>)/i,
    '$1\n        <meta name="robots" content="noindex, nofollow" />\n        <meta name="googlebot" content="noindex, nofollow" />'
  );
}

fs.writeFileSync(OUT_PATH, encrypted);
fs.rmSync(stageDir, { recursive: true, force: true });

console.log(`[done] wrote ${OUT_PATH} (${encrypted.length} bytes)`);
