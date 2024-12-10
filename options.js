// Sauvegarde les options
function saveOptions() {
  const examMode = document.getElementById('examMode').checked;
  chrome.storage.sync.set(
    { examMode: examMode },
    function() {
      const status = document.getElementById('status');
      status.textContent = 'Options sauvegardées.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    }
  );
}

// Restaure les options sauvegardées
function restoreOptions() {
  chrome.storage.sync.get(
    { examMode: false }, // false par défaut
    function(items) {
      document.getElementById('examMode').checked = items.examMode;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('examMode').addEventListener('change', saveOptions); 