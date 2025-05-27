let isFetching = false; // Track request state
const CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour

document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('accountId');
    if (accountId) {
        document.getElementById("accountInput").value = accountId;
        await fetchPlayerData(false, false); // Auto-fetch data if accountId is present
    }
});

window.addEventListener('popstate', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('accountId');
    document.getElementById("accountInput").value = accountId || '';

    if (accountId) {
        await fetchPlayerData(true, false); // Use cache when navigating back/forward
    }
});

/**
 * Fetches player data, handling cache and UI updates.
 */
async function fetchPlayerData(fromPopState = false, forceRefresh = false) {
    if (isFetching) return;

    const accountId = document.getElementById("accountInput").value.trim();
    if (!accountId) {
        showError("Please enter a valid Account ID.");
        return;
    }

    if (handleCacheAndUI(accountId, fromPopState, forceRefresh)) return; // Uses cached data if possible

    showLoadingState(true);
    isFetching = true;

    try {
        const profileData = await fetchProfileData(accountId);
        cacheProfile(accountId, profileData);
        updateUI(profileData.stats, profileData.entry);
        updateURL(accountId, fromPopState); // Update URL after successful fetch
    } catch (error) {
        console.warn("Error fetching player data:", error);
        showError("Failed to load profile data. Please check the Account ID.");
    } finally {
        showLoadingState(false);
        setTimeout(() => { isFetching = false; }, 1000);
    }
}

/**
 * Handles cached data and UI updates if available.
 */
function handleCacheAndUI(accountId, fromPopState, forceRefresh) {
    const cachedProfile = getCachedProfile(accountId);
    if (cachedProfile && !fromPopState && !forceRefresh) {
        updateUI(cachedProfile.stats, cachedProfile.entry);
        updateURL(accountId, fromPopState); // Ensure URL is updated when using cache
        return true; // Skip API request
    }
    return false;
}

/**
 * Fetches player stats and leaderboard data from API.
 */
async function fetchProfileData(accountId) {
    const [statsRes, entryRes] = await Promise.all([
        fetchJson(`https://prod01.platform.impl.lunchboxentertainmentapps.com/api/v1/accounts/${accountId}/stats`),
        fetchJson(`https://prod01.platform.impl.lunchboxentertainmentapps.com/api/v1/leaderboards/MMR/entry/${accountId}`)
    ]);
    return { stats: statsRes.stats, entry: entryRes.entry };
}

/**
 * Updates browser history unless triggered by popstate.
 */
function updateURL(accountId, fromPopState) {
    if (!fromPopState) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('accountId', accountId);
        window.history.pushState({}, '', newUrl);
    }
}

// Cache functions
function cacheProfile(accountId, data) {
    const payload = { data, timestamp: Date.now() };
    sessionStorage.setItem(`player_${accountId}`, JSON.stringify(payload));
}

function getCachedProfile(accountId) {
    const cachedData = sessionStorage.getItem(`player_${accountId}`);
    if (!cachedData) return null;

    const { data, timestamp } = JSON.parse(cachedData);
    return (Date.now() - timestamp < CACHE_EXPIRATION_TIME) ? data : null;
}

/**
 * Fetches and returns JSON from a given URL.
 */
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Updates the UI with retrieved player data.
 */
function updateUI(stats, entry) {
    const profileData = {
        displayName: entry?.displayName || "Unknown Player",
        rank: entry?.rank !== undefined ? entry.rank + 1 : "N/A",
        score: entry?.score ?? "N/A",
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        draws: stats?.draws ?? 0,
        totalGames: (stats?.wins ?? 0) + (stats?.losses ?? 0),
        winPercentage: ((stats?.wins ?? 0) / ((stats?.wins ?? 0) + (stats?.losses ?? 0)) * 100).toFixed(2) + "%",
        winStreak: stats?.winStreak ?? 0,
        lossStreak: stats?.lossStreak ?? 0,
        maxWinStreak: stats?.maxWinStreak ?? 0,
        maxLossStreak: stats?.maxLossStreak ?? 0
    };

    document.title = `${profileData.displayName} - Player Profile`;

    Object.entries(profileData).forEach(([key, value]) => {
        document.getElementById(key).innerText = value;
    });
}

/**
 * Shows a loading state in the UI.
 */
function showLoadingState(isLoading) {
    if (isLoading) {
        document.getElementById("displayName").innerText = "Loading...";
    }
}

/**
 * Displays an error message in the UI.
 */
function showError(message) {
    document.getElementById("displayName").innerText = message;
}

// Event listeners
document.getElementById("accountInput").addEventListener("keydown", async function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        await fetchPlayerData(false, true);
    }
});

document.getElementById("helpButton").addEventListener("click", function() {
    const helpModal = document.getElementById("helpModal");
    helpModal.open ? closeHelpModal() : helpModal.showModal();
});

function closeHelpModal() {
    document.getElementById("helpModal").close();
}

const drawsElement = document.getElementById("draws");
if (drawsElement) {
    drawsElement.parentElement.style.textDecoration = "line-through";
}
