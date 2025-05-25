// Load Sidebar HTML into the Main Page
async function loadSidebar() {
    const response = await fetch("sidebar.html");
    document.getElementById("sidebarContainer").innerHTML = await response.text();

    // Ensure sidebar and buttons exist before adding listeners
    const toggleSidebar = document.getElementById("toggleSidebar");
    const leaderboardSidebar = document.getElementById("leaderboardSidebar");

    if (toggleSidebar) {
        toggleSidebar.addEventListener("click", async function () {
            leaderboardSidebar.style.right = "0";
            await fetchLeaderboard();
        });
    } else {
        console.error("Error: toggleSidebar button not found in sidebar.html.");
    }
}

function closeSidebar() {
  document.getElementById("leaderboardSidebar").style.right = "-340px"; /* Ensure it's fully hidden */
}

// Fetch Top 100 Players from API
let cachedLeaderboard = null; // Store leaderboard in memory

async function fetchLeaderboard(forceRefresh = false) {
    try {
        // If we already have data and refresh isn't forced, reuse cached version
        if (!forceRefresh && cachedLeaderboard) {
            displayLeaderboard(cachedLeaderboard);
            return;
        }

        const response = await fetch("https://prod01.platform.impl.lunchboxentertainmentapps.com/api/v1/leaderboards/MMR");

        if (!response.ok) {
            console.error(`API request failed: ${response.status} ${response.statusText}`);
            document.getElementById("leaderboardList").innerHTML = `<tr><td colspan="3">⚠️ Failed to retrieve the leaderboard.</td></tr>`;
            return;
        }

        const data = await response.json();
        const playerEntries = data?.mmrLeaderboard?.playerEntries ?? [];

        if (!playerEntries.length) {
            console.warn("No player data available.");
            document.getElementById("leaderboardList").innerHTML = `<tr><td colspan="3">⚠️ No leaderboard data found.</td></tr>`;
            return;
        }

        // Cache leaderboard data
        cachedLeaderboard = playerEntries;
        displayLeaderboard(playerEntries);

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        document.getElementById("leaderboardList").innerHTML = `<tr><td colspan="3">⚠️ Unable to load leaderboard. Try again later.</td></tr>`;
    }
}

function displayLeaderboard(playerEntries) {
    const leaderboardList = document.getElementById("leaderboardList");
    leaderboardList.innerHTML = "";

    playerEntries.forEach((player) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>#${(player.rank ?? 0) + 1}</td>
            <td>${player.displayName ?? "Unknown"}</td>
            <td>${player.score ?? "N/A"}</td>
        `;
        leaderboardList.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", loadSidebar);
