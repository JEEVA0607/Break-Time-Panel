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

const breakEmployees =
  document.getElementById("breakEmployees");

const activeBreakCount =
  document.getElementById("activeBreakCount");

const employeeLiveCount =
  document.getElementById("employeeLiveCount");

  const historySearch =
  document.getElementById("historySearch");

const historyDate =
  document.getElementById("historyDate");

const clearHistoryFilters =
  document.getElementById("clearHistoryFilters");


let historyRecords = [];



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

function formatDateForFilter(value) {

  const date =
    toDate(value);


  if (!date) {
    return "";
  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;
}



function statusBadge(status) {

  if (status === "ON_BREAK") {

    return `
      <span class="statusBadge break">
        <span class="badgeDot"></span>
        ON BREAK
      </span>
    `;
  }


  if (status === "PC_LOCKED") {

    return `
      <span class="statusBadge locked">
        <span class="badgeDot"></span>
        PC LOCKED
      </span>
    `;
  }


  if (status === "COMPLETED") {

    return `
      <span class="statusBadge completed">
        <span class="badgeDot"></span>
        COMPLETED
      </span>
    `;
  }


  return `
    <span class="statusBadge available">
      <span class="badgeDot"></span>
      AVAILABLE
    </span>
  `;
}


/* =========================================================
   EMPLOYEE CARD
========================================================= */

function employeeCard(user, id) {

  const status =
    user.status ||
    "AVAILABLE";


  let statusClass =
    "available";

  let statusText =
    "Available";

  let icon =
    "✓";


  if (status === "ON_BREAK") {

    statusClass = "break";
    statusText = "On Break";
    icon = "☕";

  } else if (status === "PC_LOCKED") {

    statusClass = "locked";
    statusText = "PC Locked";
    icon = "🔒";

  }


  const name =
    user.name ||
    "Unknown Employee";


  const device =
    user.deviceId ||
    id;


  return `

    <div class="employeeCard ${statusClass}">

      <div class="employeeCardTop">

        <div class="avatar">

          ${escapeHtml(
            name
              .trim()
              .charAt(0)
              .toUpperCase()
          )}

        </div>


        <div class="employeeMain">

          <strong>
            ${escapeHtml(name)}
          </strong>

          <span>
            Employee
          </span>

        </div>


        <div class="statusCircle">
          ${icon}
        </div>

      </div>


      <div class="employeeDivider"></div>


      <div class="employeeDetails">

        <div class="employeeDetail">

          <span>
            STATUS
          </span>

          ${statusBadge(status)}

        </div>


        <div class="employeeDetail">

          <span>
            DEVICE
          </span>

          <strong
            class="deviceText"
            title="${escapeHtml(device)}"
          >
            ${escapeHtml(device)}
          </strong>

        </div>


        <div class="employeeDetail">

          <span>
            LAST UPDATE
          </span>

          <strong>
            ${formatTime(user.updatedAt)}
          </strong>

        </div>


        ${
          status === "ON_BREAK"
            ? `
              <div class="employeeDetail">

                <span>
                  BREAK STARTED
                </span>

                <strong class="breakTime">
                  ${formatTime(user.breakOut)}
                </strong>

              </div>
            `
            : ""
        }

      </div>

    </div>

  `;
}


/* =========================================================
   BREAK EMPLOYEE CARD
========================================================= */

function breakEmployeeCard(user, id) {

  const name =
    user.name ||
    "Unknown Employee";


  const device =
    user.deviceId ||
    id;


  return `

    <div class="breakEmployeeCard">

      <div class="breakAvatar">

        ${escapeHtml(
          name
            .trim()
            .charAt(0)
            .toUpperCase()
        )}

      </div>


      <div class="breakEmployeeInfo">

        <strong>
          ${escapeHtml(name)}
        </strong>

        <span>
          ${escapeHtml(device)}
        </span>

      </div>


      <div class="breakTimer">

        <span>
          BREAK
        </span>

        <strong>
          ${formatTime(user.breakOut)}
        </strong>

      </div>


      <div class="breakLive">

        <span class="pulse"></span>

        LIVE

      </div>

    </div>

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


  employeeLiveCount.textContent =
    snapshot.size;


  if (snapshot.empty) {

    usersTable.innerHTML = `

      <div class="emptyEmployees">

        <div class="emptyIcon">
          👥
        </div>

        <strong>
          No employees found
        </strong>

        <span>
          Employee records will appear here.
        </span>

      </div>

    `;

    breakEmployees.innerHTML = `

      <div class="emptyBreak">

        <div class="emptyIcon">
          ✓
        </div>

        <strong>
          Everyone is available
        </strong>

        <span>
          No employees are currently on break.
        </span>

      </div>

    `;

    availableCount.textContent = "0";
    breakCount.textContent = "0";
    lockedCount.textContent = "0";
    activeBreakCount.textContent = "0";

    return;
  }


  let employeeHtml = "";
  let breakHtml = "";

  let breakEmployeesCount = 0;


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
    locked++; // ON_BREAK also counted as PC LOCKED

    breakEmployeesCount++;

    breakHtml +=
      breakEmployeeCard(
        user,
        item.id
      );

  } else if (status === "PC_LOCKED") {

    locked++;
  }


  employeeHtml +=
    employeeCard(
      user,
      item.id
    );

});




  usersTable.innerHTML =
    employeeHtml;


  if (breakEmployeesCount === 0) {

    breakEmployees.innerHTML = `

      <div class="emptyBreak">

        <div class="emptyIcon">
          ✓
        </div>

        <strong>
          Everyone is available
        </strong>

        <span>
          No employees are currently on break.
        </span>

      </div>

    `;

  } else {

    breakEmployees.innerHTML =
      breakHtml;

  }


  availableCount.textContent =
    available;

  breakCount.textContent =
    onBreak;

  lockedCount.textContent =
    locked;

  activeBreakCount.textContent =
    breakEmployeesCount;
}


/* =========================================================
   HISTORY
========================================================= */

async function loadHistory() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "history"
      )
    );


 if (snapshot.empty) {

  historyRecords = [];

  historyTable.innerHTML = `
    <tr>
      <td
        colspan="7"
        class="emptyTable"
      >
        No break history found.
      </td>
    </tr>
  `;

  return;
}



  let records = [];


  snapshot.forEach((item) => {

    const data =
      item.data();


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

  historyRecords = records;

renderHistory();


}


function renderHistory() {

  const search =
    historySearch.value
      .trim()
      .toLowerCase();

  const selectedDate =
    historyDate.value;


  let filteredRecords =
    historyRecords.filter((record) => {

      const employeeName =
        String(
          record.name || ""
        ).toLowerCase();


      const recordDate =
  getHistoryDateForFilter(record);



      const matchesSearch =
        !search ||
        employeeName.includes(search);


      const matchesDate =
        !selectedDate ||
        recordDate === selectedDate;


      return (
        matchesSearch &&
        matchesDate
      );

    });


  if (filteredRecords.length === 0) {

    historyTable.innerHTML = `

      <tr>

        <td
          colspan="7"
          class="emptyTable"
        >

          <div class="noResults">

            <div class="noResultsIcon">
              🔍
            </div>

            <strong>
              No matching history
            </strong>

            <span>
              Try another employee name or date.
            </span>

          </div>

        </td>

      </tr>

    `;

    return;
  }


  let html = "";


  filteredRecords.forEach((record) => {

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

          <div class="historyEmployee">

            <div class="historyAvatar">

              ${escapeHtml(
                (
                  record.name ||
                  "Unknown"
                )
                  .trim()
                  .charAt(0)
                  .toUpperCase()
              )}

            </div>

            <strong>
              ${escapeHtml(
                record.name ||
                "Unknown"
              )}
            </strong>

          </div>

        </td>


        <td>
          ${escapeHtml(
            record.date ||
            formatDate(record.createdAt)
          )}
        </td>


        <td>
          <strong>
            ${formatTime(
              record.breakOut
            )}
          </strong>
        </td>


        <td>
          ${formatTime(
            record.breakIn
          )}
        </td>


        <td>

          <span class="durationValue">

            ${formatDuration(
              record.breakOut,
              record.breakIn
            )}

          </span>

        </td>


        <td>

          <span class="typeBadge">

            ${escapeHtml(
              record.breakType ||
              "MANUAL"
            )}

          </span>

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


/* =========================================================
   DURATION
========================================================= */

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
      (
        end.getTime() -
        start.getTime()
      ) / 1000
    );


  if (seconds < 0) {
    return "—";
  }


  const hours =
    Math.floor(
      seconds / 3600
    );


  seconds %= 3600;


  const minutes =
    Math.floor(
      seconds / 60
    );


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

  refreshBtn.classList.add(
    "loading"
  );

  refreshBtn.innerHTML = `
    <span class="refreshIcon spinning">
      ↻
    </span>
    Loading...
  `;


  try {

    await loadUsers();

    await loadHistory();


    lastUpdated.textContent =
      "Updated " +
      new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );


  } catch (error) {

    console.error(
      "PANEL FIREBASE ERROR:",
      error
    );


    usersTable.innerHTML = `

      <div class="emptyEmployees errorState">

        <div class="emptyIcon">
          !
        </div>

        <strong>
          Firebase connection error
        </strong>

        <span>
          Please check Firebase configuration and console.
        </span>

      </div>

    `;


    historyTable.innerHTML = `

      <tr>

        <td
          colspan="7"
          class="emptyTable"
        >
          Could not load history.
        </td>

      </tr>

    `;

  } finally {

    refreshBtn.disabled =
      false;

    refreshBtn.classList.remove(
      "loading"
    );

    refreshBtn.innerHTML = `
      <span class="refreshIcon">
        ↻
      </span>
      Refresh
    `;

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

historySearch.addEventListener(
  "input",
  renderHistory
);


historyDate.addEventListener(
  "change",
  renderHistory
);


clearHistoryFilters.addEventListener(
  "click",
  () => {

    historySearch.value = "";

    historyDate.value = "";

    renderHistory();

  }
);


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
  loadPanel,
  10000
);

function getHistoryDateForFilter(record) {

  if (record.date) {

    const date =
      String(record.date).trim();

    // YYYY-MM-DD format ആണെങ്കിൽ നേരിട്ട് use ചെയ്യാം
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // മറ്റൊരു date format ആണെങ്കിൽ parse ചെയ്യാൻ ശ്രമിക്കുക
    const parsed =
      toDate(record.date);

    if (parsed) {
      return formatDateForFilter(parsed);
    }
  }


  if (record.breakOut) {

    return formatDateForFilter(
      record.breakOut
    );

  }


  if (record.createdAt) {

    return formatDateForFilter(
      record.createdAt
    );

  }


  return "";
}
