// services/feedback.js
//
// Handles user feedback:
// - Track-level actions: skipped / loved / bad_fit
// - Trip-level ratings: great / meh / bad
// - Summarizes feedback into a short preference string for the AI
//
// Data is stored per-username in AsyncStorage, so each user has their own profile.

import AsyncStorage from '@react-native-async-storage/async-storage';

// Build a unique key per username so feedback is user-specific
function getKey(username) {
  return `vibenav_feedback_${username}`;
}

/**
 * Low-level helper to append a feedback entry for a given user.
 * @param {string} username
 * @param {object} entry
 */
export async function logFeedback(username, entry) {
  if (!username) {
    console.warn('logFeedback called without username, skipping');
    return;
  }

  try {
    const key = getKey(username);
    const raw = await AsyncStorage.getItem(key);
    const logs = raw ? JSON.parse(raw) : [];

    logs.push({
      ...entry,
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    console.error('Error logging feedback:', e);
  }
}

/**
 * Read all feedback logs for a given user.
 * @param {string} username
 * @returns {Promise<Array>}
 */
export async function getFeedbackLogs(username) {
  if (!username) return [];
  try {
    const key = getKey(username);
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading feedback logs:', e);
    return [];
  }
}

/**
 * Convenience helper for track-level feedback (skip / love / bad_fit).
 */
export async function logTrackAction(username, {
  track,
  action,      // 'skipped' | 'loved' | 'bad_fit'
  mood,
  vibe,
  weather,
  traffic,
}) {
  if (!track || !username) return;

  await logFeedback(username, {
    type: 'track_action',
    action,
    trackId: track.id,
    trackName: track.name,
    artist: track.artist,
    mood,
    vibe,
    weather: weather?.condition,
    traffic: traffic?.level,
  });
}

/**
 * Convenience helper for trip-level feedback (great / meh / bad).
 */
export async function logTripRating(username, {
  rating,      // 'great' | 'meh' | 'bad'
  mood,
  vibe,
  weather,
  traffic,
}) {
  if (!username) return;

  await logFeedback(username, {
    type: 'trip_rating',
    rating,
    mood,
    vibe,
    weather: weather?.condition,
    traffic: traffic?.level,
  });
}

/**
 * Internal: turn raw logs into a short human-readable summary
 * that we can embed into the OpenAI prompt.
 *
 * Now uses:
 * - track actions: 'skipped' + 'bad_fit' as negative, 'loved' as positive
 * - trip ratings: 'great' / 'meh' / 'bad' for overall quality
 */
function summarizePreferences(logs) {
  if (!logs.length) {
    return 'No explicit feedback yet. Use general good-driving-music defaults.';
  }

  // Track-level signal
  let rainSkips = 0;
  let rainLoves = 0;
  let heavyFocusSkips = 0;
  let heavyFocusLoves = 0;
  let hypeClearLoves = 0;

  // Trip-level signal
  let greatTrips = 0;
  let mehTrips = 0;
  let badTrips = 0;

  logs.forEach((log) => {
    if (log.type === 'track_action') {
      const { action, weather, traffic, vibe } = log;
      const isNegative = action === 'skipped' || action === 'bad_fit';

      // Normalize some conditions a bit
      const w = weather;
      const t = traffic;

      // "Rain family" = Rain / Drizzle / Thunderstorm
      const isRainy =
        w === 'Rain' ||
        w === 'Drizzle' ||
        w === 'Thunderstorm';

      // "Clear-ish" = Clear / Clouds
      const isClearish =
        w === 'Clear' ||
        w === 'Clouds';

      // Heavy / severe traffic
      const isHeavyTraffic =
        t === 'heavy' ||
        t === 'severe';

      // 1) Rainy vs non-rainy
      if (isRainy) {
        if (isNegative) rainSkips++;
        if (action === 'loved') rainLoves++;
      }

      // 2) Heavy traffic + focus vibe
      if (isHeavyTraffic && vibe === 'focus') {
        if (isNegative) heavyFocusSkips++;
        if (action === 'loved') heavyFocusLoves++;
      }

      // 3) Clear weather + hype/energetic vibe
      if (isClearish && (vibe === 'hype' || vibe === 'energetic')) {
        if (action === 'loved') hypeClearLoves++;
      }
    }

    if (log.type === 'trip_rating') {
      if (log.rating === 'great') greatTrips++;
      else if (log.rating === 'meh') mehTrips++;
      else if (log.rating === 'bad') badTrips++;
    }
  });

  const lines = [];

  // --- Track-level preferences ---

  const totalRainActions = rainSkips + rainLoves;
  if (totalRainActions >= 3) {
    if (rainSkips > rainLoves) {
      lines.push(
        '- In rainy conditions, user often skips or marks tracks as bad fit; avoid overly mellow or sleepy rain music.'
      );
    } else if (rainLoves > rainSkips) {
      lines.push(
        '- In rainy conditions, user enjoys cozy / mellow tracks; leaning into chill rain vibes is okay.'
      );
    }
  }

  const totalHeavyFocusActions = heavyFocusSkips + heavyFocusLoves;
  if (totalHeavyFocusActions >= 3) {
    if (heavyFocusSkips > heavyFocusLoves) {
      lines.push(
        '- In heavy traffic with focus vibe, user often dislikes the music; try slightly more uplifting but still non-stressful tracks.'
      );
    } else if (heavyFocusLoves > heavyFocusSkips) {
      lines.push(
        '- In heavy traffic with focus vibe, current calm / focus style works well; keep similar low-distraction tracks.'
      );
    }
  }

  if (hypeClearLoves >= 2) {
    lines.push(
      '- In clear weather with hype/energetic vibe, user tends to love energetic tracks; high-energy songs are a good choice here.'
    );
  }

  // --- Trip-level preferences ---

  const totalTrips = greatTrips + mehTrips + badTrips;
  if (totalTrips >= 3) {
    if (greatTrips >= badTrips + 2) {
      lines.push(
        '- Overall, trips are often rated great; current strategy is mostly good, so only subtle adjustments are needed.'
      );
    } else if (badTrips >= greatTrips + 1) {
      lines.push(
        '- User often rates trips as bad; be conservative, avoid extreme genre shifts, and stay closer to safe, widely-liked tracks.'
      );
    } else if (mehTrips > greatTrips && mehTrips > badTrips) {
      lines.push(
        '- Many trips are rated as “meh”; increase variety within the chosen vibe so playlists feel less repetitive.'
      );
    }
  }

  if (!lines.length) {
    lines.push(
      '- No strong patterns detected yet; use general good-driving-music defaults and balanced choices.'
    );
  }

  return lines.join('\n');
}


/**
 * Public: get a short preference summary string for a given user.
 */
export async function getPreferenceSummary(username) {
  const logs = await getFeedbackLogs(username);
  return summarizePreferences(logs);
}
