/* ============================================================
     STATE
  ============================================================ */
  const MOODS = {
    energetic: {
      name: 'やる気MAX',
      emoji: '🔥',
      cheer: 'この調子で全部片付けよう！ロケットスタート！🚀',
      themeClass: 'theme-energetic',
      completeFx: 'confetti',
    },
    chill: {
      name: 'まったり・省エネ',
      emoji: '🌿',
      cheer: 'マイペースで大丈夫。ひとつできたら花丸だよ。☕',
      themeClass: 'theme-chill',
      completeFx: 'steam',
    },
    focus: {
      name: '集中モード',
      emoji: '🎯',
      cheer: 'ノイズを遮断。目の前の1つに没入しよう。⚡',
      themeClass: 'theme-focus',
      completeFx: 'glow',
    },
    cozy: {
      name: 'もやもや・リセット',
      emoji: '🌸',
      cheer: 'まずは深呼吸。小さいことから整理しよう。🫧',
      themeClass: 'theme-cozy',
      completeFx: 'ripple',
    },
  };

  let currentMood = 'energetic';
  let tasks = JSON.parse(localStorage.getItem('mooddo_tasks') || '[]');
  let moodLog = JSON.parse(localStorage.getItem('mooddo_log') || '[]');
  let nextId = parseInt(localStorage.getItem('mooddo_nextid') || '1', 10);

  // Timer state
  let timerInterval = null;
  let timerSeconds = 25 * 60;
  let timerRunning = false;

  /* ============================================================
     PERSIST
  ============================================================ */
  function saveTasks() {
    localStorage.setItem('mooddo_tasks', JSON.stringify(tasks));
    localStorage.setItem('mooddo_nextid', String(nextId));
  }

  function saveLog() {
    localStorage.setItem('mooddo_log', JSON.stringify(moodLog));
  }

  /* ============================================================
     MOOD SWITCH
  ============================================================ */
  function switchMood(mood) {
    currentMood = mood;
    const moodData = MOODS[mood];

    // body theme class
    document.body.className = moodData.themeClass;

    // active button
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mood === mood);
    });

    // today message
    document.getElementById('today-msg').textContent = moodData.cheer;

    // log the mood switch
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    moodLog.unshift({ mood, time: timeStr, emoji: moodData.emoji, name: moodData.name });
    if (moodLog.length > 20) moodLog = moodLog.slice(0, 20);
    saveLog();
    renderMoodLog();

    // toast
    showToast(`${moodData.emoji} ${moodData.name} モードに切り替えました`);
  }

  /* ============================================================
     RENDER TASKS
  ============================================================ */
  function renderTasks() {
    const list = document.getElementById('task-list');
    const empty = document.getElementById('empty-state');
    list.innerHTML = '';

    if (tasks.length === 0) {
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.dataset.id = task.id;
        li.innerHTML = `
          <button class="check-btn${task.completed ? ' checked' : ''}" onclick="toggleTask(${task.id})" title="完了/未完了を切り替え">
            ${task.completed ? '✓' : ''}
          </button>
          <span class="task-text">${escapeHtml(task.text)}</span>
          <button class="delete-btn" onclick="deleteTask(${task.id})" title="削除">✕</button>
        `;
        list.appendChild(li);
      });
    }

    updateStats();
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ============================================================
     STATS
  ============================================================ */
  function updateStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-done').textContent = done;
    document.getElementById('stat-rate').textContent = rate + '%';
  }

  /* ============================================================
     ADD TASK
  ============================================================ */
  function addTask(e) {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;
    tasks.push({ id: nextId++, text, completed: false });
    saveTasks();
    renderTasks();
    input.value = '';
    input.focus();
  }

  /* ============================================================
     TOGGLE TASK
  ============================================================ */
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderTasks();

    if (task.completed) {
      triggerCompleteFx();
      const msgs = completionMessages[currentMood];
      showToast(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }

  const completionMessages = {
    energetic: ['最高！一個倒した！💥', 'ガンガンいこうぜ！🚀', 'パーフェクト！次！🔥', 'やったね！止まるな！⚡'],
    chill:     ['えらい！ゆっくりでいいよ☕', 'ひとつできたら花丸🌿', '無理しないでね、お疲れ様💚', 'よくできました🍵'],
    focus:     ['[DONE] +1 ⚡', 'Completed. Next task.', 'Task closed. 集中継続。', 'Good. Keep going.'],
    cozy:      ['よかったね🌸 波紋広がる〜', 'ほんのり達成感🫧', 'じわっと嬉しい✨', '小さな一歩、大事💜'],
  };

  /* ============================================================
     DELETE TASK
  ============================================================ */
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  /* ============================================================
     COMPLETION EFFECTS
  ============================================================ */
  function triggerCompleteFx() {
    const fx = MOODS[currentMood].completeFx;
    if (fx === 'confetti') launchConfetti();
    else if (fx === 'steam') launchSteam();
    else if (fx === 'glow') triggerGlow();
    else if (fx === 'ripple') launchRipple();
  }

  /* --- Confetti --- */
  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b','#ef4444','#f97316','#fbbf24','#ffffff','#10b981'];
    const pieces = Array.from({length: 90}, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 60,
      w: 7 + Math.random() * 8,
      h: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 3,
      vy: 3 + Math.random() * 3,
      alpha: 1,
    }));

    let frame;
    let elapsed = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      elapsed++;
      let alive = false;
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (elapsed > 50) p.alpha -= 0.015;
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
          ctx.restore();
        }
      });
      if (alive) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (frame) cancelAnimationFrame(frame);
    draw();
  }

  /* --- Steam --- */
  function launchSteam() {
    const card = document.getElementById('main-card');
    const rect = card.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'steam-particle';
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + rect.height * 0.5 + Math.random() * 40;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.setProperty('--sx', (Math.random() - 0.5) * 30 + 'px');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
      }, i * 80);
    }
  }

  /* --- Glow (focus) --- */
  function triggerGlow() {
    const card = document.getElementById('main-card');
    card.classList.add('focus-glow');
    setTimeout(() => card.classList.remove('focus-glow'), 700);
  }

  /* --- Ripple (cozy) --- */
  function launchRipple() {
    const overlay = document.getElementById('ripple-overlay');
    const card = document.getElementById('main-card');
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const size = Math.max(rect.width, rect.height);

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const circle = document.createElement('div');
        circle.className = 'ripple-circle';
        circle.style.width = size + 'px';
        circle.style.height = size + 'px';
        circle.style.left = (cx - size/2) + 'px';
        circle.style.top = (cy - size/2) + 'px';
        circle.style.animationDuration = (1.0 + i * 0.25) + 's';
        overlay.appendChild(circle);
        setTimeout(() => circle.remove(), 1600);
      }, i * 180);
    }
  }

  /* ============================================================
     TOAST
  ============================================================ */
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  /* ============================================================
     FOCUS TIMER (Pomodoro)
  ============================================================ */
  function updateTimerDisplay() {
    const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const s = String(timerSeconds % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${m}:${s}`;
  }

  function toggleTimer() {
    const btn = document.getElementById('timer-start-btn');
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      btn.textContent = 'START';
      btn.classList.remove('running');
    } else {
      timerRunning = true;
      btn.textContent = 'PAUSE';
      btn.classList.add('running');
      timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
          timerSeconds--;
          updateTimerDisplay();
        } else {
          clearInterval(timerInterval);
          timerRunning = false;
          btn.textContent = 'START';
          btn.classList.remove('running');
          showToast('⏱ 25分経過！お疲れ様でした。休憩しよう。');
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 25 * 60;
    updateTimerDisplay();
    const btn = document.getElementById('timer-start-btn');
    btn.textContent = 'START';
    btn.classList.remove('running');
  }

  /* ============================================================
     MOOD LOG RENDER
  ============================================================ */
  function renderMoodLog() {
    const list = document.getElementById('mood-log-list');
    list.innerHTML = '';
    if (moodLog.length === 0) {
      list.innerHTML = '<div style="font-size:12px;opacity:0.5;color:#fff;">まだ気分ログがありません</div>';
      return;
    }
    moodLog.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'mood-log-item';
      item.innerHTML = `
        <span style="opacity:0.55;font-size:11px;min-width:38px;">${entry.time}</span>
        <span class="mood-log-badge">${entry.emoji} ${entry.name}</span>
      `;
      list.appendChild(item);
    });
  }

  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    // Set initial mood without logging
    const moodData = MOODS[currentMood];
    document.body.className = moodData.themeClass;
    document.getElementById('today-msg').textContent = moodData.cheer;
    renderTasks();
    renderMoodLog();
    updateTimerDisplay();
  }

  init();