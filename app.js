const highlight = document.querySelector(".highlight");
const syncButton = document.querySelector('[data-action="sync"]');
const focusButton = document.querySelector('[data-action="focus"]');
const lastSync = document.querySelector("#last-sync");
const syncStatus = document.querySelector("#sync-status");
const intakeList = document.querySelector("#intake-list");
const timeline = document.querySelector("#timeline");
const revealItems = document.querySelectorAll(".reveal");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarTabs = document.querySelectorAll("[data-view]");
const profileName = document.querySelector("#profile-name");
const logoutButton = document.querySelector("#logout");
const navLinks = document.querySelectorAll(".sidebar nav a");
const requiresAuth = document.body.classList.contains("requires-auth");

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const calendarData = {
  day: [],
  week: [],
  month: [],
  year: [],
};

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

const renderCalendar = (view) => {
  if (!calendarGrid) {
    return;
  }

  calendarGrid.className = `calendar-grid view-${view}`;
  calendarGrid.innerHTML = "";

  calendarCells[view].forEach((label) => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const title = document.createElement("div");
    title.className = "cell-label";
    title.textContent = label;
    cell.appendChild(title);

    const items = calendarData[view].filter((item) =>
      levelThreshold[view].includes(item.level)
    );

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "calendar-item low";
      empty.textContent = "No focus blocks yet";
      cell.appendChild(empty);
    } else {
      items.forEach((item) => {
        const entry = document.createElement("div");
        entry.className = `calendar-item ${item.level}`;
        entry.textContent = item.label;
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

focusButton?.addEventListener("click", () => {
  const now = new Date();
  if (!timeline) {
    return;
  }

  const empty = timeline.querySelector(".empty");
  if (empty) {
    empty.remove();
  }

  const row = document.createElement("div");
  row.classList.add("new");

  const time = document.createElement("span");
  time.textContent = formatTime(now);

  const label = document.createElement("strong");
  label.textContent = "Focus Block · Deep Work";

  row.append(time, label);
  timeline.prepend(row);
});

setTimeout(() => {
  highlight?.classList.add("pulse");
}, 500);

ensureSession();
