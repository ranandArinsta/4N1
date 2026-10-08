const getDietKey = (date) => `tracker_diet_${date}`;
const ROUTINE_TEMPLATE_KEY = 'tracker_diet_master_routine';

document.addEventListener('DOMContentLoaded', () => {
  const dietForm = document.getElementById('dietForm');
  if (dietForm) {
    dietForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('dietMealName').value.trim();
      const category = document.getElementById('dietCategory').value;
      const calories = parseFloat(document.getElementById('dietCalories').value) || 0;
      const protein = parseFloat(document.getElementById('dietProtein').value) || 0;
      const notes = document.getElementById('dietNotes').value.trim();

      if (!name) return;

      const newItem = { id: Date.now(), name, category, calories, protein, notes, completed: false };
      const items = getStorageData(getDietKey(currentDate));
      items.push(newItem);
      setStorageData(getDietKey(currentDate), items);

      e.target.reset();
      closeDietModal();
      renderDiet();
    });
  }
});

/* Modal Controls */
function openDietModal() {
  const modal = document.getElementById('dietModalOverlay');
  if (modal) modal.classList.add('active');
}

function closeDietModal() {
  const modal = document.getElementById('dietModalOverlay');
  if (modal) modal.classList.remove('active');
}

/* Render Diet Items */
function renderDiet() {
  const items = getStorageData(getDietKey(currentDate));
  const tbody = document.getElementById('dietList');
  if (!tbody) return;

  tbody.innerHTML = '';
  let totalCal = 0;
  let totalProt = 0;
  let completedCount = 0;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-msg"><strong>Add Meal / Food Item</strong> </td></tr>`;
  } else {
    items.forEach(item => {
      if (item.completed) completedCount++;
      totalCal += item.calories;
      totalProt += item.protein;

      const tr = document.createElement('tr');
      if (item.completed) tr.classList.add('completed-row');

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        tr.innerHTML = `
          <td>
            <div class="mobile-card-header">
              <input type="checkbox" class="mobile-card-checkbox" ${item.completed ? 'checked' : ''} onchange="toggleDietItem(${item.id})">
              <span>${escapeHtml(item.name)}</span>
            </div>
            <span class="badge-tag">${item.category}</span>
          </td>
          ${item.notes ? `<td style="font-size:0.85rem; color:var(--text-muted);">${escapeHtml(item.notes)}</td>` : ''}
          <td>
            <div class="mobile-card-macros">
              <span class="macro-cal"><i class="fa-solid fa-fire"></i> ${item.calories} kcal</span>
              <span class="macro-prot"><i class="fa-solid fa-drumstick-bite"></i> ${item.protein}g Protein</span>
            </div>
          </td>
          <td class="hide-on-pdf" style="justify-content: flex-end;">
            <button class="btn-del" onclick="deleteDietItem(${item.id})" title="Permanently Delete"><i class="fa-solid fa-trash"></i> Delete Entry</button>
          </td>
        `;
      } else {
        tr.innerHTML = `
          <td>
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleDietItem(${item.id})">
          </td>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.notes ? `<br><small style="color:var(--text-muted);">${escapeHtml(item.notes)}</small>` : ''}
          </td>
          <td><span class="badge-tag">${item.category}</span></td>
          <td>${item.calories} kcal</td>
          <td>${item.protein} g</td>
          <td class="hide-on-pdf">
            <button class="btn-del" onclick="deleteDietItem(${item.id})" title="Permanently Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;
      }

      tbody.appendChild(tr);
    });
  }

  document.getElementById('dietTotalCalories').innerText = `${totalCal} kcal`;
  document.getElementById('dietTotalProtein').innerText = `${totalProt} g`;
  document.getElementById('dietCompletedCount').innerText = `${completedCount} / ${items.length}`;
}

window.addEventListener('resize', () => { renderDiet(); });

function toggleDietItem(id) {
  const key = getDietKey(currentDate);
  const items = getStorageData(key);
  const updated = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
  setStorageData(key, updated);
  renderDiet();
}

/* Permanent Delete Single Item */
function deleteDietItem(id) {
  if (confirm('Do you want to permanently delete this meal item?')) {
    const key = getDietKey(currentDate);
    const items = getStorageData(key);
    const filtered = items.filter(item => item.id !== id);
    setStorageData(key, filtered);
    renderDiet();
  }
}

/* Permanent Delete All Items for Current Selected Date */
function clearCurrentDayDiet() {
  const key = getDietKey(currentDate);
  const items = getStorageData(key);
  if (items.length === 0) return;

  if (confirm(`Do you want to permanently delete the diet entries for ${currentDate}?`)) {
    removeStorageData(key);
    renderDiet();
  }
}

function saveCurrentDietAsRoutine() {
  const currentItems = getStorageData(getDietKey(currentDate));
  if (currentItems.length === 0) {
    alert('To save, please add at least one diet meal first!');
    return;
  }

  const templateItems = currentItems.map(item => ({
    name: item.name,
    category: item.category,
    calories: item.calories,
    protein: item.protein,
    notes: item.notes
  }));

  setStorageData(ROUTINE_TEMPLATE_KEY, templateItems);
  alert('🎉 The daily diet routine template has been saved!');
}

function loadDietRoutine() {
  const masterRoutine = getStorageData(ROUTINE_TEMPLATE_KEY);
  if (masterRoutine.length === 0) {
    alert('No saved routine found!');
    return;
  }

  const activeKey = getDietKey(currentDate);
  const existingItems = getStorageData(activeKey);

  if (existingItems.length > 0) {
    if (!confirm(`There are already entries for this date (${currentDate}). Do you want to load the saved routine?`)) {
      return;
    }
  }

  const newItems = masterRoutine.map((item, index) => ({
    id: Date.now() + index,
    name: item.name,
    category: item.category,
    calories: item.calories,
    protein: item.protein,
    notes: item.notes,
    completed: false
  }));

  const updatedList = [...existingItems, ...newItems];
  setStorageData(activeKey, updatedList);
  renderDiet();
}

function resetDietCompletion() {
  const key = getDietKey(currentDate);
  const items = getStorageData(key);

  if (items.length === 0) return;

  const resetList = items.map(item => ({ ...item, completed: false }));
  setStorageData(key, resetList);
  renderDiet();
}

function downloadDietPDF() {
  const element = document.getElementById('pdf-diet');
  const opt = {
    margin:       [0.4, 0.4, 0.4, 0.4],
    filename:     `Diet_Report_${currentDate}.pdf`,
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