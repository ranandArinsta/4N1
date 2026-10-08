const getWorkoutKey = (date) => `tracker_workout_${date}`;
const WORKOUT_ROUTINE_TEMPLATE_KEY = 'tracker_workout_master_routine';

document.addEventListener('DOMContentLoaded', () => {
  const workoutForm = document.getElementById('workoutForm');
  if (workoutForm) {
    workoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('workoutName').value.trim();
      const muscle = document.getElementById('workoutMuscle').value;
      const sets = parseInt(document.getElementById('workoutSets').value) || 0;
      const reps = document.getElementById('workoutReps').value.trim();
      const notes = document.getElementById('workoutNotes').value.trim();

      if (!name) return;

      const newItem = { id: Date.now(), name, muscle, sets, reps, notes, completed: false };
      const items = getStorageData(getWorkoutKey(currentDate));
      items.push(newItem);
      setStorageData(getWorkoutKey(currentDate), items);

      e.target.reset();
      closeWorkoutModal();
      renderWorkout();
    });
  }
});

/* Modal Controls */
function openWorkoutModal() {
  const modal = document.getElementById('workoutModalOverlay');
  if (modal) modal.classList.add('active');
}

function closeWorkoutModal() {
  const modal = document.getElementById('workoutModalOverlay');
  if (modal) modal.classList.remove('active');
}

/* Render Workout Items with Responsive Mobile Card / Table logic */
function renderWorkout() {
  const items = getStorageData(getWorkoutKey(currentDate));
  const tbody = document.getElementById('workoutList');
  if (!tbody) return;

  tbody.innerHTML = '';
  let totalSets = 0;
  let completedCount = 0;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-msg"><strong>Add Exercise</strong> or <strong>Load Saved Routine</strong> </td></tr>`;
  } else {
    items.forEach(item => {
      if (item.completed) completedCount++;
      totalSets += item.sets || 0;

      const tr = document.createElement('tr');
      if (item.completed) tr.classList.add('completed-row');

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Mobile Responsive Layout
        tr.innerHTML = `
          <td>
            <div class="mobile-card-header">
              <input type="checkbox" class="mobile-card-checkbox" ${item.completed ? 'checked' : ''} onchange="toggleWorkoutItem(${item.id})">
              <span>${escapeHtml(item.name)}</span>
            </div>
            <span class="badge-tag">${item.muscle}</span>
          </td>
          ${item.notes ? `<td style="font-size:0.85rem; color:var(--text-muted);">${escapeHtml(item.notes)}</td>` : ''}
          <td>
            <div class="mobile-card-macros">
              <span><i class="fa-solid fa-layer-group"></i> ${item.sets || 0} Sets</span>
              <span><i class="fa-solid fa-rotate-right"></i> ${escapeHtml(item.reps) || '-'} Reps</span>
            </div>
          </td>
          <td class="hide-on-pdf" style="justify-content: flex-end;">
            <button class="btn-del" onclick="deleteWorkoutItem(${item.id})" title="Permanently Delete"><i class="fa-solid fa-trash"></i> Delete Exercise</button>
          </td>
        `;
      } else {
        // Desktop Table Layout
        tr.innerHTML = `
          <td>
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleWorkoutItem(${item.id})">
          </td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td><span class="badge-tag">${item.muscle}</span></td>
          <td>${item.sets || 0}</td>
          <td>${escapeHtml(item.reps) || '-'}</td>
          <td>${escapeHtml(item.notes) || '-'}</td>
          <td class="hide-on-pdf">
            <button class="btn-del" onclick="deleteWorkoutItem(${item.id})" title="Permanently Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;
      }

      tbody.appendChild(tr);
    });
  }

  document.getElementById('workoutTotalCount').innerText = items.length;
  document.getElementById('workoutTotalSets').innerText = totalSets;
  document.getElementById('workoutCompletedCount').innerText = `${completedCount} / ${items.length}`;
}

window.addEventListener('resize', () => { renderWorkout(); });

function toggleWorkoutItem(id) {
  const key = getWorkoutKey(currentDate);
  const items = getStorageData(key);
  const updated = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
  setStorageData(key, updated);
  renderWorkout();
}

/* Permanent Delete Single Item */
function deleteWorkoutItem(id) {
  if (confirm('Do you want to permanently delete this exercise?')) {
    const key = getWorkoutKey(currentDate);
    const items = getStorageData(key);
    const filtered = items.filter(item => item.id !== id);
    setStorageData(key, filtered);
    renderWorkout();
  }
}

/* Permanent Delete All Workout Tasks for Current Selected Date */
function clearCurrentDayWorkout() {
  const key = getWorkoutKey(currentDate);
  const items = getStorageData(key);
  if (items.length === 0) return;

  if (confirm(`Do you want to permanently delete all workout data for ${currentDate}?`)) {
    removeStorageData(key);
    renderWorkout();
  }
}

/* Save current list as Master Workout Routine Template */
function saveCurrentWorkoutAsRoutine() {
  const currentItems = getStorageData(getWorkoutKey(currentDate));
  if (currentItems.length === 0) {
    alert('Add at least one exercise before saving!');
    return;
  }

  const templateItems = currentItems.map(item => ({
    name: item.name,
    muscle: item.muscle,
    sets: item.sets,
    reps: item.reps,
    notes: item.notes
  }));

  setStorageData(WORKOUT_ROUTINE_TEMPLATE_KEY, templateItems);
  alert('🎉 The master workout routine template has been saved!');
}

/* Load Master Routine into active date */
function loadWorkoutRoutine() {
  const masterRoutine = getStorageData(WORKOUT_ROUTINE_TEMPLATE_KEY);
  if (masterRoutine.length === 0) {
    alert('No saved workout routine found!');
    return;
  }

  const activeKey = getWorkoutKey(currentDate);
  const existingItems = getStorageData(activeKey);

  if (existingItems.length > 0) {
    if (!confirm(`There are already exercises for this date (${currentDate}). Do you want to load the saved routine?`)) {
      return;
    }
  }

  const newItems = masterRoutine.map((item, index) => ({
    id: Date.now() + index,
    name: item.name,
    muscle: item.muscle,
    sets: item.sets,
    reps: item.reps,
    notes: item.notes,
    completed: false
  }));

  const updatedList = [...existingItems, ...newItems];
  setStorageData(activeKey, updatedList);
  renderWorkout();
}

/* Reset checkmarks */
function resetWorkoutCompletion() {
  const key = getWorkoutKey(currentDate);
  const items = getStorageData(key);

  if (items.length === 0) return;

  const resetList = items.map(item => ({ ...item, completed: false }));
  setStorageData(key, resetList);
  renderWorkout();
}

function downloadWorkoutPDF() {
  const element = document.getElementById('pdf-workout');
  const opt = {
    margin:       [0.4, 0.4, 0.4, 0.4],
    filename:     `Workout_Report_${currentDate}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  const hideElements = element.querySelectorAll('.hide-on-pdf');
  hideElements.forEach(el => el.style.display = 'none');

  html2pdf().set(opt).from(element).save().then(() => {
    hideElements.forEach(el => el.style.display = '');
  });
}