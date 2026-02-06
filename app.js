const highlight = document.querySelector(".highlight");
const syncButton = document.querySelector('[data-action="sync"]');
const focusButton = document.querySelector('[data-action="focus"]');
const assignmentButtons = document.querySelectorAll('[data-action="assignment"]');
const lastSync = document.querySelector("#last-sync");
const syncStatus = document.querySelector("#sync-status");
const intakeList = document.querySelector("#intake-list");
const timeline = document.querySelector("#timeline");
const planner = document.querySelector(".planner");
const blockList = document.querySelector("#block-list");
const assignmentList = document.querySelector("#assignment-list");
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
const focusAssignment = document.querySelector("#focus-assignment");
const focusCompleted = document.querySelector("#focus-completed");
const focusStatus = document.querySelector("#focus-status");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
const assignmentModal = document.querySelector("#assignment-modal");
const assignmentForm = document.querySelector("#assignment-form");
const assignmentIdField = document.querySelector("#assignment-id");
const assignmentStatus = document.querySelector("#assignment-status");
const assignmentCloseButtons = document.querySelectorAll("[data-assignment-close]");

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
const ASSIGNMENT_KEY = "vertex_assignments";

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

const loadAssignments = () => {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const saveAssignments = (assignments) => {
  localStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(assignments));
};

let assignments = loadAssignments();

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
        if (item.completed) {
          entry.classList.add("completed");
        }
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

  renderAssignmentOptions();

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
    if (focusAssignment) {
      focusAssignment.value = block.assignmentId || "";
    }
    if (focusCompleted) {
      focusCompleted.checked = Boolean(block.completed);
    }
    if (focusIdField) {
      focusIdField.value = block.id;
    }
    focusStatus.textContent = "Update your focus block details.";
  } else {
    focusForm.reset();
    focusForm.date.value = dateValue;
    focusForm.time.value = timeValue;
    if (focusAssignment) {
      focusAssignment.value = "";
    }
    if (focusCompleted) {
      focusCompleted.checked = false;
    }
    if (focusIdField) {
      focusIdField.value = "";
    }
    focusStatus.textContent = "Blocks appear immediately in your timeline.";
  }

  focusModal.classList.add("open");
  focusModal.setAttribute("aria-hidden", "false");
};

focusButton?.addEventListener("click", () => openModal());

const openAssignmentModal = (assignment) => {
  if (!assignmentModal || !assignmentForm) {
    return;
  }

  closeModal();

  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const dateValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;

  if (assignment) {
    assignmentForm.title.value = assignment.title;
    assignmentForm.due.value = assignment.due || dateValue;
    assignmentForm.hours.value = assignment.hours || 4;
    if (assignmentIdField) {
      assignmentIdField.value = assignment.id;
    }
    assignmentStatus.textContent = "Update assignment details.";
  } else {
    assignmentForm.reset();
    assignmentForm.due.value = dateValue;
    if (assignmentIdField) {
      assignmentIdField.value = "";
    }
    assignmentStatus.textContent = "Assignments sync across all pages.";
  }

  assignmentModal.classList.add("open");
  assignmentModal.setAttribute("aria-hidden", "false");
};

assignmentButtons.forEach((button) => {
  button.addEventListener("click", () => openAssignmentModal());
});

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

const closeAssignmentModal = () => {
  if (!assignmentModal) {
    return;
  }
  assignmentModal.classList.remove("open");
  assignmentModal.setAttribute("aria-hidden", "true");
};

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

assignmentCloseButtons.forEach((button) => {
  button.addEventListener("click", closeAssignmentModal);
});

focusModal?.addEventListener("click", (event) => {
  if (event.target?.classList.contains("modal-backdrop")) {
    closeModal();
  }
});

assignmentModal?.addEventListener("click", (event) => {
  if (event.target?.classList.contains("modal-backdrop")) {
    closeAssignmentModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && focusModal?.classList.contains("open")) {
    closeModal();
  }
  if (event.key === "Escape" && assignmentModal?.classList.contains("open")) {
    closeAssignmentModal();
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
    row.classList.toggle("is-complete", Boolean(item.completed));

    const timeStamp = document.createElement("span");
    timeStamp.textContent = item.time;

    const label = document.createElement("strong");
    label.textContent = `${item.title} · ${item.duration}m${
      item.assignmentTitle ? ` · ${item.assignmentTitle}` : ""
    }`;

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = item.completed ? "Undo" : "Complete";
    toggle.addEventListener("click", () => toggleBlockCompletion(item.id));

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(item));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteBlock(item.id));

    actions.append(toggle, edit, remove);
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
    plannerItem.classList.toggle("is-complete", Boolean(item.completed));

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "block-meta";
    meta.textContent = `${item.date} · ${item.time} · ${item.duration}m · ${item.priority.toUpperCase()}${
      item.assignmentTitle ? ` · ${item.assignmentTitle}` : ""
    }`;

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = item.completed ? "Undo" : "Complete";
    toggle.addEventListener("click", () => toggleBlockCompletion(item.id));

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(item));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteBlock(item.id));

    actions.append(toggle, edit, remove);
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
    entry.classList.toggle("is-complete", Boolean(item.completed));

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "block-meta";
    meta.textContent = `${item.date} · ${item.time} · ${item.duration}m · ${item.priority.toUpperCase()}${
      item.assignmentTitle ? ` · ${item.assignmentTitle}` : ""
    }`;

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = item.completed ? "Undo" : "Complete";
    toggle.addEventListener("click", () => toggleBlockCompletion(item.id));

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openModal(item));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteBlock(item.id));

    actions.append(toggle, edit, remove);
    entry.append(title, meta, actions);
    blockList.appendChild(entry);
  });
};

const renderAssignmentOptions = () => {
  if (!focusAssignment) {
    return;
  }
  focusAssignment.innerHTML = "";
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "No assignment";
  focusAssignment.appendChild(emptyOption);

  assignments.forEach((assignment) => {
    const option = document.createElement("option");
    option.value = assignment.id;
    option.textContent = assignment.title;
    focusAssignment.appendChild(option);
  });
};

const renderAssignmentList = () => {
  if (!assignmentList) {
    return;
  }
  assignmentList.innerHTML = "";
  if (!assignments.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No assignments yet.";
    assignmentList.appendChild(empty);
    return;
  }

  assignments.forEach((assignment) => {
    const totalMinutes = focusBlocks
      .filter((block) => block.assignmentId === assignment.id)
      .reduce((sum, block) => sum + Number(block.duration || 0), 0);
    const completedMinutes = focusBlocks
      .filter((block) => block.assignmentId === assignment.id && block.completed)
      .reduce((sum, block) => sum + Number(block.duration || 0), 0);
    const estimatedMinutes = Number(assignment.hours || 0) * 60;
    const completionPct =
      estimatedMinutes > 0
        ? Math.min(100, Math.round((completedMinutes / estimatedMinutes) * 100))
        : 0;

    const card = document.createElement("div");
    card.className = "assignment-card";
    if (completionPct === 100 && totalMinutes > 0) {
      card.classList.add("is-complete");
    }

    const title = document.createElement("h4");
    title.textContent = assignment.title;

    const meta = document.createElement("div");
    meta.className = "assignment-meta";
    meta.textContent = `Due ${assignment.due} · Est ${assignment.hours}h · Scheduled ${Math.round(
      totalMinutes
    )}m · Completed ${Math.round(completedMinutes)}m (${completionPct}%)`;

    const actions = document.createElement("div");
    actions.className = "block-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "primary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openAssignmentModal(assignment));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteAssignment(assignment.id));

    actions.append(edit, remove);
    card.append(title, meta, actions);
    assignmentList.appendChild(card);
  });
};

const renderAll = () => {
  renderTimeline();
  renderPlanner();
  renderBlockList();
  renderAssignmentList();
  renderAssignmentOptions();
  renderCalendar(currentView);
};

const deleteBlock = (id) => {
  focusBlocks = focusBlocks.filter((block) => block.id !== id);
  saveBlocks(focusBlocks);
  renderAll();
};

const toggleBlockCompletion = (id) => {
  focusBlocks = focusBlocks.map((block) =>
    block.id === id
      ? { ...block, completed: !block.completed, completedAt: Date.now() }
      : block
  );
  saveBlocks(focusBlocks);
  renderAll();
};

const deleteAssignment = (id) => {
  assignments = assignments.filter((assignment) => assignment.id !== id);
  focusBlocks = focusBlocks.map((block) =>
    block.assignmentId === id
      ? { ...block, assignmentId: "", assignmentTitle: "" }
      : block
  );
  saveAssignments(assignments);
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
  const assignmentId = focusAssignment?.value || "";
  const assignmentMatch = assignments.find(
    (assignment) => assignment.id === assignmentId
  );
  const completed = focusCompleted ? focusCompleted.checked : false;

  const block = {
    id: focusIdField?.value || crypto.randomUUID?.() || String(Date.now()),
    title,
    date,
    time: time || formatTime(new Date()),
    duration,
    priority,
    notes,
    assignmentId,
    assignmentTitle: assignmentMatch ? assignmentMatch.title : "",
    completed,
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

assignmentForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = assignmentForm.title.value.trim();
  const due = assignmentForm.due.value;
  const hours = assignmentForm.hours.value;

  const assignment = {
    id: assignmentIdField?.value || crypto.randomUUID?.() || String(Date.now()),
    title,
    due,
    hours,
    createdAt: Date.now(),
  };

  const existingIndex = assignments.findIndex(
    (item) => item.id === assignment.id
  );
  if (existingIndex >= 0) {
    assignments[existingIndex] = { ...assignments[existingIndex], ...assignment };
  } else {
    assignments.unshift(assignment);
  }

  focusBlocks = focusBlocks.map((block) =>
    block.assignmentId === assignment.id
      ? { ...block, assignmentTitle: assignment.title }
      : block
  );

  saveAssignments(assignments);
  saveBlocks(focusBlocks);
  renderAll();

  assignmentStatus.textContent = "Assignment saved.";
  assignmentForm.reset();
  closeAssignmentModal();

  if (focusAssignment) {
    focusAssignment.value = assignment.id;
  }
});

renderAll();
