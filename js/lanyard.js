(() => {
  /* ---------- Discord presence via Lanyard ---------- */
  const presence = document.getElementById('discord-presence');
  const presenceName = document.getElementById('discord-name');
  const presenceStatus = document.getElementById('discord-status');
  const presenceActivity = document.getElementById('discord-activity');
  const avatar = document.getElementById('discord-avatar');
  const avatarFallback = document.getElementById('discord-avatar-fallback');
  const lanyardUrl = 'https://api.lanyard.rest/v1/users/938080309730246677';
  const statusLabels = {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do not disturb',
    offline: 'Offline',
  };

  avatar.addEventListener('error', () => {
    avatar.hidden = true;
    avatarFallback.hidden = false;
  });

  function describeActivity(data) {
    if (data.spotify && data.listening_to_spotify) {
      const spotify = data.spotify;
      return 'Listening to ' + spotify.song + (spotify.artist ? ' by ' + spotify.artist : '');
    }
    const activity = (data.activities || []).find((item) => item && item.type !== 4);
    if (!activity) {
      return data.discord_status === 'offline'
        ? 'Not currently sharing an activity'
        : 'No activity shared right now';
    }
    const verbs = { 0: 'Playing', 2: 'Listening to', 3: 'Watching' };
    const title = activity.name || activity.details || 'Discord activity';
    const details = [activity.details, activity.state].filter(Boolean).join(' · ');
    return (
      (verbs[activity.type] ? verbs[activity.type] + ' ' : '') +
      title +
      (details && details !== title ? ' — ' + details : '')
    );
  }

  async function refreshDiscordPresence() {
    try {
      const response = await fetch(lanyardUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Lanyard returned HTTP ' + response.status);
      }
      const result = await response.json();
      if (!result || result.success !== true || !result.data || !result.data.discord_user) {
        throw new Error('Lanyard returned no Discord presence data.');
      }

      const data = result.data;
      const user = data.discord_user;
      presence.dataset.state = statusLabels[data.discord_status] ? data.discord_status : 'unknown';
      presenceStatus.textContent = statusLabels[data.discord_status] || 'Unknown';
      presenceName.textContent = user.username ? '@' + user.username : 'Discord user';
      presenceActivity.textContent = describeActivity(data);

      if (user.avatar) {
        const extension = user.avatar.indexOf('a_') === 0 ? 'gif' : 'png';
        avatar.hidden = false;
        avatarFallback.hidden = true;
        avatar.src =
          'https://cdn.discordapp.com/avatars/' +
          encodeURIComponent(user.id) +
          '/' +
          encodeURIComponent(user.avatar) +
          '.' +
          extension +
          '?size=96';
      } else {
        avatar.hidden = true;
        avatarFallback.hidden = false;
      }
    } catch (error) {
      presence.dataset.state = 'unavailable';
      presenceStatus.textContent = 'Unavailable';
      presenceActivity.textContent = 'Could not load Discord presence. Please try again later.';
      console.error('Lanyard presence request failed.', error);
    }
  }

  refreshDiscordPresence();
  window.setInterval(refreshDiscordPresence, 60000);
})();
