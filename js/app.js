// 1. DATA STORAGE
// The system saves its data in this browser.

// Starting data when the system is used for the first time.
function createEmptyData() {
    return {
        members: [],
        events: [],
        attendance: {},
        smsReminders: []
    };
}

// Get saved data from the browser.
let data;

try {
    data = JSON.parse(localStorage.getItem("churchAttendance")) || createEmptyData();
} catch (error) {
    data = createEmptyData();
}

// Save the current data to the browser.
function saveData() {
    localStorage.setItem("churchAttendance", JSON.stringify(data));
}

// Make a simple unique ID for each member and event.
function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Get an HTML element by its ID.
function getElement(id) {
    return document.getElementById(id);
}

// Safely display text entered by a user inside HTML.
function safeText(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return replacements[character];
    });
}

// 2. LOGIN AND LOGOUT
// Demo username: admin
// Demo password: admin123


getElement("loginButton").addEventListener("click", function () {
    const username = getElement("username").value;
    const password = getElement("password").value;

    if (username === "admin" && password === "admin123") {
        getElement("login").classList.add("hidden");
        getElement("app").classList.remove("hidden");
        showPage("Dashboard");
        getElement("loginError").textContent = "";
    } else {
        getElement("loginError").textContent = "Wrong username or password. Try again.";
    }
});

getElement("logoutButton").addEventListener("click", function () {
    getElement("app").classList.add("hidden");
    getElement("login").classList.remove("hidden");
    getElement("password").value = "";
    getElement("loginError").textContent = "";
});

// 3. PAGE NAVIGATION
// This list connects each menu name to its page function.

const pages = {
    Dashboard: showDashboard,
    Attendance: showAttendance,
    Members: showMembers,
    Events: showEvents,
    Reports: showReports
};

function showPage(pageName) {
    const navigation = getElement("navigation");
    navigation.innerHTML = "";

    // Create one menu button for each page.
    Object.keys(pages).forEach(function (name) {
        const button = document.createElement("button");
        button.textContent = name;

        if (name === pageName) {
            button.classList.add("active");
        }

        button.addEventListener("click", function () {
            showPage(name);
        });

        navigation.appendChild(button);
    });

    // Open the selected page.
    pages[pageName]();
}

// Return events arranged by date and time.
function getSortedEvents() {
    return [...data.events].sort(function (first, second) {
        return (first.date + first.time).localeCompare(second.date + second.time);
    });
}

// Count how many members attended an event.
function countAttendance(eventId) {
    return (data.attendance[eventId] || []).length;
}

// 4. DASHBOARD
// Shows member totals and upcoming events.

function showDashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const upcomingEvents = getSortedEvents().filter(function (event) {
        return event.date >= today;
    }).slice(0, 3);

    const eventsWithAttendance = getSortedEvents().filter(function (event) {
        return data.attendance[event.id] !== undefined;
    });

    const lastEvent = eventsWithAttendance.length
        ? eventsWithAttendance[eventsWithAttendance.length - 1]
        : null;

    let upcomingHTML = "<p>No upcoming events. Add one in Events.</p>";

    if (upcomingEvents.length > 0) {
        upcomingHTML = upcomingEvents.map(function (event) {
            return `
                <div class="item">
                    ${safeText(event.title)}
                    <span class="right-text">${event.date} ${event.time}</span>
                </div>
            `;
        }).join("");
    }

    getElement("pageContent").innerHTML = `
        <h2>Dashboard</h2>

        <div class="grid">
            <div class="card">
                <div class="big-number">${data.members.length}</div>
                Members on record
            </div>

            <div class="card">
                <div class="big-number">${data.members.filter(function (member) {
                    return member.newcomer;
                }).length}</div>
                Newcomers
            </div>

            <div class="card">
                <div class="big-number">${lastEvent ? countAttendance(lastEvent.id) : 0}</div>
                Present at last event
                ${lastEvent ? ": " + safeText(lastEvent.title) : ""}
            </div>
        </div>

        <div class="card">
            <h3>Upcoming events</h3>
            ${upcomingHTML}
        </div>
    `;
}

// 5. MEMBERS
// Add and display church members.


function showMembers() {
    let membersHTML = "<p>No members yet. Add your first member above.</p>";

    if (data.members.length > 0) {
        membersHTML = data.members.map(function (member) {
            return `
                <div class="item">
                    ${safeText(member.name)}
                    <span class="right-text">
                        ${safeText(member.status)} · ${safeText(member.phone || "no number")}
                    </span>
                </div>
            `;
        }).join("");
    }

    getElement("pageContent").innerHTML = `
        <h2>Members</h2>

        <div class="card">
            <div class="form-row">
                <div>
                    <label for="memberName">Full name</label>
                    <input id="memberName" type="text">
                </div>

                <div>
                    <label for="memberPhone">Contact number</label>
                    <input id="memberPhone" type="tel">
                </div>

                <div>
                    <label for="memberStatus">Status</label>
                    <select id="memberStatus">
                        <option>Student</option>
                        <option>Alumni</option>
                    </select>
                </div>
            </div>

            <button class="button" id="addMemberButton">Add member</button>
            <p id="memberMessage" class="error"></p>
        </div>

        <div class="card">
            <h3>Member list</h3>
            ${membersHTML}
        </div>
    `;

    getElement("addMemberButton").addEventListener("click", function () {
        const name = getElement("memberName").value.trim();
        const phone = getElement("memberPhone").value.trim();
        const status = getElement("memberStatus").value;

        if (name === "") {
            getElement("memberMessage").textContent = "Please enter the member's name.";
            return;
        }

        // Add the new member to the data list.
        data.members.push({
            id: makeId(),
            name: name,
            phone: phone,
            status: status,
            newcomer: false
        });

        saveData();
        showMembers();
    });
}

// 6. EVENTS
// Add events and create simulated SMS reminders.

function showEvents() {
    let eventsHTML = "<p>No events yet.</p>";

    if (data.events.length > 0) {
        eventsHTML = getSortedEvents().map(function (event) {
            return `
                <div class="item">
                    <div>
                        <strong>${safeText(event.title)}</strong><br>
                        <span class="muted">${event.date} ${event.time}</span>
                    </div>
                    <button class="button secondary reminder-button" data-event-id="${event.id}">
                        Send SMS reminder
                    </button>
                </div>
            `;
        }).join("");
    }

    getElement("pageContent").innerHTML = `
        <h2>Events</h2>

        <div class="card">
            <div class="form-row">
                <div>
                    <label for="eventTitle">Event title</label>
                    <input id="eventTitle" type="text">
                </div>

                <div>
                    <label for="eventDate">Date</label>
                    <input id="eventDate" type="date">
                </div>

                <div>
                    <label for="eventTime">Time</label>
                    <input id="eventTime" type="time">
                </div>
            </div>

            <button class="button" id="addEventButton">Save event</button>
            <p id="eventMessage" class="error"></p>
        </div>

        <div class="card">
            <h3>Event list</h3>
            ${eventsHTML}
            <p id="smsMessage" class="success"></p>
        </div>

        <p class="note">
            SMS is simulated in this demo. Reminders are saved in the system but are not sent as real text messages.
        </p>
    `;

    getElement("addEventButton").addEventListener("click", function () {
        const title = getElement("eventTitle").value.trim();
        const date = getElement("eventDate").value;
        const time = getElement("eventTime").value;

        if (title === "" || date === "") {
            getElement("eventMessage").textContent = "Please enter an event title and date.";
            return;
        }

        data.events.push({
            id: makeId(),
            title: title,
            date: date,
            time: time
        });

        saveData();
        showEvents();
    });

    // Add a click action to every reminder button.
    document.querySelectorAll(".reminder-button").forEach(function (button) {
        button.addEventListener("click", function () {
            const eventId = button.dataset.eventId;
            sendReminders(eventId);
        });
    });
}

// Save a reminder for each member who has a contact number.
function sendReminders(eventId) {
    const event = data.events.find(function (item) {
        return item.id === eventId;
    });

    if (!event) {
        return;
    }

    let reminderCount = 0;

    data.members.forEach(function (member) {
        if (member.phone) {
            data.smsReminders.push({
                to: member.phone,
                message: "Reminder: " + event.title + " on " + event.date + " " + event.time,
                dateCreated: new Date().toISOString(),
                status: "simulated"
            });

            reminderCount++;
        }
    });

    saveData();
    getElement("smsMessage").textContent =
        "Reminder saved for " + reminderCount + " member(s). No real SMS was sent.";
}


// 7. ATTENDANCE
// Select an event and mark members as present.
// You can also add a newcomer and mark them present.

function showAttendance() {
    if (data.events.length === 0) {
        getElement("pageContent").innerHTML = `
            <h2>Attendance</h2>
            <div class="card">Create an event first, then record attendance.</div>
        `;
        return;
    }

    // Start with the most recently added event.
    let selectedEventId = data.events[data.events.length - 1].id;
    let searchText = "";
    let presentMembers = new Set(data.attendance[selectedEventId] || []);

    function drawAttendancePage() {
        const selectedEvent = data.events.find(function (event) {
            return event.id === selectedEventId;
        });

        // Show only members whose names match the search.
        const matchingMembers = data.members.filter(function (member) {
            return member.name.toLowerCase().includes(searchText.toLowerCase());
        });

        let memberListHTML = "<p>No members found.</p>";

        if (matchingMembers.length > 0) {
            memberListHTML = matchingMembers.map(function (member) {
                const checked = presentMembers.has(member.id) ? "checked" : "";
                const newcomerText = member.newcomer ? " (newcomer)" : "";

                return `
                    <label class="item">
                        <span>
                            <input type="checkbox" class="attendance-checkbox" data-member-id="${member.id}" ${checked}>
                            ${safeText(member.name)}${newcomerText}
                        </span>
                        <span class="right-text">${safeText(member.status)}</span>
                    </label>
                `;
            }).join("");
        }

        const eventOptions = getSortedEvents().map(function (event) {
            const selected = event.id === selectedEventId ? "selected" : "";
            return `<option value="${event.id}" ${selected}>${safeText(event.title)} (${event.date})</option>`;
        }).join("");

        getElement("pageContent").innerHTML = `
            <h2>Attendance check-in</h2>

            <div class="card form-row">
                <div>
                    <label for="attendanceEvent">Select event</label>
                    <select id="attendanceEvent">${eventOptions}</select>
                </div>

                <div>
                    <label for="memberSearch">Search member</label>
                    <input id="memberSearch" type="text" value="${safeText(searchText)}" placeholder="Enter a name">
                </div>
            </div>

            <div class="card">
                <h3>Member attendance</h3>
                ${memberListHTML}
                <button class="button" id="saveAttendanceButton">
                    Save attendance (${presentMembers.size} present)
                </button>
                <p id="attendanceMessage" class="success"></p>
            </div>

            <div class="card">
                <h3>Add newcomer</h3>
                <div class="form-row">
                    <div>
                        <label for="newName">Full name</label>
                        <input id="newName" type="text">
                    </div>
                    <div>
                        <label for="newPhone">Contact number</label>
                        <input id="newPhone" type="tel">
                    </div>
                    <div>
                        <label for="newStatus">Status</label>
                        <select id="newStatus">
                            <option>Student</option>
                            <option>Alumni</option>
                        </select>
                    </div>
                </div>
                <button class="button" id="addNewcomerButton">Add and mark present</button>
                <p id="newcomerMessage" class="error"></p>
            </div>
        `;

        // Change the selected event.
        getElement("attendanceEvent").addEventListener("change", function () {
            selectedEventId = this.value;
            presentMembers = new Set(data.attendance[selectedEventId] || []);
            drawAttendancePage();
        });

        // Update the member search.
        getElement("memberSearch").addEventListener("input", function () {
            searchText = this.value;
            const cursorPosition = this.selectionStart;
            drawAttendancePage();
            getElement("memberSearch").focus();
            getElement("memberSearch").setSelectionRange(cursorPosition, cursorPosition);
        });

        // Add or remove a member from the present list.
        document.querySelectorAll(".attendance-checkbox").forEach(function (checkbox) {
            checkbox.addEventListener("change", function () {
                const memberId = this.dataset.memberId;

                if (this.checked) {
                    presentMembers.add(memberId);
                } else {
                    presentMembers.delete(memberId);
                }

                getElement("saveAttendanceButton").textContent =
                    "Save attendance (" + presentMembers.size + " present)";
            });
        });

        // Save attendance for the selected event.
        getElement("saveAttendanceButton").addEventListener("click", function () {
            data.attendance[selectedEventId] = Array.from(presentMembers);
            saveData();
            getElement("attendanceMessage").textContent = "Attendance saved.";
        });

        // Add a newcomer to the member list and mark them present.
        getElement("addNewcomerButton").addEventListener("click", function () {
            const name = getElement("newName").value.trim();
            const phone = getElement("newPhone").value.trim();
            const status = getElement("newStatus").value;

            if (name === "") {
                getElement("newcomerMessage").textContent = "Please enter the newcomer's name.";
                return;
            }

            const newMember = {
                id: makeId(),
                name: name,
                phone: phone,
                status: status,
                newcomer: true
            };

            data.members.push(newMember);
            presentMembers.add(newMember.id);
            saveData();
            drawAttendancePage();
        });
    }

    drawAttendancePage();
}

// 8. REPORTS
// Show attendance totals, average, prediction, and CSV export.

function showReports() {
    // Include events where attendance has been saved.
    const eventsWithAttendance = getSortedEvents().filter(function (event) {
        return data.attendance[event.id] !== undefined;
    });

    if (eventsWithAttendance.length === 0) {
        getElement("pageContent").innerHTML = `
            <h2>Reports</h2>
            <div class="card">Record attendance for at least one event to see reports.</div>
        `;
        return;
    }

    const attendanceCounts = eventsWithAttendance.map(function (event) {
        return countAttendance(event.id);
    });

    const totalAttendance = attendanceCounts.reduce(function (total, count) {
        return total + count;
    }, 0);

    const averageAttendance = totalAttendance / attendanceCounts.length;

    // Predict turnout using the average of the latest three events.
    const recentCounts = attendanceCounts.slice(-3);
    const recentTotal = recentCounts.reduce(function (total, count) {
        return total + count;
    }, 0);
    const predictedAttendance = Math.round(recentTotal / recentCounts.length);

    const highestCount = Math.max(...attendanceCounts, 1);
    const lastCount = attendanceCounts[attendanceCounts.length - 1];
    const attendanceDropped = attendanceCounts.length > 1 && lastCount < averageAttendance * 0.8;

    // Create one bar for every event.
    const barsHTML = attendanceCounts.map(function (count) {
        const height = (count / highestCount) * 100;
        return `
            <div class="chart-column" style="height: ${height}%">
                <span>${count}</span>
            </div>
        `;
    }).join("");

    // Show a short event name below each bar.
    const labelsHTML = eventsWithAttendance.map(function (event) {
        return `<div>${safeText(event.title.slice(0, 10))}</div>`;
    }).join("");

    getElement("pageContent").innerHTML = `
        <h2>Reports</h2>

        <div class="grid">
            <div class="card">
                <div class="big-number">${averageAttendance.toFixed(1)}</div>
                Average attendance
            </div>

            <div class="card">
                <div class="big-number">${predictedAttendance}</div>
                Predicted turnout (based on the latest ${recentCounts.length} events)
            </div>
        </div>

        <div class="card">
            <h3>Attendance per event</h3>
            <div class="chart">${barsHTML}</div>
            <div class="chart-labels">${labelsHTML}</div>
        </div>

        ${attendanceDropped ? `
            <div class="note">
                <strong>Attendance dropped.</strong>
                Ideas to bring people back: sports fellowship, summer outreach, game night, or a student-led worship night.
            </div>
        ` : ""}

        <button class="button" id="exportButton">Export CSV</button>
    `;

    getElement("exportButton").addEventListener("click", exportReport);
}

// Download attendance information as a CSV file.
function exportReport() {
    const eventsWithAttendance = getSortedEvents().filter(function (event) {
        return data.attendance[event.id] !== undefined;
    });

    const rows = [["Event", "Date", "Present"]];

    eventsWithAttendance.forEach(function (event) {
        rows.push([event.title, event.date, countAttendance(event.id)]);
    });

    // Turn the rows into CSV text.
    const csvText = rows.map(function (row) {
        return row.map(function (value) {
            return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(",");
    }).join("\n");

    // Create a temporary download link.
    const file = new Blob([csvText], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    const fileURL = URL.createObjectURL(file);

    downloadLink.href = fileURL;
    downloadLink.download = "attendance-report.csv";
    downloadLink.click();

    URL.revokeObjectURL(fileURL);
}
