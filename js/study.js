const getStudyKey = (date) => `tracker_study_${date}`;
const STUDY_ROUTINE_TEMPLATE_KEY = 'tracker_study_master_routine';

document.addEventListener('DOMContentLoaded', () => {
  const studyForm = document.getElementById('studyForm');
  if (studyForm) {
    studyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = document.getElementById('studySubject').value.trim();
      const priority = document.getElementById('studyPriority').value;
      const hours = parseFloat(document.getElementById('studyHours').value) || 0;
      const topic = document.getElementById('studyTopic').value.trim();

      if (!subject || !topic) return;

      const newItem = { id: Date.now(), subject, priority, hours, topic, completed: false };
      const items = getStorageData(getStudyKey(currentDate));
      items.push(newItem);
      setStorageData(getStudyKey(currentDate), items);

      e.target.reset();
      closeStudyModal();
      renderStudy();
    });
  }
});

/* Modal Controls */
function openStudyModal() {
  const modal = document.getElementById('studyModalOverlay');
  if (modal) modal.classList.add('active');
}

function closeStudyModal() {
  const modal = document.getElementById('studyModalOverlay');
  if (modal) modal.classList.remove('active');
}

/* Render Study Items with Responsive Mobile Card / Table logic */
function renderStudy() {
  const items = getStorageData(getStudyKey(currentDate));
  const tbody = document.getElementById('studyList');
  if (!tbody) return;

  tbody.innerHTML = '';
  let completedCount = 0;
  let totalHours = 0;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg"><strong>Add Study Task</strong> or <strong>Load Saved Routine</strong> </td></tr>`;
  } else {
    items.forEach(item => {
      if (item.completed) completedCount++;
      totalHours += item.hours || 0;

      let pBadge = 'bg-p-med';
      if (item.priority === 'High') pBadge = 'bg-p-high';
      if (item.priority === 'Low') pBadge = 'bg-p-low';

      const tr = document.createElement('tr');
      if (item.completed) tr.classList.add('completed-row');

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Mobile Responsive Layout
        tr.innerHTML = `
          <td>
            <div class="mobile-card-header">
              <input type="checkbox" class="mobile-card-checkbox" ${item.completed ? 'checked' : ''} onchange="toggleStudyItem(${item.id})">
              <span>${escapeHtml(item.subject)}</span>
            </div>
            <span class="badge ${pBadge}">${item.priority}</span>
          </td>
          <td style="font-size:0.9rem;">${escapeHtml(item.topic)}</td>
          <td>
            <div class="mobile-card-macros">
              <span><i class="fa-solid fa-clock"></i> Target: ${item.hours || 0} hrs</span>
            </div>
          </td>
          <td class="hide-on-pdf" style="justify-content: flex-end;">
            <button class="btn-del" onclick="deleteStudyItem(${item.id})" title="Permanently Delete"><i class="fa-solid fa-trash"></i> Delete Task</button>
          </td>
        `;
      } else {
        // Desktop Table Layout
        tr.innerHTML = `
          <td>
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleStudyItem(${item.id})">
          </td>
          <td><strong>${escapeHtml(item.subject)}</strong></td>
          <td>${escapeHtml(item.topic)}</td>
          <td><span class="badge ${pBadge}">${item.priority}</span></td>
          <td>${item.hours || 0} hrs</td>
          <td class="hide-on-pdf">
            <button class="btn-del" onclick="deleteStudyItem(${item.id})" title="Permanently Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;
      }

      tbody.appendChild(tr);
    });
  }

  document.getElementById('studyTotalCount').innerText = items.length;
  document.getElementById('studyTotalHours').innerText = `${totalHours} hrs`;
  document.getElementById('studyCompletedCount').innerText = `${completedCount} / ${items.length}`;
}

window.addEventListener('resize', () => { renderStudy(); });

function toggleStudyItem(id) {
  const key = getStudyKey(currentDate);
  const items = getStorageData(key);
  const updated = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
  setStorageData(key, updated);
  renderStudy();
}

/* Permanent Delete Single Task */
function deleteStudyItem(id) {
  if (confirm('Do you want to permanently delete this study task?')) {
    const key = getStudyKey(currentDate);
    const items = getStorageData(key);
    const filtered = items.filter(item => item.id !== id);
    setStorageData(key, filtered);
    renderStudy();
  }
}

/* Permanent Delete All Study Tasks for Current Selected Date */
function clearCurrentDayStudy() {
  const key = getStudyKey(currentDate);
  const items = getStorageData(key);
  if (items.length === 0) return;

  if (confirm(`Do you want to permanently delete all study tasks for ${currentDate}?`)) {
    removeStorageData(key);
    renderStudy();
  }
}

/* Save current list as Master Study Routine Template */
function saveCurrentStudyAsRoutine() {
  const currentItems = getStorageData(getStudyKey(currentDate));
  if (currentItems.length === 0) {
    alert('Add at least one study task before saving!');
    return;
  }

  const templateItems = currentItems.map(item => ({
    subject: item.subject,
    priority: item.priority,
    hours: item.hours,
    topic: item.topic
  }));

  setStorageData(STUDY_ROUTINE_TEMPLATE_KEY, templateItems);
  alert('🎉 The master study routine template has been saved!');
}

/* Load Master Routine into active date */
function loadStudyRoutine() {
  const masterRoutine = getStorageData(STUDY_ROUTINE_TEMPLATE_KEY);
  if (masterRoutine.length === 0) {
    alert('No saved study routine found!');
    return;
  }

  const activeKey = getStudyKey(currentDate);
  const existingItems = getStorageData(activeKey);

  if (existingItems.length > 0) {
    if (!confirm(`There are already study tasks for this date (${currentDate}). Do you want to load the saved routine?`)) {
      return;
    }
  }

  const newItems = masterRoutine.map((item, index) => ({
    id: Date.now() + index,
    subject: item.subject,
    priority: item.priority,
    hours: item.hours,
    topic: item.topic,
    completed: false
  }));

  const updatedList = [...existingItems, ...newItems];
  setStorageData(activeKey, updatedList);
  renderStudy();
}

/* Reset checkmarks */
function resetStudyCompletion() {
  const key = getStudyKey(currentDate);
  const items = getStorageData(key);

  if (items.length === 0) return;

  const resetList = items.map(item => ({ ...item, completed: false }));
  setStorageData(key, resetList);
  renderStudy();
}

function downloadStudyPDF() {
  const element = document.getElementById('pdf-study');
  const opt = {
    margin:       [0.4, 0.4, 0.4, 0.4],
    filename:     `Study_Report_${currentDate}.pdf`,
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