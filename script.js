document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('task-form');
  const taskTitle = document.getElementById('task-title');
  const taskDeadline = document.getElementById('task-deadline');
  const taskTime = document.getElementById('task-time');
  const taskPriority = document.getElementById('task-priority');
  const taskList = document.getElementById('task-list');
  const alarmSound = document.getElementById('alarm-sound');
  const stopAlarmBtn = document.getElementById('stop-alarm-btn');
  const stopAlarmContainer = document.getElementById('stop-alarm-container');
  const quoteText = document.getElementById('quote-text');

  // Gamifikasi Data
  let userXP = parseInt(localStorage.getItem('userXP')) || 0;
  let currentFilter = 'all';

  const quotes = [
    '"Tugas hari ini adalah istirahat yang tertunda untuk masa depan." - Dinusian',
    '"Sedikit demi sedikit, lama-lama skripsi selesai juga!"',
    '"Jangan tunggu deadline mepet baru dapat inspirasi!"',
    '"Tetap semangat, IPK tinggi menunggumu!"'
  ];
  quoteText.innerText = quotes[Math.floor(Math.random() * quotes.length)];

  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }

  let tasks = JSON.parse(localStorage.getItem('mahasiswaTasks')) || [];

  function saveTasks() {
    localStorage.setItem('mahasiswaTasks', JSON.stringify(tasks));
  }

  function updateXP(amount) {
    userXP += amount;
    if (userXP < 0) userXP = 0;
    localStorage.setItem('userXP', userXP);
    renderGamification();
  }

  function renderGamification() {
    const level = Math.floor(userXP / 100) + 1;
    const currentLevelXP = userXP % 100;
    
    let levelTitle = "MABA";
    if (level === 2) levelTitle = "Mahasiswa Aktif";
    if (level === 3) levelTitle = "Pejuang Skripsi";
    if (level >= 4) levelTitle = "Lulus Cumlaude";

    document.getElementById('user-level').innerText = `⭐ Level ${level}: ${levelTitle}`;
    document.getElementById('user-xp-text').innerText = `${currentLevelXP} / 100 XP`;
    document.getElementById('progress-bar-fill').style.width = `${currentLevelXP}%`;
  }

  function getCountdownText(targetDateStr) {
    const diff = new Date(targetDateStr) - new Date();
    if (diff <= 0) return '⏰ Waktu Habis / Alarm Berdering!';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);

    if (days > 0) return `⏳ Sisa: ${days}hr ${hours}jam`;
    return `⏳ Sisa: ${hours}jam ${mins}m`;
  }

  function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
      if (currentFilter === 'all') return true;
      return task.priority === currentFilter;
    });

    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); font-size: 0.85rem;">Tidak ada tugas.</p>';
      return;
    }

    filteredTasks.forEach((task) => {
      const index = tasks.indexOf(task);
      const li = document.createElement('li');
      if (task.completed) li.classList.add('completed');

      const targetDateTime = `${task.deadline}T${task.time}`;
      const countdown = task.completed ? '✅ Selesai' : getCountdownText(targetDateTime);

      li.innerHTML = `
        <div class="task-info">
          <span class="task-text task-title-text">${task.title}</span>
          <span class="task-category">${task.priority}</span>
          <span class="task-countdown">${countdown}</span>
        </div>
        <div class="actions">
          <button class="action-btn done-btn" onclick="toggleTask(${index})">
            ${task.completed ? 'Batal' : 'Selesai'}
          </button>
          <button class="action-btn delete-btn" onclick="deleteTask(${index})">Hapus</button>
        </div>
      `;

      taskList.appendChild(li);
    });
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTask = {
      title: taskTitle.value,
      deadline: taskDeadline.value,
      time: taskTime.value,
      priority: taskPriority.value,
      completed: false,
      alarmRung: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    taskTitle.value = '';
    taskDeadline.value = '';
    taskTime.value = '';
    taskPriority.value = '';
  });

  // Pengecekan Alarm & Update Countdown
  setInterval(() => {
    const now = new Date();

    tasks.forEach((task, index) => {
      if (!task.completed && !task.alarmRung) {
        const taskTimeObj = new Date(`${task.deadline}T${task.time}`);

        if (now >= taskTimeObj) {
          playAlarmSound(task.title);
          tasks[index].alarmRung = true;
          saveTasks();
        }
      }
    });

    renderTasks();
  }, 1000);

  function playAlarmSound(title) {
    alarmSound.currentTime = 0;
    alarmSound.play().then(() => {
      stopAlarmContainer.style.display = 'block';
    }).catch(err => console.log('Autoplay diblokir:', err));

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 WAKTUNYA KERJAKAN TUGAS, DINUSIAN!', {
        body: `Tugas: ${title}`,
        icon: 'https://upload.wikimedia.org/wikipedia/id/3/3d/Logo_UDINUS.png',
        requireInteraction: true
      });
    }
  }

  stopAlarmBtn.addEventListener('click', () => {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    stopAlarmContainer.style.display = 'none';
  });

  window.toggleTask = (index) => {
    tasks[index].completed = !tasks[index].completed;
    
    // Tambah/Kurangi XP
    if (tasks[index].completed) {
      updateXP(50);
    } else {
      updateXP(-50);
    }

    saveTasks();
    renderTasks();
  };

  window.deleteTask = (index) => {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  };

  window.setFilter = (filter) => {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderTasks();
  };

  renderGamification();
  renderTasks();
});
