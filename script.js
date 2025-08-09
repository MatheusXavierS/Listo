const STORAGE_KEY = "listoFolders_v1";
const SELECTED_KEY = "listoSelected_v1";

let folders = {};
let selectedFolderId = null;

const el = {
  addFolderBtn: document.getElementById("add-folder-btn"),
  sidebar: document.getElementById("sidebar"),
  folderList: document.getElementById("folder-list"),
  apresentacao: document.getElementById("apresentacao"),
  taskList: document.getElementById("task-list"),
  modal: document.getElementById("folder-modal"),
  newFolderName: document.getElementById("new-folder-name"),
  confirmCreateFolder: document.getElementById("confirm-create-folder"),
  cancelCreateFolder: document.getElementById("cancel-create-folder"),
  yearSpan: document.getElementById("year"),
};

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ])
  );
}
function uid(prefix = "id") {
  return (
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  localStorage.setItem(SELECTED_KEY, selectedFolderId || "");
}
function load() {
  try {
    folders = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    selectedFolderId = localStorage.getItem(SELECTED_KEY) || null;
    if (selectedFolderId && !folders[selectedFolderId]) selectedFolderId = null;
  } catch {
    folders = {};
    selectedFolderId = null;
  }
}

function renderNav() {
  el.folderList.innerHTML = "";
  const keys = Object.keys(folders);
  if (keys.length === 0) {
    el.sidebar.style.display = "none";
    el.apresentacao.style.display = "block";
    el.taskList.style.display = "none";
    return;
  }
  el.sidebar.style.display = "block";
  el.apresentacao.style.display = "none";
  keys.forEach((id) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "folder-btn";
    if (id === selectedFolderId) btn.classList.add("active");
    btn.dataset.id = id;
    btn.innerHTML = `${escapeHtml(folders[id].name)} <small>(${
      folders[id].tasks.length
    })</small>`;
    btn.onclick = () => selectFolder(id);
    const del = document.createElement("button");
    del.className = "delete-folder";
    del.textContent = "✖";
    del.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Excluir "${folders[id].name}"?`)) deleteFolder(id);
    };
    li.append(btn, del);
    el.folderList.appendChild(li);
  });
}

function selectFolder(id) {
  selectedFolderId = id;
  save();
  renderNav();
  renderTaskList();
}
function renderTaskList() {
  if (!selectedFolderId || !folders[selectedFolderId]) {
    el.taskList.style.display = "none";
    return;
  }
  const folder = folders[selectedFolderId];
  el.taskList.style.display = "block";
  el.taskList.innerHTML = `
    <header>
      <h2>${escapeHtml(folder.name)}</h2>
      <div>
        <button id="rename-folder" class="btn secondary">Renomear</button>
        <button id="delete-folder-top" class="btn" style="background:#cc3b3b;color:#fff">Excluir</button>
      </div>
    </header>
    <div class="add-task">
      <input id="new-task-text" placeholder="Nova tarefa..." />
      <button id="add-task-btn">Adicionar</button>
    </div>
    ${
      folder.tasks.length === 0
        ? '<p class="empty">Nenhuma tarefa nesta pasta ainda.</p>'
        : `<ul class="tasks">${folder.tasks
            .map(
              (t) => `
        <li data-task-id="${t.id}">
          <label><input type="checkbox" class="task-checkbox" ${
            t.done ? "checked" : ""
          }/> <span class="task-text">${escapeHtml(t.text)}</span></label>
          <button class="delete-task">Excluir</button>
        </li>`
            )
            .join("")}</ul>`
    }
  `;
  document.getElementById("add-task-btn").onclick = () => {
    const txt = document.getElementById("new-task-text").value.trim();
    if (txt) {
      addTask(txt);
      document.getElementById("new-task-text").value = "";
    }
  };
  document.getElementById("new-task-text").onkeydown = (e) => {
    if (e.key === "Enter") document.getElementById("add-task-btn").click();
  };
  el.taskList.querySelectorAll(".delete-task").forEach(
    (btn) =>
      (btn.onclick = (e) => {
        deleteTask(e.target.closest("li").dataset.taskId);
      })
  );
  el.taskList
    .querySelectorAll(".task-checkbox")
    .forEach(
      (chk) =>
        (chk.onchange = (e) =>
          toggleTask(e.target.closest("li").dataset.taskId, e.target.checked))
    );
  document.getElementById("delete-folder-top").onclick = () => {
    if (confirm(`Excluir "${folder.name}"?`)) deleteFolder(selectedFolderId);
  };
  document.getElementById("rename-folder").onclick = () => {
    const novo = prompt("Nome da pasta:", folder.name);
    if (novo && novo.trim()) {
      folder.name = novo.trim();
      save();
      renderNav();
      renderTaskList();
    }
  };
}

function addTask(text) {
  folders[selectedFolderId].tasks.push({ id: uid("t"), text, done: false });
  save();
  renderNav();
  renderTaskList();
}
function toggleTask(taskId, done) {
  const t = folders[selectedFolderId].tasks.find((x) => x.id === taskId);
  if (t) {
    t.done = done;
    save();
    renderNav();
  }
}
function deleteTask(taskId) {
  folders[selectedFolderId].tasks = folders[selectedFolderId].tasks.filter(
    (x) => x.id !== taskId
  );
  save();
  renderNav();
  renderTaskList();
}
function deleteFolder(id) {
  delete folders[id];
  if (selectedFolderId === id) selectedFolderId = null;
  save();
  renderNav();
  renderTaskList();
}

function openModal() {
  el.modal.classList.add("open");
  el.newFolderName.value = "";
  setTimeout(() => el.newFolderName.focus(), 100);
}
function closeModal() {
  el.modal.classList.remove("open");
}
el.addFolderBtn.onclick = openModal;
el.cancelCreateFolder.onclick = closeModal;
el.confirmCreateFolder.onclick = () => {
  const name = el.newFolderName.value.trim();
  if (!name) return alert("Digite um nome.");
  const id = uid("f");
  folders[id] = { id, name, tasks: [] };
  selectedFolderId = id;
  save();
  closeModal();
  renderNav();
  renderTaskList();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && el.modal.classList.contains("open")) closeModal();
});

(function init() {
  el.yearSpan.textContent = new Date().getFullYear();
  load();
  renderNav();
  if (selectedFolderId) renderTaskList();
})();
