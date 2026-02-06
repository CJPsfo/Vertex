const highlight = document.querySelector(".highlight");
const syncButton = document.querySelector('[data-action="sync"]');
const focusButton = document.querySelector('[data-action="focus"]');
const lastSync = document.querySelector("#last-sync");
const syncStatus = document.querySelector("#sync-status");
const intakeList = document.querySelector("#intake-list");
const timeline = document.querySelector("#timeline");
const planner = document.querySelector(".planner");
const blockList = document.querySelector("#block-list");
const revealItems = document.querySelectorAll(".reveal");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarTabs = document.querySelectorAll("[data-view]");
const profileName = document.querySelector("#profile-name");
const logoutButton = document.querySelector("#logout");
const navLinks = document.querySelectorAll(".sidebar nav a");
const requiresAuth = document.body.classList.contains("requires-auth");
const focusModal = document.querySelector("#focus-modal");
const focusForm = document.querySelector("#focus-form");
const focusIdField = document.querySelector("#focus-id");
const focusStatus = document.querySelector("#focus-status");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const calendarCells = {
  day: ["Today"],
  week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month: [
    "Week 1",
    "Week 2",
    "Week 3",
    "Week 4",
    "Week 5",
    "Week 6",
    "Week 7",
  ],
  year: ["Q1", "Q2", "Q3", "Q4"],
};

const levelThreshold = {
  day: ["high", "medium", "low"],
  week: ["high", "medium"],
  month: ["high", "medium"],
  year: ["high"],
};

let currentView = "day";
const STORAGE_KEY = "vertex_focus_blocks";

const loadBlocks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const saveBlocks = (blocks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
};

let focusBlocks = loadBlocks();

const renderCalendar = (view) => {
  if (!calendarGrid) {
    return;
  }

  currentView = view;
  calendarGrid.className = `calendar-grid view-${view}`;
  calendarGrid.innerHTML = "";

  const buckets = {};
  calendarCells[view].forEach((label) => {
    buckets[label] = [];
  });

  const mapToBucket = (block) => {
    if (!block?.date) {
      return calendarCells[view][0];
    }
    const date = new Date(block.date);
    if (Number.isNaN(date.getTime())) {
      return calendarCells[view][0];
    }

    if (view === "day") {
      return calendarCells[view][0];
    }
    if (view === "week") {
      return calendarCells.week[date.getDay() === 0 ? 6 : date.getDay() - 1];
    }
    if (view === "month") {
      const weekIndex = Math.min(6, Math.floor((date.getDate() - 1) / 7));
      return calendarCells.month[weekIndex];
    }
    if (view === "year") {
      const quarter = Math.floor(date.getMonth() / 3);
      return calendarCells.year[quarter];
    }
    return calendarCells[view][0];
  };

  focusBlocks.forEach((block) => {
    if (!levelThreshold[view].includes(block.priority)) {
      return;
    }
    const bucket = mapToBucket(block);
    buckets[bucket]?.push(block);
  });

  calendarCells[view].forEach((label) => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const title = document.createElement("div");
    title.className = "cell-label";
    title.textContent = label;
    cell.appendChild(title);

    const items = buckets[label] || [];

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "calendar-item low";
      empty.textContent = "No focus blocks yet";
      cell.appendChild(empty);
    } else {
      items.forEach((item) => {
        const entry = document.createElement("div");
        entry.className = `calendar-item ${item.priority}`;
        entry.textContent = item.title;
        cell.appendChild(entry);
      });
    }

    calendarGrid.appendChild(cell);
  });
};

if (calendarGrid && calendarTabs.length) {
  calendarTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      calendarTabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      renderCalendar(tab.dataset.view);
    });
  });

  renderCalendar("day");
}

const setSyncFeedback = (message) => {
  if (syncStatus) {
    syncStatus.textContent = message;
    return;
  }

  if (!syncButton) {
    return;
  }

  const original = syncButton.textContent;
  syncButton.textContent = "Synced";
  setTimeout(() => {
    syncButton.textContent = original;
  }, 1200);
};

if (revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((el) => observer.observe(el));
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

const ensureSession = () => {
  if (!requiresAuth) {
    return;
  }

  const raw = localStorage.getItem("vertex_demo_auth");
  if (!raw) {
    window.location.href = "login.html";
    return;
  }

  try {
    const payload = JSON.parse(raw);
    if (profileName) {
      profileName.textContent = payload.email || "Demo User";
    }
  } catch (error) {
    localStorage.removeItem("vertex_demo_auth");
    window.location.href = "login.html";
  }
};

logoutButton?.addEventListener("click", () => {
  localStorage.removeItem("vertex_demo_auth");
  window.location.href = "login.html";
});

syncButton?.addEventListener("click", () => {
  syncButton.textContent = "Syncing...";
  syncButton.disabled = true;

  setTimeout(() => {
    const now = new Date();
    if (lastSync) {
      lastSync.textContent = "Last sync: just now";
    }

    setSyncFeedback("Last intake: just now");

    if (intakeList) {
      const item = document.createElement("li");
      item.textContent = `Availability sync · ${formatTime(now)}`;
      intakeList.prepend(item);
    }

    syncButton.textContent = "Sync Inputs";
    syncButton.disabled = false;
  }, 700);
});

const openModal = (block) => {
  if (!focusModal || !focusForm) {
    return;
  }

  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const dateValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
  const timeValue = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  if (block) {
    focusForm.title.value = block.title;
    focusForm.date.value = block.date || dateValue;
    focusForm.time.value = block.time || timeValue;
    focusForm.duration.value = block.duration || 60;
    focusForm.priority.value = block.priority || "medium";
    focusForm.notes.value = block.notes || "";
    if (focusIdField) {
      focusIdField.value = block.id;
    }
    focusStatus.textContent = "Update your focus block details.";
  } else {
    focusForm.reset();
    focusForm.date.value = dateValue;
    focusForm.time.value = timeValue;
    if (focusIdField) {
      focusIdField.value = "";
    }
    focusStatus.textContent = "Blocks appear immediately in your timeline.";
  }

  focusModal.classList.add("open");
  focusModal.setAttribute("aria-hidden", "false");
};

focusButton?.addEventListener("click", () => openModal());

setTimeout(() => {
  highlight?.classList.add("pulse");
}, 500);

ensureSession();

const closeModal = () => {
  if (!focusModal) {
    return;
  }
  focusModal.classList.remove("open");
  focusModal.setAttribute("aria-hidden", "true");
};

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

focusModal?.addEventListener("click", (event) => {
  if (event.target?.classList.contains("modal-backdrop")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && focusModal?.classList.contains("open")) {
    closeModal();
  }
});

const renderTimeline = () => {
  if (!timeline) {
    return;
  }
  timeline.innerHTML = "";
  if (!focusBlocks.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No focus blocks yet.";
    timeline.appendChild(empty);
    return;
  }

  focusBlocks.forEach((item) => {
    const row = document.createElement("div");
    row.classList.add("new");

    const timeStamp = document.createElement("span");
    timeStamp.textContent = item.time;

    const label = document.createElement("strong");
    label.textContent = `${item.title} · ${item.duration}m`;

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(item));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteBlock(item.id));

    actions.append(edit, remove);
    row.append(timeStamp, label, actions);
    timeline.appendChild(row);
  });
};

const renderPlanner = () => {
  if (!planner) {
    return;
  }
  planner.innerHTML = "";
  if (!focusBlocks.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No focus blocks scheduled yet.";
    planner.appendChild(empty);
    return;
  }

  focusBlocks.forEach((item) => {
    const plannerItem = document.createElement("div");
    plannerItem.className = "block-item";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "block-meta";
    meta.textContent = `${item.date} · ${item.time} · ${item.duration}m · ${item.priority.toUpperCase()}`;

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(item));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteBlock(item.id));

    actions.append(edit, remove);
    plannerItem.append(title, meta, actions);
    planner.appendChild(plannerItem);
  });
};

const renderBlockList = () => {
  if (!blockList) {
    return;
  }
  blockList.innerHTML = "";
  if (!focusBlocks.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No focus blocks scheduled yet.";
    blockList.appendChild(empty);
    return;
  }

  focusBlocks.forEach((item) => {
    const entry = document.createElement("div");
    entry.className = "block-item";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "block-meta";
    meta.textContent = `${item.date} · ${item.time} · ${item.duration}m · ${item.priority.toUpperCase()}`;

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(item));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteBlock(item.id));

    actions.append(edit, remove);
    entry.append(title, meta, actions);
    blockList.appendChild(entry);
  });
};

const renderAll = () => {
  renderTimeline();
  renderPlanner();
  renderBlockList();
  renderCalendar(currentView);
};

const deleteBlock = (id) => {
  focusBlocks = focusBlocks.filter((block) => block.id !== id);
  saveBlocks(focusBlocks);
  renderAll();
};

focusForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = focusForm.title.value.trim() || "Focus Block";
  const date = focusForm.date.value;
  const time = focusForm.time.value;
  const duration = focusForm.duration.value;
  const priority = focusForm.priority.value;
  const notes = focusForm.notes.value.trim();

  const block = {
    id: focusIdField?.value || crypto.randomUUID?.() || String(Date.now()),
    title,
    date,
    time: time || formatTime(new Date()),
    duration,
    priority,
    notes,
    createdAt: Date.now(),
  };

  const existingIndex = focusBlocks.findIndex((item) => item.id === block.id);
  if (existingIndex >= 0) {
    focusBlocks[existingIndex] = { ...focusBlocks[existingIndex], ...block };
  } else {
    focusBlocks.unshift(block);
  }

  saveBlocks(focusBlocks);
  renderAll();

  focusStatus.textContent = notes
    ? "Focus block added with notes."
    : "Focus block added.";
  focusForm.reset();
  closeModal();
});

renderAll();
