import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, MatIconModule],
  template: `
    <main class="auth-shell">
      <section class="story-panel">
        <a class="brand" href="/" aria-label="CloudTrack home">
          <span class="brand-mark"><mat-icon>cloud_queue</mat-icon></span>
          <span>CloudTrack</span>
        </a>
        <div class="story-copy">
          <span class="eyebrow">BUILD WITH CLARITY</span>
          <h1>Turn ambitious ideas into shipped work.</h1>
          <p>One focused workspace for projects, people, and the decisions that move your team forward.</p>
        </div>
        <div class="proof-card">
          <div class="avatar-stack"><span>AK</span><span>MS</span><span>+8</span></div>
          <div><strong>Trusted by focused teams</strong><small>Planning smarter every day</small></div>
        </div>
        <div class="orb orb-one"></div><div class="orb orb-two"></div>
      </section>
      <section class="form-panel">
        <router-outlet />
        <footer>© 2026 CloudTrack · Privacy · Terms</footer>
      </section>
    </main>
  `,
  styles: `
    :host { display:block; min-height:100%; }
    .auth-shell { min-height:100vh; display:grid; grid-template-columns:minmax(420px, 46%) 1fr; background:#f7f8fc; }
    .story-panel { position:relative; overflow:hidden; padding:48px 64px; color:#fff; display:flex; flex-direction:column; background:linear-gradient(145deg,#172554 0%,#1d4ed8 52%,#2563eb 100%); }
    .story-panel::after { content:''; position:absolute; inset:0; opacity:.16; background-image:linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px); background-size:52px 52px; mask-image:linear-gradient(to bottom,transparent,black,transparent); }
    .brand { position:relative; z-index:2; display:flex; align-items:center; gap:12px; color:#fff; text-decoration:none; font-size:22px; font-weight:750; letter-spacing:-.02em; }
    .brand-mark { display:grid; place-items:center; width:38px; height:38px; border-radius:12px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.2); }
    .story-copy { position:relative; z-index:2; max-width:560px; margin:auto 0; }
    .eyebrow { font-size:12px; font-weight:800; letter-spacing:.18em; color:#bfdbfe; }
    h1 { margin:22px 0; font-size:clamp(44px,5vw,72px); line-height:1.02; letter-spacing:-.055em; }
    .story-copy p { max-width:510px; font-size:18px; line-height:1.7; color:#dbeafe; }
    .proof-card { position:relative; z-index:2; align-self:flex-start; display:flex; align-items:center; gap:16px; padding:14px 18px; border:1px solid rgba(255,255,255,.18); border-radius:16px; background:rgba(255,255,255,.1); backdrop-filter:blur(16px); }
    .proof-card strong,.proof-card small { display:block; } .proof-card small { margin-top:3px; color:#bfdbfe; }
    .avatar-stack { display:flex; } .avatar-stack span { width:34px; height:34px; display:grid; place-items:center; margin-left:-7px; border:2px solid #2855c8; border-radius:50%; background:#eff6ff; color:#1d4ed8; font-size:10px; font-weight:800; } .avatar-stack span:first-child { margin:0; }
    .orb { position:absolute; border-radius:50%; filter:blur(1px); background:rgba(96,165,250,.32); } .orb-one { width:320px; height:320px; right:-100px; top:10%; } .orb-two { width:220px; height:220px; left:-80px; bottom:8%; }
    .form-panel { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 7vw 24px; }
    router-outlet { display:none; } footer { margin-top:auto; padding-top:40px; color:#94a3b8; font-size:12px; }
    @media (max-width:900px) { .auth-shell { grid-template-columns:1fr; } .story-panel { min-height:280px; padding:32px; } .story-copy { margin:64px 0 36px; } h1 { font-size:42px; } .proof-card { display:none; } .form-panel { padding:40px 24px 20px; } }
    @media (max-width:520px) { .story-panel { min-height:220px; } .story-copy p { display:none; } h1 { font-size:34px; margin-bottom:0; } }
  `,
})
export class PublicLayout {}

