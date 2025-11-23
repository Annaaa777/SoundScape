import OpenAI from 'openai'; 
import { OPENAI_KEY } from '../utils/constants'; 

const openai = new OpenAI({ apiKey: OPENAI_KEY, });

export const generatePlaylistPrompt = async ({
  mood,
  weather,
  traffic,
  duration,
  userTracks,
  preferencesText,
  trackNumber = 0, // ⭐ NEW: which song number we're on
}) => {
  try {
    const durationMins = Math.round(duration / 60);
    const tracksToUse = Math.min(100, userTracks.length);

    const trackList = userTracks
      .slice(0, tracksToUse)
      .map((track, idx) => {
        const parts = [
          `${idx + 1}. "${track.name}" by ${track.artist}`,
          `(valence: ${track.valence ?? 'unknown'}`,
          `energy: ${track.energy ?? 'unknown'}`,
          `danceability: ${track.danceability ?? 'unknown'}`,
          `tempo: ${track.tempo ? Math.round(track.tempo) + ' BPM' : 'unknown'}`,
          `acousticness: ${track.acousticness ?? 'unknown'}`,
          `instrumentalness: ${track.instrumentalness ?? 'unknown'})`,
        ];
        return parts.join(', ');
      })
      .join('\n');

    const songsNeeded = Math.max(12, Math.min(20, Math.ceil(durationMins / 3)));

    const preferenceSection = preferencesText
      ? `LEARNED USER PREFERENCES:\n${preferencesText}\n`
      : 'LEARNED USER PREFERENCES:\n- No explicit feedback yet. Use general good-driving defaults.\n';

    // ⭐ IMPORTANT: For first 3 songs, emphasize MOOD ONLY
    const priorityNote = trackNumber < 3
      ? `\n🎯 CRITICAL: This is song #${trackNumber + 1} of the trip. For the FIRST 2-3 SONGS, PRIORITIZE THE USER'S CHOSEN MOOD (${mood}) ABOVE ALL ELSE. Ignore weather and traffic for initial songs.\n`
      : `\n🎯 NOTE: This is song #${trackNumber + 1}. You can now adjust for weather (${weather.condition}) and traffic (${traffic.level}) while still respecting mood.\n`;

    const contextRules = getContextRules(weather, traffic, mood);
    const selectionRules = getSelectionRules(weather, traffic, mood, trackNumber);

    const prompt = `You are an expert music curator for driving experiences.

${preferenceSection}
${priorityNote}

CURRENT DRIVING CONTEXT:
- Mood/Vibe: ${mood}
- Weather: ${weather.condition} (${weather.description}), ${weather.temperature}°C
- Traffic: ${traffic.level}
- Duration: ${durationMins} minutes

${contextRules}

USER'S AVAILABLE SONGS (${tracksToUse} total):
${trackList}

TASK: Select exactly ${songsNeeded} songs that match the context.

SELECTION RULES:
${selectionRules}

OUTPUT FORMAT (JSON only):
{
  "selectedTracks": [song indices from 1-${tracksToUse}],
  "reasoning": "One sentence explaining the selection"
}

Respond with ONLY valid JSON.`;

    console.log('🤖 Calling OpenAI API...');
    console.log(`📊 Track #${trackNumber + 1}: mood=${mood}, weather=${weather.condition}, traffic=${traffic.level}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional music curator who ONLY responds with valid JSON. You prioritize user mood for initial songs, then adjust for driving conditions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content.trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      const jsonString = content
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();
      result = JSON.parse(jsonString);
    }

    if (!result.selectedTracks || !Array.isArray(result.selectedTracks)) {
      throw new Error('Invalid AI response format');
    }

    const selectedTracks = result.selectedTracks
      .map((idx) => userTracks[idx - 1])
      .filter(Boolean);

    console.log(`✅ AI selected ${selectedTracks.length} songs`);
    if (result.reasoning) {
      console.log(`   Reasoning: ${result.reasoning}`);
    }

    if (selectedTracks.length < 8) {
      console.warn('⚠️ Padding playlist with random selections');
      const remaining = userTracks
        .filter((t) => !selectedTracks.find((st) => st.id === t.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 10 - selectedTracks.length);
      selectedTracks.push(...remaining);
    }

    return {
      tracks: selectedTracks,
      reasoning: result.reasoning || '',
    };
  } catch (error) {
    console.error('❌ Error generating playlist:', error.message);
    throw error;
  }
};

// Update getSelectionRules to include trackNumber
function getSelectionRules(weather, traffic, mood, trackNumber = 0) {
  const rules = [];

  // ⭐ PRIORITY: First 3 songs = MOOD ONLY
  if (trackNumber < 3) {
    rules.push(`\n🎯 TOP PRIORITY FOR SONGS 1-3: Match the user's MOOD (${mood}) perfectly. IGNORE weather and traffic for now.\n`);
  }

  // Rest of your existing rules...
  if (mood === 'sad' || mood === 'melancholy') {
    rules.push('- For SAD mood: valence < 0.45, tempo 60-115 BPM');
  }

  if (mood === 'energetic' || mood === 'hype') {
    rules.push('- For ENERGETIC mood: valence > 0.5, energy > 0.7, tempo > 115 BPM');
  }

  if (mood === 'focus' || mood === 'chill') {
    rules.push('- For FOCUS/CHILL: energy < 0.65, prefer instrumental');
  }

  if (traffic.level === 'heavy' && trackNumber >= 3) {
    rules.push('- HEAVY TRAFFIC: avoid aggressive songs, prefer calm (energy < 0.7)');
  }

  if ((weather.condition === 'Rain' || weather.condition === 'Drizzle') && trackNumber >= 3) {
    rules.push('- RAIN: favor cozy, introspective tracks');
  }

  return rules.join('\n');
}

// Keep getContextRules as is
function getContextRules(weather, traffic, mood) {
  const parts = [];

  if (weather.condition === 'Rain' || weather.condition === 'Drizzle') {
    parts.push('🌧️ RAINY: Cozy, mellow music preferred');
  } else if (weather.condition === 'Clear' && weather.temperature > 20) {
    parts.push('☀️ SUNNY: Upbeat, feel-good music works well');
  }

  if (traffic.level === 'heavy' || traffic.level === 'severe') {
    parts.push('🚗 HEAVY TRAFFIC: Calm, steady music for safety');
  } else if (traffic.level === 'light') {
    parts.push('🛣️ LIGHT TRAFFIC: More energetic tracks are safe');
  }

  return parts.join('\n');
}
