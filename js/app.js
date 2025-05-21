let isFetching = false; // Track request state

async function fetchPlayerData() {
    if (isFetching) return; // Prevent multiple requests

    const accountId = document.getElementById("accountInput").value.trim();

    if (!accountId) {
        showError("Please enter a valid Account ID.");
        return;
    }

    const statsUrl = `https://prod01.platform.impl.lunchboxentertainmentapps.com/api/v1/accounts/${accountId}/stats`;
    const entryUrl = `https://prod01.platform.impl.lunchboxentertainmentapps.com/api/v1/leaderboards/MMR/entry/${accountId}`;

    showLoadingState(true);
    isFetching = true; // Activate cooldown

    try {
        const [statsRes, entryRes] = await Promise.all([
            fetchJson(statsUrl),
            fetchJson(entryUrl)
        ]);

        updateUI(statsRes.stats, entryRes.entry);
    } catch (error) {
        console.warn("Error fetching player data:", error);
        showError("Failed to load profile data. Please check the Account ID.");
    } finally {
        showLoadingState(false);
        setTimeout(() => {
            isFetching = false; // Reset cooldown after 1 second
        }, 1000);
    }
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
        rank: entry?.rank ?? "N/A",
        score: entry?.score ?? "N/A",
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        draws: stats?.draws ?? 0,
        totalGames: (stats?.wins ?? 0) + (stats?.losses ?? 0) + (stats?.draws ?? 0),
        winPercentage: ((stats?.wins ?? 0) / ((stats?.wins ?? 0) + (stats?.losses ?? 0) + (stats?.draws ?? 0)) * 100).toFixed(2) + "%",
        winStreak: stats?.winStreak ?? 0,
        lossStreak: stats?.lossStreak ?? 0,
        maxWinStreak: stats?.maxWinStreak ?? 0,
        maxLossStreak: stats?.maxLossStreak ?? 0
    };

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
    // When not loading, do nothing—updateUI or showError will handle the display text.
}

/**
 * Displays an error message in the UI.
 */
function showError(message) {
    document.getElementById("displayName").innerText = message;
}

// Listen for keydown events on the account input field.
document.getElementById("accountInput").addEventListener("keydown", async function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent any default behavior (like form submission)
        try {
            await fetchPlayerData();
        } catch (error) {
            console.error("Error during fetchPlayerData:", error);
        }
    }
});

