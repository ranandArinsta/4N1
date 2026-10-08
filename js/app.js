// Global State Variable for Date & Tab Management
let currentDate = new Date().toISOString().split('T')[0];
const ACTIVE_TAB_KEY = 'tracker_active_tab';

// Storage Helper Functions
function getStorageData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setStorageData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function removeStorageData(key) {
  localStorage.removeItem(key);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupDatePicker();
  
  // Render modules
  if (typeof renderDiet === 'function') renderDiet();
  if (typeof renderWorkout === 'function') renderWorkout();
  if (typeof renderStudy === 'function') renderStudy();
});

// Tab Navigation Logic
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  const savedTab = localStorage.getItem(ACTIVE_TAB_KEY) || 'diet';
  switchTab(savedTab);

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
      if (navMenu) navMenu.classList.remove('show');
    });
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }
}

function switchTab(tabName) {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  localStorage.setItem(ACTIVE_TAB_KEY, tabName);

  navBtns.forEach(b => {
    if (b.getAttribute('data-tab') === tabName) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  tabContents.forEach(c => {
    if (c.id === `section-${tabName}`) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
}

// Date Selector Logic
function setupDatePicker() {
  const datePicker = document.getElementById('globalDatePicker');
  const btnToday = document.getElementById('btnToday');
  const btnTomorrow = document.getElementById('btnTomorrow');

  if (datePicker) {
    datePicker.value = currentDate;
    datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        currentDate = e.target.value;
        refreshAllSections();
      }
    });
  }

  if (btnToday) {
    btnToday.addEventListener('click', () => {
      currentDate = new Date().toISOString().split('T')[0];
      if (datePicker) datePicker.value = currentDate;
      refreshAllSections();
    });
  }

  if (btnTomorrow) {
    btnTomorrow.addEventListener('click', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      currentDate = tomorrow.toISOString().split('T')[0];
      if (datePicker) datePicker.value = currentDate;
      refreshAllSections();
    });
  }
}

function refreshAllSections() {
  if (typeof renderDiet === 'function') renderDiet();
  if (typeof renderWorkout === 'function') renderWorkout();
  if (typeof renderStudy === 'function') renderStudy();
}

/* Master Reset Function */
function clearAllAppData() {
  if (confirm('⚠️ WARNING: Do you want to permanently delete all data from the entire application (diet, workout, study, and routine templates)? This action cannot be undone!')) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('tracker_')) {
        localStorage.removeItem(key);
      }
    });
    alert('The entire history has been permanently deleted.');
    refreshAllSections();
  }
}

/* Data Backup & Export (JSON Download) */
function exportBackupData() {
  const backupObject = {};
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('tracker_')) {
      backupObject[key] = localStorage.getItem(key);
    }
  });

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObject, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `Routine_Tracker_Backup_${currentDate}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/* Data Restore & Import (JSON File Upload) */
function importBackupData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (typeof importedData !== 'object' || importedData === null) {
        throw new Error('Invalid JSON format');
      }

      if (confirm('Do you want to restore data from this backup? Current data will be overwritten.')) {
        Object.keys(importedData).forEach(key => {
          if (key.startsWith('tracker_')) {
            localStorage.setItem(key, importedData[key]);
          }
        });
        alert('🎉 Data restored successfully!');
        refreshAllSections();
      }
    } catch (err) {
      alert('Error reading backup file! Please select a valid JSON backup file.');
    }
  };
  reader.readAsText(file);
}