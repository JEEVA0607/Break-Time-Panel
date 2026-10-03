import {
  db,
  collection,
  getDocs
} from "./panel-firebase.bundle.js";



const usersTable =
  document.getElementById("usersTable");

const historyTable =
  document.getElementById("historyTable");

const totalEmployees =
  document.getElementById("totalEmployees");

const availableCount =
  document.getElementById("availableCount");

const breakCount =
  document.getElementById("breakCount");

const lockedCount =
  document.getElementById("lockedCount");

const refreshBtn =
  document.getElementById("refreshBtn");

const lastUpdated =
  document.getElementById("lastUpdated");


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function toDate(value) {

  if (!value) {
    return null;
  }

  if (
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return new Date(
      value.seconds * 1000
    );
  }

  const date =
    new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}


function formatTime(value) {

  const date =
    toDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}


function formatDate(value) {

  const date =
    toDate(value);

  if (!date) {
    return "—";
  }

  return date.toLocaleDateString();
}


function statusBadge(status) {

  if (status === "ON_BREAK") {

    return `
      <span class="status break">
        ON BREAK
      </span>
    `;
  }


  if (status === "PC_LOCKED") {

    return `
      <span class="status locked">
        PC LOCKED
      </span>
    `;
  }


  if (status === "COMPLETED") {

    return `
      <span class="status completed">
        COMPLETED
      </span>
    `;
  }


  return `
    <span class="status available">
      AVAILABLE
    </span>
  `;
}


/* =========================================================
   USERS
========================================================= */

async function loadUsers() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "users"
      )
    );


  let available = 0;
  let onBreak = 0;
  let locked = 0;


  totalEmployees.textContent =
    snapshot.size;


  if (snapshot.empty) {

    usersTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          No employees found.
        </td>
      </tr>
    `;

    availableCount.textContent = "0";
    breakCount.textContent = "0";
    lockedCount.textContent = "0";

    return;
  }


  let html = "";


  snapshot.forEach((item) => {

    const user =
      item.data();

    const status =
      user.status ||
      "AVAILABLE";


    if (status === "AVAILABLE") {
      available++;
    }

    if (status === "ON_BREAK") {
      onBreak++;
    }

    if (status === "PC_LOCKED") {
      locked++;
    }


    html += `
      <tr>

        <td>
          <strong>
            ${escapeHtml(
              user.name || "Unknown"
            )}
          </strong>
        </td>

        <td>
          ${formatDate(
            user.updatedAt
          )}
        </td>

        <td>
          ${statusBadge(status)}
        </td>

        <td>
          ${formatTime(
            user.breakOut
          )}
        </td>

        <td>
          ${formatTime(
            user.breakIn
          )}
        </td>

        <td>
          ${escapeHtml(
            user.deviceId ||
            item.id
          )}
        </td>

      </tr>
    `;
  });


  usersTable.innerHTML =
    html;


  availableCount.textContent =
    available;

  breakCount.textContent =
    onBreak;

  lockedCount.textContent =
    locked;
}


/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {

  console.log(
    "Loading Firestore history..."
  );


  const snapshot =
    await getDocs(
      collection(
        db,
        "history"
      )
    );


  console.log(
    "History count:",
    snapshot.size
  );


  if (snapshot.empty) {

    historyTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          No break history found.
        </td>
      </tr>
    `;

    return;
  }


  const records = [];


  snapshot.forEach((item) => {

    const data =
      item.data();


    console.log(
      "History:",
      item.id,
      data
    );


    records.push({
      id: item.id,
      ...data
    });
  });


  records.sort((a, b) => {

    const aTime =
      toDate(a.createdAt)?.getTime() || 0;

    const bTime =
      toDate(b.createdAt)?.getTime() || 0;

    return bTime - aTime;
  });


  let html = "";


  records.forEach((record) => {

    const status =
      record.status ||
      (
        record.breakIn
          ? "COMPLETED"
          : "ON_BREAK"
      );


html += `
  <tr>

    <td>
      <strong>
        ${escapeHtml(
          record.name || "Unknown"
        )}
      </strong>
    </td>

    <td>
      ${escapeHtml(
        record.date ||
        formatDate(record.createdAt)
      )}
    </td>

    <td>
      ${formatTime(
        record.breakOut
      )}
    </td>

    <td>
      ${formatTime(
        record.breakIn
      )}
    </td>

    <td>
      <strong>
        ${formatDuration(
          record.breakOut,
          record.breakIn
        )}
      </strong>
    </td>

    <td>
      ${escapeHtml(
        record.breakType ||
        "MANUAL"
      )}
    </td>

    <td>
      ${statusBadge(status)}
    </td>

  </tr>
`;

  });


  historyTable.innerHTML =
    html;
}

function formatDuration(
  breakOut,
  breakIn
) {

  const start =
    toDate(breakOut);

  if (!start) {
    return "—";
  }


  const end =
    toDate(breakIn) ||
    new Date();


  let seconds =
    Math.floor(
      (end.getTime() - start.getTime()) / 1000
    );


  if (seconds < 0) {
    return "—";
  }


  const hours =
    Math.floor(seconds / 3600);

  seconds %= 3600;


  const minutes =
    Math.floor(seconds / 60);

  seconds %= 60;


  if (hours > 0) {

    return `${hours}h ${minutes}m`;

  }


  if (minutes > 0) {

    return `${minutes}m`;

  }


  return `${seconds}s`;
}


/* =========================================================
   LOAD PANEL
========================================================= */

async function loadPanel() {

  refreshBtn.disabled =
    true;

  refreshBtn.textContent =
    "Loading...";


  try {

    await loadUsers();

    await loadHistory();


    lastUpdated.textContent =
      "Updated " +
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });


  } catch (error) {

    console.error(
      "PANEL FIREBASE ERROR:",
      error
    );


    usersTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          Firebase error.
          Check console.
        </td>
      </tr>
    `;


    historyTable.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          Could not load history.
        </td>
      </tr>
    `;

  } finally {

    refreshBtn.disabled =
      false;

    refreshBtn.textContent =
      "Refresh";
  }
}


/* =========================================================
   REFRESH
========================================================= */

refreshBtn.addEventListener(
  "click",
  loadPanel
);


/* =========================================================
   START
========================================================= */

loadPanel();


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
  loadPanel,
  10000
);
