/* ============================================================
       定数・テーマデータ
    ============================================================ */
    const MOOD_DATA = {
      energetic: {
        title: "爆速で片付けよう！🔥",
        quote: "エネルギー満点。一番やりたいことから始めよう！",
        placeholder: "どんどんぶち込もう…！",
        addLabel: "GO!",
        praise: [
          "最高！その調子で突き進もう🔥",
          "ナイスクリア！まだまだいける⚡",
          "圧倒的スピード！🚀",
          "完璧にこなした！次はどれだ？🎯"
        ]
      },
      relax: {
        title: "心穏やかにいこう🌿",
        quote: "焦らず、深呼吸してマイペースに進めよう。",
        placeholder: "今日やりたいことを入れてね…",
        addLabel: "追加",
        praise: [
          "一歩ずつ、無理せず進めて偉いね🌱",
          "のんびりクリア！自分を褒めよう🍃",
          "ゆっくりでも前進！十分だよ🌿",
          "一歩前進、えらいね☀️"
        ]
      },
      focus: {
        title: "DEEP FOCUS // ZONE 🌌",
        quote: "余計な雑音を遮断。目の前の1点に集中する。",
        placeholder: "TASK INPUT...",
        addLabel: "ADD",
        praise: [
          "TASK DONE. 集中力持続中 ✨",
          "COMPLETED. 次のターゲットへ 🎯",
          "CLEAR. 順調。続行せよ。💻",
          "Focus Clear. 次のタスクへ移行。⚡"
        ]
      },
      cozy: {
        title: "あたたかい時間と共に☕",
        quote: "お気に入りのドリンクを淹れて、少しずつ。",
        placeholder: "今日やること、ぽつぽつと…",
        addLabel: "追加",
        praise: [
          "お疲れさま。ひと息入れよう☕",
          "ほっと一息、よくできました🍪",
          "いいペースだよ、無理しないでね📖",
          "ゆっくりできたね。素敵だよ🕯️"
        ]
      },
      gentle: {
        title: "自分をやさしく褒める日🌸",
        quote: "小さなことでも、できた自分を認めてあげよう。",
        placeholder: "今日の小さな一歩を書いてね…",
        addLabel: "追加 🌸",
        praise: [
          "できた自分をたくさん褒めてあげて🌸",
          "素敵！自分に花丸をあげよう💮",
          "えらい！本当に頑張ってるよ🌸",
          "クリアできたね、誇らしいよ🕊️"
        ]
      }
    };

    /* ============================================================
       状態管理
    ============================================================ */
    let currentMood   = localStorage.getItem('mooddo_theme') || 'relax';
    let currentFilter = 'all';
    let tasks = [];

    try {
      tasks = JSON.parse(localStorage.getItem('mooddo_tasks')) || [];
    } catch(e) {
      tasks = [];
    }

    if (tasks.length === 0) {
      tasks = [
        { id: 1, text: "おいしいお茶を淹れる", completed: true },
        { id: 2, text: "タスクをひとつだけ終わらせる", completed: false },
        { id: 3, text: "今日の小さな幸せを見つける", completed: false }
      ];
    }

    /* ============================================================
       日付の描画
    ============================================================ */
    function renderDate() {
      const now  = new Date();
      const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
      const y  = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const d  = String(now.getDate()).padStart(2, '0');
      document.getElementById('currentDate').textContent =
        `${y}.${mo}.${d} ${days[now.getDay()]}`;
    }

    /* ============================================================
       テーマ切替
    ============================================================ */
    function setMood(moodKey) {
      currentMood = moodKey;
      localStorage.setItem('mooddo_theme', moodKey);
      document.body.setAttribute('data-theme', moodKey);

      document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mood === moodKey);
      });

      const data = MOOD_DATA[moodKey];
      document.getElementById('moodTitle').textContent   = data.title;
      document.getElementById('moodQuote').textContent   = `「${data.quote}」`;
      document.getElementById('taskInput').placeholder   = data.placeholder;
      document.getElementById('addBtn').textContent      = data.addLabel;
    }

    /* ============================================================
       プログレスバーの更新
    ============================================================ */
    function updateProgress() {
      const total     = tasks.length;
      const done      = tasks.filter(t => t.completed).length;
      const pct       = total === 0 ? 0 : Math.round((done / total) * 100);

      document.getElementById('progressText').textContent   = `${done} / ${total} 完了`;
      document.getElementById('progressPercent').textContent = `${pct}%`;
      document.getElementById('progressBar').style.width    = `${pct}%`;

      // 完了済みが1件以上あればフッター表示
      document.getElementById('listFooter').style.display = done > 0 ? 'flex' : 'none';
    }

    /* ============================================================
       トースト通知
    ============================================================ */
    let toastTimer = null;
    function showToast(text) {
      const toast = document.getElementById('toast');
      toast.textContent = text;
      toast.classList.add('show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    }

    function showPraise() {
      const list = MOOD_DATA[currentMood].praise;
      showToast(list[Math.floor(Math.random() * list.length)]);
    }

    /* ============================================================
       タスク描画
    ============================================================ */
    function getFilteredTasks() {
      switch (currentFilter) {
        case 'active': return tasks.filter(t => !t.completed);
        case 'done':   return tasks.filter(t =>  t.completed);
        default:       return tasks;
      }
    }

    function renderTasks() {
      const list     = document.getElementById('taskList');
      const filtered = getFilteredTasks();
      list.innerHTML = '';

      if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent =
          currentFilter === 'done'   ? 'まだ完了したタスクはないよ ✨' :
          currentFilter === 'active' ? 'すべてのタスクが完了！ 🎉'      :
                                       'タスクを追加してみよう！';
        list.appendChild(empty);
      } else {
        filtered.forEach(task => {
          const item = document.createElement('div');
          item.className = `task-item${task.completed ? ' completed' : ''}`;
          item.dataset.id = task.id;

          const checkbox = document.createElement('input');
          checkbox.type      = 'checkbox';
          checkbox.className = 'task-checkbox';
          checkbox.checked   = task.completed;
          checkbox.addEventListener('change', () => toggleTask(task.id));

          const textSpan = document.createElement('span');
          textSpan.className   = 'task-text';
          textSpan.textContent = task.text;
          textSpan.contentEditable = 'true';
          textSpan.spellcheck = false;
          textSpan.addEventListener('blur', () => {
            const newText = textSpan.textContent.trim();
            if (newText) {
              tasks = tasks.map(t => t.id === task.id ? { ...t, text: newText } : t);
              saveTasks();
            } else {
              textSpan.textContent = task.text;
            }
          });
          textSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); textSpan.blur(); }
          });

          const delBtn = document.createElement('button');
          delBtn.className = 'delete-btn';
          delBtn.innerHTML  = '✕';
          delBtn.title      = '削除';
          delBtn.addEventListener('click', () => deleteTask(task.id, item));

          item.appendChild(checkbox);
          item.appendChild(textSpan);
          item.appendChild(delBtn);
          list.appendChild(item);
        });
      }

      updateProgress();
      saveTasks();
    }

    /* ============================================================
       データ操作
    ============================================================ */
    function saveTasks() {
      localStorage.setItem('mooddo_tasks', JSON.stringify(tasks));
    }

    function toggleTask(id) {
      tasks = tasks.map(t => {
        if (t.id === id) {
          const next = !t.completed;
          if (next) showPraise();
          return { ...t, completed: next };
        }
        return t;
      });
      renderTasks();
    }

    function deleteTask(id, itemEl) {
      itemEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      itemEl.style.opacity    = '0';
      itemEl.style.transform  = 'translateX(20px)';
      setTimeout(() => {
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
      }, 260);
    }

    /* ============================================================
       タスク追加
    ============================================================ */
    document.getElementById('todoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('taskInput');
      const text  = input.value.trim();
      if (!text) return;

      tasks.unshift({ id: Date.now(), text, completed: false });
      input.value = '';
      currentFilter = 'all';
      document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.filter === 'all')
      );
      renderTasks();

      // 追加ボタンのプチアニメ
      const btn = document.getElementById('addBtn');
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => btn.style.transform = '', 150);
    });

    /* ============================================================
       フィルター
    ============================================================ */
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
        renderTasks();
      });
    });

    /* ============================================================
       完了済み一括削除
    ============================================================ */
    document.getElementById('clearDoneBtn').addEventListener('click', () => {
      tasks = tasks.filter(t => !t.completed);
      renderTasks();
      showToast('完了済みタスクを削除しました 🗑️');
    });

    /* ============================================================
       気分ボタン
    ============================================================ */
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => setMood(btn.dataset.mood));
    });

    /* ============================================================
       初期化
    ============================================================ */
    renderDate();
    setMood(currentMood);
    renderTasks();