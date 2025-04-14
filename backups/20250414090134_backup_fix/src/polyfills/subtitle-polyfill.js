// Polyfill pour le module subtitle
export function parse(content, options = {}) {
  const lines = content.split('\n');
  const subtitles = [];
  let currentSub = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (/^\d+$/.test(line)) {
      if (currentSub) subtitles.push(currentSub);
      currentSub = { id: parseInt(line, 10), start: 0, end: 0, text: '' };
    } else if (line.includes('-->') && currentSub) {
      const times = line.split('-->').map(t => t.trim());
      currentSub.start = parseTimeString(times[0]);
      currentSub.end = parseTimeString(times[1]);
    } else if (line && currentSub) {
      currentSub.text += (currentSub.text ? '\n' : '') + line;
    }
  }
  
  if (currentSub) subtitles.push(currentSub);
  return subtitles;
}

export function stringify(subtitles, options = {}) {
  return subtitles.map((sub, index) => {
    const id = sub.id || (index + 1);
    const start = formatTimeString(sub.start);
    const end = formatTimeString(sub.end);
    return `${id}\n${start} --> ${end}\n${sub.text}\n`;
  }).join('\n');
}

function parseTimeString(timeString) {
  const parts = timeString.split(':');
  const seconds = parts[2].split(',');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secs = parseInt(seconds[0], 10);
  const milliseconds = parseInt(seconds[1] || 0, 10);
  return (hours * 3600 + minutes * 60 + secs) * 1000 + milliseconds;
}

function formatTimeString(time) {
  const totalSeconds = Math.floor(time / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = time % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

export default { parse, stringify };