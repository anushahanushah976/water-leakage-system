
const API = "/api/reports";

const form = document.getElementById("reportForm");
const formMessage = document.getElementById("formMessage");
const reportsList = document.getElementById("reportsList");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");

let reports = [];

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function updateStats() {
  document.getElementById("total").textContent = reports.length;
  document.getElementById("pending").textContent =
    reports.filter(r => r.status === "Pending").length;
  document.getElementById("progress").textContent =
    reports.filter(r => r.status === "In Progress").length;
  document.getElementById("resolved").textContent =
    reports.filter(r => r.status === "Resolved").length;
}

async function loadReports() {
  reportsList.innerHTML = "<p>Loading reports...</p>";

  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error("Unable to load reports");

    reports = await response.json();
    updateStats();
    renderReports();
  } catch (error) {
    reportsList.innerHTML =
      '<p class="empty">Cannot connect to the server. Check that Node.js and MongoDB are running.</p>';
  }
}

function renderReports() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;

  const filtered = reports.filter(report => {
    const matchesSearch =
      report.location.toLowerCase().includes(query) ||
      report._id.toLowerCase().includes(query);

    return matchesSearch &&
      (filter === "All" || report.status === filter);
  });

  if (!filtered.length) {
    reportsList.innerHTML =
      '<p class="empty">No reports found. Try another search or submit a new report.</p>';
    return;
  }

  reportsList.innerHTML = filtered.map(report => {
    const statusClass = report.status === "Resolved"
      ? "resolved"
      : report.status === "In Progress"
        ? "in-progress"
        : "";

    // Only allow HTTP or HTTPS image URLs.
    let photo = "";
    try {
      const url = new URL(report.photoUrl || "");
      if (["https:", "http:"].includes(url.protocol)) {
        photo = `<img class="report-photo"
          src="${escapeHTML(url.href)}"
          alt="Leakage report photo"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.hidden=true">`;
      }
    } catch (_) {
      // Ignore invalid optional photo URLs.
    }

    return `
      <article class="report-card">
        <div class="report-top">
          <div>
            <h3>${escapeHTML(report.leakType)}</h3>
            <span class="report-id">
              Report ID: ${escapeHTML(report._id)}
            </span>
          </div>
          <span class="status ${statusClass}">
            ${escapeHTML(report.status)}
          </span>
        </div>

        <p><strong>📍 Location:</strong>
          ${escapeHTML(report.location)}</p>
        <p><strong>👤 Reported by:</strong>
          ${escapeHTML(report.reporterName)}</p>
        <p><strong>⚠️ Priority:</strong>
          ${escapeHTML(report.priority)}</p>
        <p><strong>Description:</strong>
          ${escapeHTML(report.description)}</p>
        <p><strong>Date:</strong>
          ${escapeHTML(new Date(report.createdAt).toLocaleString())}</p>

        ${photo}

        <div class="admin-controls">
          <label>
            Update Status
            <select data-status-id="${escapeHTML(report._id)}">
              ${["Pending", "In Progress", "Resolved"].map(status =>
                `<option value="${status}"
                  ${report.status === status ? "selected" : ""}>
                  ${status}
                </option>`
              ).join("")}
            </select>
          </label>
          <button class="delete-btn"
            data-delete-id="${escapeHTML(report._id)}">
            Delete Report
          </button>
        </div>
      </article>
    `;
  }).join("");
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  formMessage.textContent = "Submitting report...";
  formMessage.classList.remove("error");

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Submission failed");
    }

    form.reset();
    formMessage.textContent =
      "Report submitted successfully! Your report ID is " + result._id;

    await loadReports();
    document.getElementById("tracking").scrollIntoView({
      behavior: "smooth"
    });
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.classList.add("error");
  }
});

searchInput.addEventListener("input", renderReports);
statusFilter.addEventListener("change", renderReports);

reportsList.addEventListener("change", async event => {
  const id = event.target.dataset.statusId;
  if (!id) return;

  try {
    const response = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: event.target.value })
    });

    if (!response.ok) throw new Error("Could not update status");

    await loadReports();
  } catch (error) {
    alert(error.message);
    await loadReports();
  }
});

reportsList.addEventListener("click", async event => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;

  const id = button.dataset.deleteId;

  if (!confirm("Are you sure you want to delete this report?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Could not delete report");

    await loadReports();
  } catch (error) {
    alert(error.message);
  }
});

loadReports();
