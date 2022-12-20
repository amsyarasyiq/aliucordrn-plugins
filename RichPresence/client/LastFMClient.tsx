import { Logger } from "aliucord/utils/Logger";
import { RPLogger } from "../utils/Logger";
import { Activity, ActivityTypes } from "../types/Activity";
import { Track } from "../types/Track";

export default class LastFMClient {
    apiKey: string;
    username?: string;
    logger: Logger;

    updateInterval?: NodeJS.Timer;

    constructor(apiKey) {
        this.apiKey = apiKey;
        this.logger = RPLogger;
    }

    setUsername(username: string) {
        if (username === "") {
            this.logger.error(`[instance: ${this.apiKey}] Username is empty`);
            throw new Error('Username is empty');
        }
        this.username = username;
        return this;
    }

    async stream(callback): Promise<NodeJS.Timer> {
        this.clear();
        let currentTrack = await this.fetchCurrentScrobble();
        if (currentTrack.nowPlaying)
            callback(currentTrack);

        const getUnixSecond = () => Date.now() / 1000 | 0;

        let lastCalled = getUnixSecond();

        return setInterval(async () => {
            const newTrack = await this.fetchCurrentScrobble();

            // stop RPC when the user hasn't scrobbled in 30 seconds
            if (!newTrack.nowPlaying && getUnixSecond() - lastCalled > 30) {
                // clearInterval(this.updateInterval);
                callback(null);
                return;
            }

            if (newTrack.url !== currentTrack.url && newTrack.nowPlaying) {
                currentTrack = newTrack;
                callback(currentTrack);
                lastCalled = getUnixSecond();
            }
        }, 10000);
    }

    clear() {
        this.updateInterval && clearInterval(this.updateInterval);
    }

    
    async fetchCurrentScrobble() {
        if (!this.username) {
            this.logger.error(`[instance: ${this.apiKey}] No username set`);
            throw new Error('No username set');
        }

        const params = new URLSearchParams({
            'method': 'user.getrecenttracks',
            'user': this.username,
            'api_key': this.apiKey,
            'format': 'json',
            'limit': '1',
            'extended': '1'
        }).toString();

        const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params}`).then(x => x.json());
        
        const trackDataParams = new URLSearchParams({
            method: 'track.getInfo',
            user: this.username,
            api_key: this.apiKey,
            format: 'json',
            artist: response.recenttracks.track[0].artist.name,
            track: response.recenttracks.track[0].name
        }).toString();

        // const trackData = await fetch(`http://ws.audioscrobbler.com/2.0/?${trackDataParams}`).then(x => x.json());
        
        const [track] = response.recenttracks.track;
        return this.mapTrack(track); //, trackData);
    }

    mapTrack(track) {   // mapTrack(track, trackData) {
        return {
            name: track.name,
            artist: track.artist.name,
            album: track.album['#text'],
            albumArt: this.polishAlbumArt(track.image[3]['#text']),
            url: track.url,
            date: track.date?.['#text'] ?? 'now',
            nowPlaying: Boolean(track['@attr']?.nowplaying),
            loved: track.loved === '1',
        }
    }

    mapToRPC(track : Track, settings): Activity | null {
        return track ? {
            name: 'Music',
            type: settings.get("lastfm_listening_to", false) ? ActivityTypes.LISTENING : ActivityTypes.GAME,
            details: track.name,
            state: `by ${track.artist}`,
            ...(settings.get("lastfm_show_album_art", true) && track.album ? {
                assets: {
                    large_image: track.albumArt,
                    large_text: `on ${track.album}`,
                    ...(track.loved && false ? { // todo
                        small_image: 'loved',
                        small_text: 'Loved' 
                    } : {})
                }
            } : {}),
            ...(settings.get("lastfm_add_ytm_button", false) ?  { buttons: [
                { label: 'Listen on Youtube Music', url: track.ytUrl }
            ]} : {}),
            application_id: settings.get("rpc_AppID", "463151177836658699")
        } : null
    }

    polishAlbumArt(albumArt) {
        const defaultCoverHashes = [
            "2a96cbd8b46e442fc41c2b86b821562f",
            "c6f59c1e5e7240a4c0d427abd71f3dbb",
        ];
    
        if (defaultCoverHashes.some(x => albumArt.includes(x))) {
            return undefined;
        }
        
        return albumArt;
    }
}