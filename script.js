// ================== 0. ОБЩИЕ НАСТРОЙКИ ЗВУКА ==================
let soundEnabled = true;

if (!document.getElementById('soundToggle')) {
    const soundControl = document.createElement('div');
    soundControl.style.display = 'flex';
    soundControl.style.justifyContent = 'flex-end';
    soundControl.style.marginBottom = '1rem';
    soundControl.innerHTML = `
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size:0.8rem;">
            <input type="checkbox" id="soundToggle" checked> 🔔 Звук включён
        </label>
    `;
    const firstCard = document.querySelector('.card');
    if (firstCard) firstCard.parentNode.insertBefore(soundControl, firstCard);
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
    });
}

function playAlarmSound() {
    if (!soundEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start(now + i * 0.6);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + i * 0.6 + 0.4);
            osc.stop(now + i * 0.6 + 0.4);
        }
    } catch(e) { console.log('Ошибка звука', e); }
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: body });
    }
}

// ================== 1. ТАЙМЕР ==================
let timerInterval = null;
let currentSeconds = 25 * 60;
let isWorkMode = true;
let isRunning = false;
let workMins = 25, breakMins = 5;

const timerDisplay = document.getElementById('timerDisplay');
const modeStatus = document.getElementById('modeStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const workInput = document.getElementById('workMinutes');
const breakInput = document.getElementById('breakMinutes');
const applySettingsBtn = document.getElementById('applyTimerSettings');

if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
}

function updateTimerUI() {
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    if (isWorkMode) {
        modeStatus.innerHTML = `🍅 Работа (осталось ${mins}:${secs.toString().padStart(2,'0')})`;
    } else {
        modeStatus.innerHTML = `☕ Отдых (осталось ${mins}:${secs.toString().padStart(2,'0')})`;
    }
}

function applySettings() {
    let newWork = parseInt(workInput.value);
    let newBreak = parseInt(breakInput.value);
    if (isNaN(newWork)) newWork = 25;
    if (isNaN(newBreak)) newBreak = 5;
    workMins = Math.min(99, Math.max(1, newWork));
    breakMins = Math.min(99, Math.max(1, newBreak));
    workInput.value = workMins;
    breakInput.value = breakMins;
    const wasRunning = isRunning;
    if (timerInterval) clearInterval(timerInterval);
    isRunning = false;
    if (isWorkMode) currentSeconds = workMins * 60;
    else currentSeconds = breakMins * 60;
    updateTimerUI();
    if (wasRunning) startTimer();
}

function switchMode() {
    if (isWorkMode) {
        isWorkMode = false;
        currentSeconds = breakMins * 60;
        showNotification('🍅 Перерыв!', `Отдых ${breakMins} минут. Сделайте разминку.`);
        playAlarmSound();
    } else {
        isWorkMode = true;
        currentSeconds = workMins * 60;
        showNotification('⏰ Работа!', `Новая сессия на ${workMins} минут.`);
        playAlarmSound();
    }
    updateTimerUI();
}

function tickTimer() {
    if (currentSeconds <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        isRunning = false;
        switchMode();
        startTimer();
        return;
    }
    currentSeconds--;
    updateTimerUI();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isRunning = true;
    timerInterval = setInterval(tickTimer, 1000);
}
function pauseTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; isRunning = false; }
}
function resetTimer() {
    pauseTimer();
    isWorkMode = true;
    currentSeconds = workMins * 60;
    updateTimerUI();
}
if (startBtn) startBtn.addEventListener('click', startTimer);
if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
if (resetBtn) resetBtn.addEventListener('click', resetTimer);
if (applySettingsBtn) applySettingsBtn.addEventListener('click', applySettings);
updateTimerUI();

// ================== 2. ЗАДАЧИ ==================
let tasks = [];
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoContainer = document.getElementById('todoListContainer');

function loadTasks() {
    const saved = localStorage.getItem('productive_tasks');
    tasks = saved ? JSON.parse(saved) : [];
    renderTasks();
}
function saveTasks() { localStorage.setItem('productive_tasks', JSON.stringify(tasks)); }
function renderTasks() {
    if (!todoContainer) return;
    if (!tasks.length) { todoContainer.innerHTML = '<li class="empty-placeholder">✨ Добавьте задачу</li>'; return; }
    todoContainer.innerHTML = '';
    tasks.forEach((task, idx) => {
        const li = document.createElement('li'); li.className = 'todo-item';
        const span = document.createElement('span'); span.className = 'todo-text';
        span.textContent = task.text;
        if (task.completed) span.classList.add('completed');
        span.onclick = () => { tasks[idx].completed = !tasks[idx].completed; saveTasks(); renderTasks(); };
        const delBtn = document.createElement('button'); delBtn.textContent = '✖'; delBtn.className = 'delete-todo';
        delBtn.onclick = () => { tasks.splice(idx,1); saveTasks(); renderTasks(); };
        li.append(span, delBtn); todoContainer.appendChild(li);
    });
}
function addTask() {
    const text = todoInput.value.trim();
    if (!text) return;
    tasks.push({ text, completed: false });
    saveTasks(); renderTasks(); todoInput.value = '';
}
if (addTodoBtn) addTodoBtn.onclick = addTask;
if (todoInput) todoInput.addEventListener('keypress', e => { if(e.key === 'Enter') addTask(); });
loadTasks();

// ================== 3. ЗАМЕТКИ ==================
const notesArea = document.getElementById('notesTextarea');
const saveNotesBtn = document.getElementById('saveNotesBtn');
const clearNotesBtn = document.getElementById('clearNotesBtn');
function loadNotes() { if(notesArea) notesArea.value = localStorage.getItem('productive_notes') || ''; }
function saveNotes() { if(notesArea) { localStorage.setItem('productive_notes', notesArea.value); alert('Заметки сохранены'); } }
function clearNotes() { if(notesArea && confirm('Очистить заметки?')) { notesArea.value = ''; localStorage.removeItem('productive_notes'); alert('Готово'); } }
if (saveNotesBtn) saveNotesBtn.onclick = saveNotes;
if (clearNotesBtn) clearNotesBtn.onclick = clearNotes;
loadNotes();

// ================== 4. КАЛЕНДАРЬ ==================
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let events = {};
function loadEvents() { const saved = localStorage.getItem('calendar_events'); events = saved ? JSON.parse(saved) : {}; }
function saveEvents() { localStorage.setItem('calendar_events', JSON.stringify(events)); }
function renderCalendar() {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDayOfMonth.getDay();
    let startOffset = (startWeekday === 0 ? 6 : startWeekday - 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const calendarDiv = document.getElementById('calendarDays');
    if(!calendarDiv) return;
    calendarDiv.innerHTML = '';
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const monthYearSpan = document.getElementById('monthYearDisplay');
    if(monthYearSpan) monthYearSpan.innerText = `${monthNames[currentMonth]} ${currentYear}`;
    for (let i = 0; i < startOffset; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day');
        emptyDiv.style.visibility = 'hidden';
        calendarDiv.appendChild(emptyDiv);
    }
    const today = new Date();
    const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        dayDiv.textContent = d;
        const dateKey = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (events[dateKey]) dayDiv.classList.add('has-event');
        if (todayY === currentYear && todayM === currentMonth && todayD === d) dayDiv.classList.add('today');
        dayDiv.addEventListener('click', () => showEventPopup(dateKey, d));
        calendarDiv.appendChild(dayDiv);
    }
}
function showEventPopup(dateKey, dayNum) {
    const popup = document.getElementById('eventPopup');
    const input = document.getElementById('eventText');
    const selectedInfo = document.getElementById('selectedDateInfo');
    if(!popup || !input) return;
    selectedInfo.innerText = `Выбран день: ${dateKey}`;
    input.value = events[dateKey] || '';
    popup.style.display = 'flex';
    const saveBtn = document.getElementById('saveEventBtn');
    const closeBtn = document.getElementById('closePopupBtn');
    const newSave = () => {
        const text = input.value.trim();
        if (text) events[dateKey] = text;
        else delete events[dateKey];
        saveEvents();
        renderCalendar();
        popup.style.display = 'none';
        selectedInfo.innerText = `Событие сохранено: ${text || 'удалено'}`;
        saveBtn.removeEventListener('click', newSave);
        closeBtn.removeEventListener('click', newClose);
    };
    const newClose = () => {
        popup.style.display = 'none';
        saveBtn.removeEventListener('click', newSave);
        closeBtn.removeEventListener('click', newClose);
    };
    saveBtn.addEventListener('click', newSave);
    closeBtn.addEventListener('click', newClose);
}
document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
});
document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
});
loadEvents();
renderCalendar();

// ================== 5. ПОГОДА ==================
const weatherLocation = document.querySelector('.weather-location');
const weatherTemp = document.querySelector('.weather-temp');
const weatherDesc = document.querySelector('.weather-desc');
const weatherHumidity = document.querySelector('.weather-info div:nth-child(4)');
const weatherWind = document.querySelector('.weather-info div:nth-child(5)');
const refreshWeather = document.getElementById('refreshWeatherBtn');
async function fetchWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&timezone=auto`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.current_weather) {
            if(weatherTemp) weatherTemp.innerHTML = `${Math.round(data.current_weather.temperature)}°C`;
            let code = data.current_weather.weathercode;
            const descMap = {0:'Ясно',1:'Малооблачно',2:'Облачно',3:'Пасмурно',45:'Туман',61:'Дождь',71:'Снег'};
            if(weatherDesc) weatherDesc.innerHTML = descMap[code] || 'Облачно';
            if(weatherWind) weatherWind.innerHTML = `🍃 Ветер: ${data.current_weather.windspeed} м/с`;
            if(data.hourly && data.hourly.relativehumidity_2m && weatherHumidity) {
                weatherHumidity.innerHTML = `💧 Влажность: ${data.hourly.relativehumidity_2m[0]}%`;
            }
        }
    } catch(e) { if(weatherTemp) weatherTemp.innerHTML = 'Ошибка'; }
}
function getLocationAndWeather() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude, lon = pos.coords.longitude;
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ru`)
                .then(res=>res.json()).then(data=>{ if(weatherLocation) weatherLocation.innerHTML = `📍 ${data.city || 'Ваш город'}`; })
                .catch(()=>{ if(weatherLocation) weatherLocation.innerHTML = `📍 Координаты получены`; });
            fetchWeather(lat, lon);
        }, () => { if(weatherLocation) weatherLocation.innerHTML = '📍 Гео недоступно'; });
    } else { if(weatherLocation) weatherLocation.innerHTML = '📍 Нет гео'; }
}
if(refreshWeather) refreshWeather.onclick = getLocationAndWeather;
getLocationAndWeather();

// ================== 6. УПРАЖНЕНИЯ ==================
let exercises = [];
const exerciseInput = document.getElementById('exerciseInput');
const addExerciseBtn = document.getElementById('addExerciseBtn');
const exerciseContainer = document.getElementById('exerciseListContainer');
const exerciseStats = document.getElementById('exerciseStats');
function loadExercises() { const saved = localStorage.getItem('zozh_exercises'); exercises = saved ? JSON.parse(saved) : []; renderExercises(); }
function saveExercises() { localStorage.setItem('zozh_exercises', JSON.stringify(exercises)); }
function renderExercises() {
    if(!exerciseContainer) return;
    if (!exercises.length) { exerciseContainer.innerHTML = '<li class="empty-placeholder">🏋️ Добавьте упражнение</li>'; if(exerciseStats) exerciseStats.innerText = 'Выполнено 0 из 0'; return; }
    let completedCount = 0;
    exerciseContainer.innerHTML = '';
    exercises.forEach((ex, idx) => {
        if (ex.completed) completedCount++;
        const li = document.createElement('li'); li.className = 'exercise-item';
        const div = document.createElement('div'); div.className = 'exercise-text';
        const chk = document.createElement('input'); chk.type = 'checkbox'; chk.checked = ex.completed;
        chk.addEventListener('change', () => { exercises[idx].completed = chk.checked; saveExercises(); renderExercises(); });
        const span = document.createElement('span'); span.textContent = ex.text;
        if (ex.completed) span.classList.add('completed-exercise');
        div.appendChild(chk); div.appendChild(span);
        const delBtn = document.createElement('button'); delBtn.textContent = '✖'; delBtn.className = 'delete-exercise';
        delBtn.addEventListener('click', () => { exercises.splice(idx, 1); saveExercises(); renderExercises(); });
        li.appendChild(div); li.appendChild(delBtn);
        exerciseContainer.appendChild(li);
    });
    if(exerciseStats) exerciseStats.innerText = `✅ Выполнено ${completedCount} из ${exercises.length} упражнений`;
}
function addExercise() { const text = exerciseInput.value.trim(); if (!text) return; exercises.push({ text, completed: false }); saveExercises(); renderExercises(); exerciseInput.value = ''; }
if(addExerciseBtn) addExerciseBtn.addEventListener('click', addExercise);
if(exerciseInput) exerciseInput.addEventListener('keypress', e => { if(e.key === 'Enter') addExercise(); });
loadExercises();

// ================== 7. НАПОМИНАНИЕ ==================
let alarmTimeout = null;
function checkAlarm() {
    const alarmTimeInput = document.getElementById('alarmTimeInput');
    if (!alarmTimeInput) return;
    const [hours, minutes] = alarmTimeInput.value.split(':').map(Number);
    const now = new Date();
    let alarmDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    if (alarmDate <= now) alarmDate.setDate(alarmDate.getDate() + 1);
    const msUntilAlarm = alarmDate - now;
    if (alarmTimeout) clearTimeout(alarmTimeout);
    alarmTimeout = setTimeout(() => {
        showNotification('⏰ Напоминание!', `Сейчас ${alarmTimeInput.value}. Пора заняться делами или сделать упражнения.`);
        playAlarmSound();
        const statusDiv = document.getElementById('alarmStatus');
        if (statusDiv) statusDiv.innerHTML = `✅ Напоминание на ${alarmTimeInput.value} сработало!`;
    }, msUntilAlarm);
    const statusDiv = document.getElementById('alarmStatus');
    const minsLeft = Math.floor(msUntilAlarm / 60000);
    if (statusDiv) statusDiv.innerHTML = `⏳ Напоминание на ${alarmTimeInput.value} через ${minsLeft} мин.`;
}
function setAlarm() { if (alarmTimeout) clearTimeout(alarmTimeout); checkAlarm(); }
const setAlarmBtn = document.getElementById('setAlarmBtn');
if (setAlarmBtn) setAlarmBtn.addEventListener('click', setAlarm);
