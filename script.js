const topicPills = document.getElementById('topicPills');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const noteForm = document.getElementById('noteForm');
const noteInput = document.getElementById('noteInput');
const notesList = document.getElementById('notesList');
const seedButton = document.getElementById('seedButton');
const autoResearchButton = document.getElementById('autoResearchButton');
const signalForm = document.getElementById('signalForm');
const marketInput = document.getElementById('marketInput');
const signalOutput = document.getElementById('signalOutput');
const webForm = document.getElementById('webForm');
const webUrlInput = document.getElementById('webUrlInput');
const webOutput = document.getElementById('webOutput');
const dashboard = document.getElementById('dashboard');
const statusBar = document.getElementById('statusBar');
const resetMemoryButton = document.getElementById('resetMemoryButton');

const STORAGE_KEY = 'tradeMindNotes';
const STATE_KEY = 'tradeMindState';
const topics = ['Risk Management', 'Trend Following', 'RSI', 'Position Sizing', 'News Trading'];
const autoResearchSources = [
  { name: 'Reuters', url: 'https://www.reuters.com/world/' },
  { name: 'MarketWatch', url: 'https://www.marketwatch.com/' },
  { name: 'Investing.com', url: 'https://www.investing.com/news/stock-market-news' }
];
let notes = [];
let autoRefreshTimer = null;
let selfHealingCounter = 0;
let agentState = {
  researchCount: 0,
  refreshCount: 0,
  lastAction: 'standby',
  lastUpdated: null
};

function loadAgentState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    agentState = { ...agentState, ...parsed };
  } catch {
    agentState = { ...agentState };
  }
}

function saveAgentState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(agentState));
  } catch (error) {
    console.warn('Could not save agent state:', error);
  }
}

function updateAgentState(patch) {
  agentState = { ...agentState, ...patch };
  saveAgentState();
}

function buildAgentInsight() {
  if (!notes.length) {
    return 'No memory yet. Add notes or run auto research to build a stronger trading edge.';
  }

  const themes = [];
  if (notes.some((note) => /risk|position|size|capital/i.test(note.text))) {
    themes.push('risk discipline');
  }
  if (notes.some((note) => /trend|momentum|breakout|pullback|retest/i.test(note.text))) {
    themes.push('trend structure');
  }
  if (notes.some((note) => /news|volatility|event/i.test(note.text))) {
    themes.push('event-driven setups');
  }

  const themeLabel = themes.length ? themes.join(' • ') : 'price action context';
  const recent = notes[0].text.length > 110 ? `${notes[0].text.slice(0, 110)}...` : notes[0].text;
  return `Current edge: ${themeLabel}. Latest note: ${recent}`;
}

function addMessage(text, sender) {
  const message = document.createElement('div');
  message.className = `message ${sender}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function loadNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    notes = [];
    return;
  }

  try {
    notes = JSON.parse(raw);
  } catch {
    notes = [];
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.warn('Could not save notes to storage:', error);
  }
}

function renderNotes() {
  notesList.innerHTML = '';

  if (!notes.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No trading notes yet. Add one to teach the assistant your edge.';
    notesList.appendChild(empty);
    return;
  }

  notes.slice(0, 8).forEach((note) => {
    const item = document.createElement('li');
    const source = note.source ? ` Source: ${note.source}` : '';
    item.textContent = `${note.text}${source}`;
    notesList.appendChild(item);
  });
}

function renderDashboard() {
  dashboard.innerHTML = '';

  const metrics = `
    <div class="agent-metrics">
      <div class="metric-chip">Memory ${notes.length}/16</div>
      <div class="metric-chip">Research ${agentState.researchCount}</div>
      <div class="metric-chip">Refresh ${agentState.refreshCount}</div>
    </div>
  `;

  dashboard.insertAdjacentHTML('beforeend', metrics);
  dashboard.insertAdjacentHTML('beforeend', `<div class="agent-insight">${buildAgentInsight()}</div>`);

  if (!notes.length) {
    dashboard.insertAdjacentHTML('beforeend', '<div class="dashboard-item">No research memory yet.</div>');
    return;
  }

  const recent = notes.slice(0, 4);
  recent.forEach((note, index) => {
    const item = document.createElement('div');
    item.className = 'dashboard-item';
    item.innerHTML = `<strong>${index + 1}. ${note.source || 'Local insight'}</strong><br>${note.text}`;
    dashboard.appendChild(item);
  });
}

function setStatus(message, isActive = true) {
  statusBar.textContent = message;
  statusBar.style.background = isActive ? 'rgba(64, 209, 122, 0.16)' : 'rgba(255, 184, 77, 0.16)';
}

function rememberLearning(noteText, source) {
  const cleanNote = noteText.trim();
  if (!cleanNote) return;

  const exists = notes.some((note) => note.text === cleanNote);
  if (!exists) {
    notes.unshift({ text: cleanNote, source: source || 'Local insight' });
    if (notes.length > 16) {
      notes = notes.slice(0, 16);
    }
    saveNotes();
    renderNotes();
    renderDashboard();
    updateAgentState({ lastAction: 'Memory updated', lastUpdated: new Date().toLocaleTimeString() });
  }
}

function clearMemory() {
  notes = [];
  saveNotes();
  renderNotes();
  renderDashboard();
  addMessage('My memory has been cleared. I will rebuild it from your next insight or research run.', 'bot');
  updateAgentState({ lastAction: 'Memory cleared', lastUpdated: new Date().toLocaleTimeString() });
  setStatus('Autonomous mode: memory cleared', false);
}

function seedStarterNotes() {
  if (notes.length) {
    addMessage('You already have trading notes saved. I can keep learning from them.', 'bot');
    return;
  }

  const starters = [
    'Risk management: never risk more than 1-2% of capital per trade.',
    'Trend following: wait for structure and momentum before entering.',
    'Position sizing: size trades to protect the account, not to chase gains.'
  ];

  notes = [];
  starters.forEach((text) => rememberLearning(text));
  saveNotes();
  renderNotes();
  renderDashboard();
  updateAgentState({ lastAction: 'Starter notes loaded', lastUpdated: new Date().toLocaleTimeString() });
  addMessage('Starter trading notes loaded. I can now help you research setups using this knowledge.', 'bot');
}

function findRelevantNotes(query) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (!words.length) return [];

  return notes.filter((note) => {
    const text = note.text.toLowerCase();
    return words.some((word) => text.includes(word));
  });
}

function summarizeWebContent(text, sourceName) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const compact = cleaned.slice(0, 900);
  return `Auto-research from ${sourceName}: ${compact}`;
}

async function learnFromInternet(url) {
  const trimmed = url.trim();
  if (!trimmed) {
    return { success: false, message: 'Please enter a public web page URL.' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return { success: false, message: 'Please enter a valid URL starting with http:// or https://.' };
  }

  const target = parsedUrl.href.replace(/^https?:\/\//, '');
  const proxyUrl = `https://r.jina.ai/http://${target}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Fetch failed');

    const text = await response.text();
    const noteText = summarizeWebContent(text, parsedUrl.host);

    rememberLearning(noteText, parsedUrl.href);

    return {
      success: true,
      message: `Learned from ${parsedUrl.host}. I saved a web-based context note for future research.`,
      preview: noteText
    };
  } catch {
    return { success: false, message: 'I could not read that page. Try a public article or news page.' };
  }
}

async function runAutoResearch() {
  setStatus('Autonomous mode: scanning public market sources...');
  webOutput.textContent = 'Scanning public market sources...';
  const saved = [];

  for (const source of autoResearchSources) {
    try {
      const proxyUrl = `https://r.jina.ai/http://${source.url.replace(/^https?:\/\//, '')}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;

      const text = await response.text();
      const noteText = summarizeWebContent(text, source.name);
      saved.push({ text: noteText, source: source.url });
    } catch {
      // Ignore failed sources and keep moving.
    }
  }

  if (!saved.length) {
    webOutput.textContent = 'The research scan did not collect fresh content. Try a direct URL or another public page.';
    updateAgentState({ lastAction: 'Research scan failed', lastUpdated: new Date().toLocaleTimeString() });
    addMessage('The autonomous research scan did not collect fresh content.', 'bot');
    return;
  }

  saved.slice(0, 3).forEach((item) => rememberLearning(item.text, item.source));

  const summary = saved.slice(0, 3).map((item) => `- ${item.source}`).join('\n');
  webOutput.textContent = `Autonomous research complete. I collected ${saved.length} fresh context notes from public market sources.`;
  setStatus('Autonomous mode: memory refreshed and ready');
  updateAgentState({ researchCount: agentState.researchCount + 1, lastAction: 'Auto research complete', lastUpdated: new Date().toLocaleTimeString() });
  addMessage(`Autonomous research complete. I collected ${saved.length} fresh context notes.\n${summary}`, 'bot');
}

function startAutoRefresh() {
  if (autoRefreshTimer) return;
  autoRefreshTimer = window.setInterval(() => {
    selfHealingCounter += 1;
    updateAgentState({ refreshCount: agentState.refreshCount + 1, lastAction: 'Refresh cycle', lastUpdated: new Date().toLocaleTimeString() });
    selfHealUi();
    setStatus(`Autonomous mode: refreshed ${selfHealingCounter} time(s)`);
    if (selfHealingCounter % 3 === 0) {
      runAutoResearch();
    }
  }, 1000);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function selfHealUi() {
  const issues = [];
  if (!notes.length) {
    issues.push('No memory yet');
  }
  if (!chatMessages.children.length) {
    issues.push('Chat empty');
    addMessage('I am ready to learn from your trading notes, public web pages, and generate research-based trading signals. My memory will grow as I learn.', 'bot');
  }
  if (!document.querySelector('.topic-pill')) {
    issues.push('Topic pills missing');
    setupPills();
  }
  if (issues.length) {
    setStatus(`Self-healing: ${issues.join(', ')}`, false);
  } else {
    setStatus('Self-healing: UI stable', true);
  }
}

function generateTradingSignal(query) {
  const input = query.toLowerCase();
  const relevant = findRelevantNotes(input);

  let bias = 'Neutral';
  let signalType = 'Trend-following';
  let confidence = 0.62;
  let plan = 'Wait for confirmation from price action and keep risk small.';
  const triggers = [];

  if (input.includes('bull') || input.includes('breakout') || input.includes('uptrend') || input.includes('long')) {
    bias = 'Bullish';
    confidence += 0.08;
    triggers.push('momentum confirmation');
  } else if (input.includes('bear') || input.includes('downtrend') || input.includes('short')) {
    bias = 'Bearish';
    confidence += 0.08;
    triggers.push('breakdown confirmation');
  }

  if (input.includes('breakout')) {
    signalType = 'Breakout';
    plan = 'Enter on a retest or strong follow-through with a tight stop.';
    triggers.push('breakout trigger');
  } else if (input.includes('pullback') || input.includes('retest')) {
    signalType = 'Pullback';
    plan = 'Look for a pullback into structure and only enter if the setup is still valid.';
    triggers.push('retest support');
  } else if (input.includes('news')) {
    signalType = 'News reaction';
    plan = 'Trade only if the move is clean and the risk is controlled.';
    triggers.push('news volatility');
  } else if (input.includes('reversal') || input.includes('mean')) {
    signalType = 'Mean reversion';
    plan = 'Wait for a reversal confirmation and avoid forcing the trade.';
    triggers.push('reversal confirmation');
  }

  if (relevant.length) {
    confidence = Math.min(0.95, confidence + relevant.length * 0.05);
  }
  if (notes.some((note) => /risk|position|size|capital/i.test(note.text))) {
    plan += ' Respect your max risk and size the trade conservatively.';
  }

  const context = relevant.length
    ? relevant.slice(0, 3).map((note) => `- ${note.text}`).join('\n')
    : '- No matching notes yet. Add more trading ideas to improve the signal.';

  return `Signal: ${bias}\nType: ${signalType}\nConfidence: ${(confidence * 100).toFixed(0)}%\nPlan:\n- ${plan}\n- Trigger: ${triggers.length ? triggers.join(' + ') : 'wait for a clean setup'}\n- Risk: keep size small and protect the account.\nContext from your notes:\n${context}`;
}

function buildResponse(text) {
  const input = text.toLowerCase();
  const relevant = findRelevantNotes(input);

  if (input.includes('signal') || input.includes('trade') || input.includes('buy') || input.includes('sell')) {
    return generateTradingSignal(input);
  }

  if (input.includes('summary') || input.includes('summarize')) {
    if (!notes.length) {
      return 'You do not have any saved trading notes yet. Add one and I will summarize it for you.';
    }

    const summary = notes.slice(0, 3).map((note) => `- ${note.text}`).join('\n');
    return `Here is your current trading knowledge:\n${summary}\n\nAgent readout: ${buildAgentInsight()}`;
  }

  if (input.includes('research') || input.includes('analyze') || input.includes('setup')) {
    if (!relevant.length) {
      return 'I do not see a matching note yet. Add a trading insight and I will connect it to your research request.';
    }

    const matchList = relevant.slice(0, 3).map((note) => `- ${note.text}`).join('\n');
    return `Research plan based on your notes:\n1. Review the relevant ideas below.\n2. Check whether the setup fits your risk plan.\n3. Define entry, stop, target, and size before you trade.\nRelevant notes:\n${matchList}`;
  }

  if (input.includes('risk') || input.includes('position')) {
    return 'A disciplined trading rule is to protect capital first. Define risk per trade, keep size small, and avoid revenge trading after a loss.';
  }

  if (input.includes('trend')) {
    return 'Trend following works best when you confirm direction with structure, momentum, and a clear plan. Avoid forcing trades against the dominant move.';
  }

  if (input.includes('rsi') || input.includes('indicator')) {
    return 'Indicators are useful as confirmation, not as a replacement for context. Combine them with price action, trend, and risk rules.';
  }

  if (input.includes('news')) {
    return 'News can create fast moves, so define your plan before the event. If the setup is unclear, wait for a cleaner price action signal.';
  }

  return 'I can help you study trading by using your saved notes. Try asking for a signal, a research plan, a summary of your notes, or guidance on risk and trend setups.';
}

function handleTopic(topic) {
  chatInput.value = `Research ${topic.toLowerCase()}`;
  chatInput.focus();
}

function setupPills() {
  topicPills.innerHTML = '';
  topics.forEach((topic) => {
    const button = document.createElement('button');
    button.className = 'topic-pill';
    button.textContent = topic;
    button.addEventListener('click', () => handleTopic(topic));
    topicPills.appendChild(button);
  });
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const userText = chatInput.value.trim();
  if (!userText) return;

  addMessage(userText, 'user');
  chatInput.value = '';

  window.setTimeout(() => {
    addMessage(buildResponse(userText), 'bot');
  }, 300);
});

noteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = noteInput.value.trim();
  if (!text) return;

  rememberLearning(text, 'Local insight');
  noteInput.value = '';
  addMessage(`Saved a trading insight: ${text}`, 'bot');
});

seedButton.addEventListener('click', seedStarterNotes);
autoResearchButton.addEventListener('click', () => {
  runAutoResearch();
});
resetMemoryButton.addEventListener('click', () => {
  clearMemory();
  runAutoResearch();
});

signalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const marketText = marketInput.value.trim();
  if (!marketText) return;

  addMessage(`Research request: ${marketText}`, 'user');
  marketInput.value = '';

  window.setTimeout(() => {
    const signal = generateTradingSignal(marketText);
    signalOutput.textContent = signal;
    addMessage(signal, 'bot');
  }, 250);
});

webForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = webUrlInput.value.trim();
  if (!url) return;

  webOutput.textContent = 'Reading the page and turning it into trading context...';

  const result = await learnFromInternet(url);
  webOutput.textContent = result.message;
  webUrlInput.value = '';

  addMessage(result.message, 'bot');
  if (result.preview) {
    addMessage(result.preview, 'bot');
  }
});

loadNotes();
loadAgentState();
setupPills();
renderNotes();
renderDashboard();
setStatus('Autonomous mode: standby');
selfHealUi();
startAutoRefresh();
addMessage('I am ready to learn from your trading notes, public web pages, and generate research-based trading signals. My memory will grow as I learn.', 'bot');
