registerPlugin({
    name: 'WelcomeSound',
    version: '2.1',
    description: 'This script will let the bot greet everyone with a track and resume the last track or stream.',
    author: 'TS3index.com <info@ts3index.com>',
    vars: [
        {
            name: 'channelId',
            title: 'Default Channel (Lobby):',
            type: 'channel',
            placeholder : 'Channel ID'
        },
        {
            name: 'track',
            title: 'Sound File:',
            type: 'track',
            placeholder: 'Search for track...'
        },
        {
            name: 'resume',
            title: 'Resume last track or stream after welcomesound',
            type: 'checkbox'
        }
    ]
}, function(sinusbot, config) {
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');
    var media = require('media');
    var audio = require('audio');
    
    if (!config || typeof config.channelId == 'undefined' || typeof config.track == 'undefined' || !config.channelId || !config.track) {
      engine.log("Settings invalid.");
      return;
    }
    if (isNaN(config.channelId)) {
        if (engine.isRunning() && backend.isConnected()) {
            engine.log("No valid Channel ID, search Channel...");
            var channel = backend.getChannelByName(config.channelId);
            if (typeof channel == 'undefined' || channel.id() < 1) {
                engine.log("No Channel found, Settings invalid... Script not loaded.");
                return;
            } else {
                engine.log("Channel '" + channel.name() + "' with ID '" + channel.id() + "' found, Settings improved.");
                config.channelId = channel.id();
                engine.saveConfig(config);
            }
        } else {
            engine.log("No valid Channel ID and Instance is not running... Script not loaded.");
            return;
        }
    }
    
    // EngineV1 > EngineV2
    if (typeof config.resume == 'string') {
        if (config.resume == 0) config.resume = false;
        if (config.resume == 1) config.resume = true;
        engine.saveConfig(config);
    }

    var resumePlayback = false;
    var resumeTrack = false;
    var resumePlaylist = false;
    var resumePos = 0;
    
    var securejoin = true;

    var getUUID = function (url) {
        var match = url.match(/track:\/\/(\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0)
            return match[2];
        else
            return null;
    }
    
    var check = function (member) {
        if (typeof member == 'undefined')
            return false;
        else
            return member;
    }
    
    event.on('clientMove', function(ev) {
        if (!backend.isConnected()) return;
        if (ev.client.isSelf()) return;
        if (typeof ev.toChannel == 'undefined') return;
        
        if (ev.toChannel.id() == config.channelId && backend.getCurrentChannel().id() == config.channelId) {
            engine.log("Welcome-Sound starting...");
            var currentTrack = check(media.getCurrentTrack());
            if (config.resume && audio.isPlaying() && currentTrack && (check(currentTrack.id()) || check(currentTrack.Type()) == 'url') && (check(currentTrack.id()) != getUUID(config.track.url))) {
                resumePlayback = true;
                resumePos = check(audio.getTrackPosition());
                resumeTrack = currentTrack;
                resumePlaylist = (check(media.getActivePlaylist())) ? check(media.getActivePlaylist().id()) : false;
                media.playURL(config.track.url + '&callback=welcomesound&copy=true');
            } else if (resumePlayback) {
                securejoin = false;
                media.playURL(config.track.url + '&callback=welcomesound&copy=true');
            } else {
                media.playURL(config.track.url);
            }
        }
    });
    
    event.on('trackEnd', function(ev, callback) {
        if (check(callback) == 'welcomesound' && resumePlayback) {
            if (securejoin && resumeTrack) {
                engine.log("Resume last track: " + check(resumeTrack.Title()));
                resumePlayback = false;
                if (check(resumeTrack.Type()) == 'url' && check(resumeTrack.Filename())) {
                  media.playURL(resumeTrack.Filename());
                } else if (check(resumeTrack.id())) {
                  audio.setMute(true);
                  if (resumePlaylist) media.getPlaylistByID(resumePlaylist).setActive();
                  media.playURL("track://" + resumeTrack.id());
                  audio.seek(resumePos);
                  audio.setMute(false);
                }
            }
            securejoin = true;
        }
    });
});
