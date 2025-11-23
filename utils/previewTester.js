// utils/previewTester.js - Test which songs have previews

export const testSongPreviews = async (spotifyToken) => {
    // Popular songs that LIKELY have previews
    const songsToTest = [
      // Happy/Upbeat
      { name: 'Blinding Lights', artist: 'The Weeknd' },
      { name: 'Levitating', artist: 'Dua Lipa' },
      { name: 'Good 4 U', artist: 'Olivia Rodrigo' },
      { name: 'Heat Waves', artist: 'Glass Animals' },
      { name: 'Stay', artist: 'The Kid LAROI Justin Bieber' },
      { name: 'As It Was', artist: 'Harry Styles' },
      { name: 'Anti-Hero', artist: 'Taylor Swift' },
      { name: 'Flowers', artist: 'Miley Cyrus' },
      { name: 'Calm Down', artist: 'Rema Selena Gomez' },
      { name: 'Kill Bill', artist: 'SZA' },
      
      // Chill
      { name: 'Sunflower', artist: 'Post Malone Swae Lee' },
      { name: 'Circles', artist: 'Post Malone' },
      { name: 'The Night We Met', artist: 'Lord Huron' },
      { name: 'Ivy', artist: 'Frank Ocean' },
      { name: 'Swim', artist: 'Chase Atlantic' },
      
      // Energetic
      { name: 'Industry Baby', artist: 'Lil Nas X Jack Harlow' },
      { name: 'HUMBLE', artist: 'Kendrick Lamar' },
      { name: 'Sicko Mode', artist: 'Travis Scott' },
      { name: 'God\'s Plan', artist: 'Drake' },
      { name: 'Starboy', artist: 'The Weeknd' },
      
      // Focused/Calm
      { name: 'Breathe', artist: 'Télépopmusik' },
      { name: 'Porcelain', artist: 'Moby' },
      { name: 'Teardrop', artist: 'Massive Attack' },
      { name: 'Intro', artist: 'The xx' },
      { name: 'Holocene', artist: 'Bon Iver' },
      
      // Sad
      { name: 'drivers license', artist: 'Olivia Rodrigo' },
      { name: 'Someone You Loved', artist: 'Lewis Capaldi' },
      { name: 'When the Party\'s Over', artist: 'Billie Eilish' },
      { name: 'Traitor', artist: 'Olivia Rodrigo' },
      
      // Romantic
      { name: 'Perfect', artist: 'Ed Sheeran' },
      { name: 'All of Me', artist: 'John Legend' },
      { name: 'Lover', artist: 'Taylor Swift' },
      { name: 'Enchanted', artist: 'Taylor Swift' },
    ];
  
    const songsWithPreviews = [];
    const songsWithoutPreviews = [];
  
    console.log('🔍 Testing songs for previews...\n');
  
    for (const song of songsToTest) {
      try {
        // Search for the song
        const searchQuery = `${song.name} ${song.artist}`.replace(/&/g, '');
        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`,
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          
          if (data.tracks.items.length > 0) {
            const track = data.tracks.items[0];
            
            if (track.preview_url) {
              songsWithPreviews.push({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                preview_url: track.preview_url,
                uri: track.uri,
              });
              console.log(`✅ ${song.name} - ${song.artist} (HAS PREVIEW)`);
            } else {
              songsWithoutPreviews.push(song);
              console.log(`❌ ${song.name} - ${song.artist} (NO PREVIEW)`);
            }
          }
        }
        
        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error testing ${song.name}:`, error);
      }
    }
  
    console.log('\n📊 Results:');
    console.log(`Songs WITH previews: ${songsWithPreviews.length}`);
    console.log(`Songs WITHOUT previews: ${songsWithoutPreviews.length}`);
    
    // Log the working songs in a format you can copy
    console.log('\n📋 Copy this array to use in your app:\n');
    console.log(JSON.stringify(songsWithPreviews, null, 2));
  
    return { songsWithPreviews, songsWithoutPreviews };
  };