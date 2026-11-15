// 혼계숯불치킨 — 첫 화면 불씨 + 가맹 문의 폼

// 1) 첫 화면 불씨: 숯불에서 올라오는 작은 불티. 움직임 줄이기 설정이면 그리지 않는다.
(function embers() {
  const canvas = document.getElementById('embers');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, sparks = [], raf = 0, running = false;

  const spawn = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? h - Math.random() * h * 0.6 : h + 8,
    r: 0.6 + Math.random() * 1.8,
    vy: 0.25 + Math.random() * 0.7,
    sway: 0.3 + Math.random() * 0.9,
    phase: Math.random() * Math.PI * 2,
    life: 0.5 + Math.random() * 0.5,
    warm: Math.random(),
  });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, Math.max(24, w / 22)));
    sparks = Array.from({ length: count }, () => spawn(true));
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      s.y -= s.vy;
      s.x += Math.sin(t / 900 + s.phase) * s.sway * 0.35;
      const rise = 1 - s.y / h;                 // 0(바닥) → 1(위)
      const alpha = Math.max(0, s.life * (1 - rise * 1.55)) * (0.65 + 0.35 * Math.sin(t / 180 + s.phase));
      if (alpha <= 0.01 || s.y < -10) { sparks[i] = spawn(false); continue; }
      const g = Math.round(110 + s.warm * 90);  // 주황 ~ 금빛
      ctx.fillStyle = `rgba(255, ${g}, 60, ${alpha.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  window.addEventListener('resize', resize);
  // 첫 화면이 보일 때만 그린다
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { entries[0].isIntersecting ? start() : stop(); }).observe(canvas);
  } else { start(); }
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
})();

// 2) 가맹 문의 폼 → /api/inquiry
(function inquiryForm() {
  const form = document.getElementById('inquiry-form');
  if (!form) return;
  const msg = document.getElementById('form-msg');
  const btn = form.querySelector('button[type="submit"]');
  const say = (text, kind) => { msg.textContent = text; msg.className = 'form-msg' + (kind ? ' is-' + kind : ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value,
      consent: form.consent.checked,   // 반드시 true/false
    };
    if (!data.name || !data.contact) { say('이름과 연락처를 적어 주세요', 'err'); (data.name ? form.contact : form.name).focus(); return; }
    if (!data.consent) { say('개인정보 수집·이용에 동의해 주세요', 'err'); form.consent.focus(); return; }

    btn.disabled = true; say('보내는 중이에요…');
    try {
      const r = await fetch('/api/inquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) { say(out.error || '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 'err'); return; }
      form.reset();
      say('문의가 접수됐어요. 확인 후 연락드릴게요.', 'ok');
    } catch {
      say('보내지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.', 'err');
    } finally {
      btn.disabled = false;
    }
  });
})();
