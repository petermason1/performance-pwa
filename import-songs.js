// Import script for songs
const songsData = `Arctic Monkeys - Bet You Look Good on the Dance Floor	204
Arctic Monkeys - Mardy Bum	112
Ben E. King - Stand By Me	118
Blink 182 - All The Small Things	152
Blur - Country House	175	A
Blur - Parklife	139
Bruno Mars - Uptown Funk	115	C
Bryan Adams - Summer of 69	139	D
Buzzcocks - Ever Fallen In Love	176
Ed Sheeran - Castle on the Hill	135	D
Ed Sheeran - Thinking Out Loud	79	D
Elvis Presley - Burning Love	144	D
Elvis Presley - Suspicious Minds	117	G
Erasure - A Little Respect	115	C
Feeder - Buck Rogers	121	F
Fountains Of Wayne - Stacey's Mom	118	B
Frankie Valli - Can't Take My Eyes Off You	124
Franz Ferdinand - Take Me Out	104
George Ezra - Shotgun	116
Gerry Cinnamon - Belter	127	A
Gloria Jones - Tainted Love	166
Green Day - Basket Case	170
Green Day - Good Riddance (Time of Your Life)	95	G
James - Sit Down	126
Jason Mraz - I'm Yours	151	B major
John Legend (Acoustic) - All of Me	120
Kaiser Chiefs - I Predict a Riot	159
Kings of Leon - Sex on Fire	153	A
Kings of Leon - Use Somebody	137	C
Madness - It Must Be Love	146	G
Mark Ronson/Amy Winehouse - Valerie	212
Mumford and Sons - Little Lion Man	139	F
Neil Diamond - Sweet Caroline	126	B
Oasis - Cigarettes and Alcohol	115	D
Oasis - Don't Look Back In Anger	82
Oasis - She's Electric	125
Oasis - Wonderwall	88
Ocean Colour Scene - The Day We Caught The Train	89
Pulp - Common People	145	C
Pulp - Disco 2000	133
Queen - Crazy Little Thing Called Love	154
Razorlight - In The Morning	124	E
Reef - Place Your Hands	109	D
Sam Fender - Hypersonic Missiles	131	E
Sam Fender - Seventeen Going Under	162
Sam Fender - Will We Talk?	204
Sixties Medley	137, 136, 160
Snow Patrol - Chasing Cars	104	A
Stealers Wheels - Stuck in The Middle with You	124
Stereophonics - Dakota	147
Stevie Wonder - Superstition	101
The Stone Roses - She Bangs the Drums	145	A
The Beatles - Eight Days a Week	138
The Beatles - Saw Her Standing There	160
The Clash - I Fought The Law	151	D
The Clash - Should I Stay or Should I Go	113	D
The Coral - Dreaming of You	199	A
The Courteeners - Not Nineteen Forever	140	D
The Cure - Love Cats	92
The Fratellis - Chelsea Dagger	155	G
The Jam - Going Underground	181	B
The Jam - Town Called Malice	204
The Killers - All These Things I Have Done	118
The Killers - Human	135
The Killers - Mr. Brightside	148
The Kinks - You Really Got Me	137
The Kooks - Naïve	103
The Lumineers - Ho, Hey!	80
The Police - Message In a Bottle	151
The Proclaimers - 500 Miles	132	E
The Rolling Stones - (I Can't Get No) Satisfaction	136
The Smiths - This Charming Man	208
The Stone Roses - Waterfall	104	B
The Strokes - Last Night	208
The Undertones - Teenage Kicks	135
Tina/Ike Turner - Proud Mary	171
Walk the Moon - Shut Up and Dance	128
Wheatus - Teenage Dirtbag	95	E
CCR - Bad Moon Rising	179
Wizard - Wish It Could Be Xmas	140
Lizzo - About Damn Time	109
Slade - Merry Xmas Everybody	130
Shakin Stevens - Merry Xmas Everyone	204
Kenny Loggins - Footloose	174
Dua Lipa - Don't Start Now	124
Miley Cyrus - Flowers	116`;

function parseAndImportSongs() {
    const lines = songsData.split('\n').filter(line => line.trim());
    const songs = [];
    
    lines.forEach((line) => {
        // Parse line - tab or multiple spaces
        const parts = line.split(/\t|\s{2,}/).filter(p => p.trim());
        
        if (parts.length < 2) {
            // Try single space split
            const spaceParts = line.trim().split(/\s+/);
            if (spaceParts.length >= 2) {
                const bpmMatch = spaceParts[spaceParts.length - 1].match(/\d+/);
                if (bpmMatch) {
                    const bpm = parseInt(bpmMatch[0]);
                    const songName = spaceParts.slice(0, -1).join(' ');
                    parseSong(songName, bpm, line, songs);
                    return;
                }
            }
            return;
        }
        
        // Find BPM
        let songName = parts[0].trim();
        let bpm = null;
        let key = '';
        
        for (let i = parts.length - 1; i >= 0; i--) {
            const num = parseInt(parts[i]);
            if (!isNaN(num) && num >= 40 && num <= 300) {
                bpm = num;
                songName = parts.slice(0, i).join(' ').trim();
                if (i + 1 < parts.length) {
                    const keyCandidate = parts[i + 1].trim();
                    if (/^[A-G](?:major|minor|maj|min)?$/i.test(keyCandidate)) {
                        key = keyCandidate;
                    }
                }
                break;
            }
        }
        
        if (songName && bpm) {
            parseSong(songName, bpm, key || '', songs);
        }
    });
    
    return songs;
}

function parseSong(songName, bpm, keyOrLine, songs) {
    // Extract artist if format is "Artist - Song"
    let artist = '';
    let title = songName;
    
    if (songName.includes(' - ')) {
        const artistParts = songName.split(' - ');
        artist = artistParts[0].trim();
        title = artistParts.slice(1).join(' - ').trim();
    }
    
    // Extract key if it's a string, otherwise check the line
    let key = '';
    if (typeof keyOrLine === 'string') {
        const keyMatch = keyOrLine.match(/\b([A-G](?:\s*(?:major|minor|maj|min))?)\b/i);
        if (keyMatch) {
            key = keyMatch[1];
        }
    }
    
    // Handle special case: Sixties Medley with multiple BPMs
    if (title.includes('Sixties Medley') && bpm.toString().includes(',')) {
        // Use first BPM
        bpm = 137;
    }
    
    songs.push({
        name: title,
        artist: artist,
        bpm: bpm,
        timeSignature: 4,
        helixPreset: key,
        lyrics: [],
        midiNotes: [],
        accentPattern: null  // No accents by default (all beats same)
    });
}

// Import to localStorage (one-time import)
if (typeof window !== 'undefined' && window.localStorage) {
    // Check if we've already imported (look for a marker)
    const importedMarker = localStorage.getItem('songsImported_v1');
    
    if (!importedMarker) {
        const songs = parseAndImportSongs();
        
        // Get existing data
        const existing = localStorage.getItem('performanceApp');
        let data = existing ? JSON.parse(existing) : { songs: [], setLists: [] };
        
        // Add all songs (skip duplicates by name)
        const existingNames = new Set(data.songs.map(s => s.name.toLowerCase()));
        let added = 0;
        
        songs.forEach(song => {
            if (!existingNames.has(song.name.toLowerCase())) {
                song.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                song.createdAt = new Date().toISOString();
                data.songs.push(song);
                existingNames.add(song.name.toLowerCase());
                added++;
            }
        });
        
        localStorage.setItem('performanceApp', JSON.stringify(data));
        localStorage.setItem('songsImported_v1', 'true');
        
        console.log(`Imported ${added} songs. Total songs: ${data.songs.length}`);
        // Small delay so page can load, then show alert
        setTimeout(() => {
            alert(`Imported ${added} new songs! Total: ${data.songs.length} songs. They're now available in the Songs tab.`);
        }, 500);
    }
}

