// Load Sidebar HTML into the Main Page
async function loadSidebar() {
  // Fetch the sidebar HTML from an external file and insert it.
  const response = await fetch("sidebar.html");
  document.getElementById("sidebarContainer").innerHTML = await response.text();

  // After inserting the HTML, initialize event listeners.
  initializeSidebarEvents();
}

/**
 * Set up the sidebar UI events.
 * This ensures that once the sidebar content is loaded,
 * the toggle and click events are bound correctly.
 */
function initializeSidebarEvents() {
  const toggleSidebar = document.getElementById("toggleSidebar");
  const leaderboardSidebar = document.getElementById("leaderboardSidebar");

  if (toggleSidebar && leaderboardSidebar) {
    // When the toggle button is clicked, slide in the sidebar
    // and fetch the leaderboard data.
    toggleSidebar.addEventListener("click", async function () {
      leaderboardSidebar.style.right = "0";
      await fetchLeaderboard();
    });
  } else {
    console.error("Error: Sidebar toggle elements not found in sidebar.html.");
  }
}

/**
 * Close the sidebar by sliding it out.
 */
function closeSidebar() {
  document.getElementById("leaderboardSidebar").style.right = "-340px"; // Ensure it's fully hidden
}

/**
 * Cache the leaderboard data with a timestamp.
 */
function cacheLeaderboard(data) {
  // Wrap the data with a timestamp to enable expiration checks
  const payload = { data, timestamp: Date.now() };
  sessionStorage.setItem("cachedLeaderboard", JSON.stringify(payload));
}

/**
 * Retrieve cached leaderboard data.
 * Returns the data only if it has not expired (1 hour by default),
 * otherwise returns null.
 */
function getCachedLeaderboard() {
  const cachedData = sessionStorage.getItem("cachedLeaderboard");
  if (!cachedData) return null;

  const { data, timestamp } = JSON.parse(cachedData);
  const CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour
  return (Date.now() - timestamp < CACHE_EXPIRATION_TIME) ? data : null;
}

function clearProfileCacheALL() {
    // Get all keys in sessionStorage
    Object.keys(sessionStorage).forEach(key => {
        // Remove keys that start with "player_"
        if (key.startsWith("player_")) {
            sessionStorage.removeItem(key);
        }
    });
}

/**
 * Fetch the Top 100 players from the API. If acceptable cache data exists
 * and the force refresh flag is not active, re-use it.
 *
 * @param {boolean} forceRefresh Set to true to bypass cache and fetch fresh data.
 */
async function fetchLeaderboard(forceRefresh = false) {
  try {
    // Attempt to reuse cached leaderboard if available.
    const cachedLeaderboard = getCachedLeaderboard();
    if (!forceRefresh && cachedLeaderboard) {
      displayLeaderboard(cachedLeaderboard);
      return;
    }

    // Otherwise, perform the API request.
    const response = await fetch("https://prod01.platform.impl.lunchboxentertainmentapps.com/api/v1/leaderboards/by-type/MMR");

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      showLeaderboardError("⚠️ Failed to retrieve the leaderboard.");
      return;
    }

    const data = await response.json();
    const playerEntries = data?.mmrLeaderboard?.playerEntries ?? [];

    if (!playerEntries.length) {
      console.warn("No leaderboard data available.");
      showLeaderboardError("⚠️ No leaderboard data found.");
      return;
    }
    if(forceRefresh){
      clearProfileCacheALL();
    }
    // Cache and display the fresh leaderboard data.
    cacheLeaderboard(playerEntries);
    displayLeaderboard(playerEntries);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    showLeaderboardError("⚠️ Unable to load leaderboard. Try again later.");
  }
}

/**
 * Render the leaderboard table using the provided player entries.
 */
function displayLeaderboard(playerEntries) {
  const leaderboardList = document.getElementById("leaderboardList");
  leaderboardList.innerHTML = ""; // Clear any existing content

  playerEntries.forEach((player) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${(player.rank ?? 0) + 1}</td>
      <td><a href="?accountId=${player.accountId}" class="player-link">${player.displayName ?? "Unknown"}</a></td>
      <td>${player.score ?? "N/A"}</td>
    `;

    // Attach a click handler to load the selected player's profile without full navigation.
    const link = row.querySelector('.player-link');
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      document.getElementById("accountInput").value = player.accountId;
      await fetchPlayerData();
      // closeSidebar(); // Close sidebar once a selection is made.
    });

    leaderboardList.appendChild(row);
  });
}

/**
 * Insert an error message into the leaderboard container.
 *
 * @param {string} message The error message to display.
 */
function showLeaderboardError(message) {
  document.getElementById("leaderboardList").innerHTML = `<tr><td colspan="3">${message}</td></tr>`;
}

// Ensure the sidebar is loaded once the DOM is fully ready.
document.addEventListener("DOMContentLoaded", loadSidebar);
