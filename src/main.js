import { parse, types, stringify } from 'hls-parser';
import axios from 'axios';
import webvtt from 'node-webvtt';

async function main() {
    let subtitlePlaylistUri = 'https://usanetwork.asset.viewlift.com/Renditions/20250819/1755617345638_usanetwork_HD_TVE_13GOINGON3_11012023_7830k_CUSTOM_CODEC_TS_DRM_DASH_DRM/cmafHls/subtitle_1.m3u8';
    const url = new URL(subtitlePlaylistUri);
    const base = url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
    console.log('Base URI:', base);

    const response = await axios.get(subtitlePlaylistUri);
    const subtitlePlaylistString = response.data;

    const playlist = parse(subtitlePlaylistString);

    if (playlist.isMasterPlaylist) {
    // Master playlist
    } else {
        
        let segmentStart = 0;
        // Media playlist
        const segments = playlist.segments;
        let previousVtt = null;

        for (let segment of segments) {
            const fullURL = new URL(segment.uri, base);
            let currentVtt = await vttParse(fullURL.href);
            if (previousVtt && previousVtt.cues.length > 0 && currentVtt.cues.length > 0) {
                let previousEndCue = previousVtt.cues[previousVtt.cues.length - 1];
                let currentStartCue = currentVtt.cues[0];

                if ((previousEndCue.start == currentStartCue.start) && (previousEndCue.end == currentStartCue.end) && (previousEndCue.text.includes("\n"+currentStartCue.text))) {
                    console.warn('Detected: Overlapping cue issue w/ 2nd half of merged CUE in 2nd segment after split: ' + fullURL.href);
                    console.log('Now Fixing....');
                    currentVtt.cues[0] = previousEndCue;
                    console.log(previousEndCue);
                    console.log(currentVtt.cues[0]);
                    console.log('');
                }
            }
            previousVtt = currentVtt;
        }
    }
}

async function vttParse(url) {
    const response = await axios.get(url);
    const parsed = webvtt.parse(response.data);
    //console.log(parsed);
    return parsed;
}

await main();