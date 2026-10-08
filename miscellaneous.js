const MISC_ROUTINE_KEY = 'tracker_misc_routine_data';
let lastActiveHour = -1;

// Default Baseline Routine
const defaultRoutine = [
  { id: 1, start: 23, end: 6,  displayTime: "11:00 PM - 06:00 AM", task: "Sleep", category: "Rest", icon: "fa-bed" },
  { id: 2, start: 6,  end: 7,  displayTime: "06:00 AM - 07:00 AM", task: "Exercise", category: "Fitness", icon: "fa-dumbbell" },
  { id: 3, start: 7,  end: 8,  displayTime: "07:00 AM - 08:00 AM", task: "Ready for Office & Breakfast", category: "Personal", icon: "fa-utensils" },
  { id: 4, start: 8,  end: 13, displayTime: "08:00 AM - 01:00 PM", task: "Office (1st Half)", category: "Work", icon: "fa-briefcase" },
  { id: 5, start: 13, end: 14, displayTime: "01:00 PM - 02:00 PM", task: "Lunch Break", category: "Personal", icon: "fa-burger" },
  { id: 6, start: 14, end: 18, displayTime: "02:00 PM - 06:00 PM", task: "Office (2nd Half)", category: "Work", icon: "fa-laptop-code" },
  { id: 7, start: 18, end: 19, displayTime: "06:00 PM - 07:00 PM", task: "Go Home / Commute", category: "Personal", icon: "fa-person-walking-luggage" },
  { id: 8, start: 19, end: 20, displayTime: "07:00 PM - 08:00 PM", task: "Dinner", category: "Personal", icon: "fa-bowl-food" },
  { id: 9, start: 20, end: 23, displayTime: "08:00 PM - 11:00 PM", task: "Study", category: "Learning", icon: "fa-book-open" }
];

document.addEventListener('DOMContentLoaded', () => {
  setupMobileNav();
  renderRoutineTable();
  updateLiveClockAndStatus();
  setInterval(updateLiveClockAndStatus, 1000);

  const miscForm = document.getElementById('miscForm');
  if (miscForm) {
    miscForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const task = document.getElementById('slotTask').value.trim();
      const startTimeVal = document.getElementById('slotStartTime').value;
      const endTimeVal = document.getElementById('slotEndTime').value;
      const category = document.getElementById('slotCategory').value;

      if (!task || !startTimeVal || !endTimeVal) return;

      const startHour = parseInt(startTimeVal.split(':')[0]);
      const endHour = parseInt(endTimeVal.split(':')[0]);

      const displayTime = `${convertInputTo12Hr(startTimeVal)} - ${convertInputTo12Hr(endTimeVal)}`;

      const newSlot = {
        id: Date.now(),
        start: startHour,
        end: endHour,
        displayTime: displayTime,
        task,
        category,
        icon: getCategoryIcon(category)
      };

      const routine = getRoutineData();
      routine.push(newSlot);
      routine.sort((a, b) => a.start - b.start);

      saveRoutineData(routine);
      e.target.reset();
      closeMiscModal();
      lastActiveHour = -1;
      renderRoutineTable();
    });
  }
});

/* Mobile Navigation Toggle Handler */
function setupMobileNav() {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }
}

/* Convert "14:30" string to "02:30 PM" */
function convertInputTo12Hr(timeStr) {
  if (!timeStr) return '';
  let [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/* Modal Controls */
function openMiscModal() {
  const modal = document.getElementById('miscModalOverlay');
  if (modal) modal.classList.add('active');
}

function closeMiscModal() {
  const modal = document.getElementById('miscModalOverlay');
  if (modal) modal.classList.remove('active');
}

/* LocalStorage Helpers */
function getRoutineData() {
  const data = localStorage.getItem(MISC_ROUTINE_KEY);
  return data ? JSON.parse(data) : [...defaultRoutine];
}

function saveRoutineData(data) {
  localStorage.setItem(MISC_ROUTINE_KEY, JSON.stringify(data));
}

function resetDefaultRoutine() {
  if (confirm('Kya aap saare custom time slots hatakar default routine par reset karna chahte hain?')) {
    saveRoutineData(defaultRoutine);
    lastActiveHour = -1;
    renderRoutineTable();
  }
}

/* Render Routine Table safely */
function renderRoutineTable() {
  const tbody = document.getElementById('routineTableBody');
  if (!tbody) return;

  const routine = getRoutineData();
  tbody.innerHTML = '';
  const now = new Date();
  const currentHour = now.getHours();

  if (routine.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">Koi time slot nahi hai. <strong>"+ Add Custom Time Slot"</strong> par click karein.</td></tr>`;
    return;
  }

  routine.forEach(item => {
    const isActive = isTaskActive(item, currentHour);

    const tr = document.createElement('tr');
    if (isActive) tr.classList.add('active-routine-row');

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      tr.innerHTML = `
        <td>
          <div style="font-weight:700; color:var(--amber-primary);">${item.displayTime}</div>
          <span class="badge-tag">${item.category}</span>
        </td>
        <td style="font-size:0.95rem; font-weight:600;">
          <i class="fa-solid ${item.icon || 'fa-clock'}" style="margin-right: 6px; color:var(--amber-primary);"></i>
          ${escapeHtml(item.task)}
        </td>
        <td>
          ${isActive 
            ? '<span class="badge-live"><i class="fa-solid fa-circle"></i> Live Now</span>' 
            : '<span class="badge-upcoming">Scheduled</span>'}
        </td>
        <td style="justify-content: flex-end;">
          <button class="btn-del" onclick="deleteTimeSlot(${item.id})" title="Delete Slot"><i class="fa-solid fa-trash"></i> Delete Slot</button>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td><strong>${item.displayTime}</strong></td>
        <td>
          <i class="fa-solid ${item.icon || 'fa-clock'}" style="margin-right: 8px; color:var(--amber-primary);"></i>
          ${escapeHtml(item.task)}
        </td>
        <td><span class="badge-tag">${item.category}</span></td>
        <td>
          ${isActive 
            ? '<span class="badge-live"><i class="fa-solid fa-circle"></i> Live Now</span>' 
            : '<span class="badge-upcoming">Scheduled</span>'}
        </td>
        <td>
          <button class="btn-del" onclick="deleteTimeSlot(${item.id})" title="Delete Slot"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
    }

    tbody.appendChild(tr);
  });
}

function deleteTimeSlot(id) {
  if (confirm('Kya aap iss time slot ko delete karna chahte hain?')) {
    const routine = getRoutineData();
    const updated = routine.filter(item => item.id !== id);
    saveRoutineData(updated);
    lastActiveHour = -1;
    renderRoutineTable();
  }
}

function isTaskActive(item, hour) {
  if (item.start > item.end) {
    return hour >= item.start || hour < item.end;
  }
  return hour >= item.start && hour < item.end;
}

function updateLiveClockAndStatus() {
  const clockEl = document.getElementById('liveClock');
  const statusEl = document.getElementById('currentTaskStatus');
  
  const now = new Date();
  if (clockEl) {
    clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  const currentHour = now.getHours();

  if (lastActiveHour !== -1 && currentHour !== lastActiveHour) {
    lastActiveHour = currentHour;
    renderRoutineTable();
  } else {
    lastActiveHour = currentHour;
  }

  const routine = getRoutineData();
  const activeTask = routine.find(item => isTaskActive(item, currentHour));

  if (statusEl) {
    if (activeTask) {
      statusEl.innerHTML = `<i class="fa-solid ${activeTask.icon || 'fa-clock'}"></i> Current Task: ${activeTask.task}`;
    } else {
      statusEl.innerHTML = `<i class="fa-solid fa-mug-hot"></i> Free / Unscheduled Time`;
    }
  }
}

function getCategoryIcon(cat) {
  switch (cat) {
    case 'Work': return 'fa-briefcase';
    case 'Rest': return 'fa-bed';
    case 'Learning': return 'fa-book-open';
    case 'Fitness': return 'fa-dumbbell';
    case 'Leisure': return 'fa-gamepad';
    default: return 'fa-clock';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}