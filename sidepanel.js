// sidepanel.js — Gemini Sidebar Assistant v1.1

// ========== STATE ==========
let chatHistory = [];
let currentChatId = Date.now().toString();
let savedChats = [];
let currentController = null;
let settings = { apiKey: '', model: 'gemini-2.5-flash', style: 'medium', tone: 'easy', theme: 'dark' };

// ========== DOM REFS ==========
const $ = (id) => document.getElementById(id);

const dom = {
  chatContainer: $('chatContainer'),
  chatForm: $('chatForm'),
  userInput: $('userInput'),
  sendBtn: $('sendBtn'),
  stopBtn: $('stopBtn'),
  summarizeBtn: $('summarizeBtn'),
  translateBtn: $('translateBtn'),
  newChatBtn: $('newChatBtn'),
  settingsBtn: $('settingsBtn'),
  themeBtn: $('themeBtn'),
  historyBtn: $('historyBtn'),
  historyModal: $('historyModal'),
  closeHistoryBtn: $('closeHistoryBtn'),
  historyList: $('historyList'),
  settingsModal: $('settingsModal'),
  closeSettingsBtn: $('closeSettingsBtn'),
  saveSettingsBtn: $('saveSettingsBtn'),
  apiKey: $('apiKey'),
  geminiModel: $('geminiModel'),
  summaryStyle: $('summaryStyle'),
  summaryTone: $('summaryTone'),
  settingsStatus: $('settingsStatus'),
};

// ========== SETTINGS ==========
async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(
      ['geminiApiKey', 'geminiModel', 'summaryStyle', 'summaryTone', 'theme', 'savedChats'],
      items => {
        if (items.geminiApiKey) settings.apiKey = items.geminiApiKey;
        if (items.geminiModel) settings.model = items.geminiModel;
        if (items.summaryStyle) settings.style = items.summaryStyle;
        if (items.summaryTone) settings.tone = items.summaryTone;
        if (items.theme) settings.theme = items.theme;
        savedChats = items.savedChats || [];
        document.body.dataset.theme = settings.theme;
        // Sync form fields
        if (dom.apiKey) dom.apiKey.value = settings.apiKey;
        if (dom.geminiModel) dom.geminiModel.value = settings.model;
        if (dom.summaryStyle) dom.summaryStyle.value = settings.style;
        if (dom.summaryTone) dom.summaryTone.value = settings.tone;
        resolve();
      }
    );
  });
}

function saveCurrentChat() {
  if (chatHistory.length === 0) return;
  const idx = savedChats.findIndex(c => c.id === currentChatId);
  let title = chatHistory.find(m => m.role === 'user')?.parts[0]?.text || 'Chat';
  if (title.length > 60) title = title.substring(0, 60) + '…';
  const obj = { id: currentChatId, title, date: new Date().toISOString(), messages: JSON.parse(JSON.stringify(chatHistory)) };
  if (idx > -1) savedChats[idx] = obj; else savedChats.unshift(obj);
  chrome.storage.local.set({ savedChats });
}

// ========== UI HELPERS ==========
function scrollToBottom() {
  dom.chatContainer.scrollTo({ top: dom.chatContainer.scrollHeight, behavior: 'smooth' });
}

function appendMessage(role, text) {
  const welcome = document.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  if (role === 'user') {
    contentDiv.textContent = text;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-msg-btn';
    editBtn.title = 'Chỉnh sửa';
    editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>';
    editBtn.addEventListener('click', () => {
      dom.userInput.value = text;
      dom.userInput.style.height = 'auto';
      dom.userInput.style.height = dom.userInput.scrollHeight + 'px';
      dom.sendBtn.disabled = false;
      dom.userInput.focus();
    });

    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(editBtn);
  } else {
    let html = typeof marked !== 'undefined' ? marked.parse(text) : text;
    if (typeof DOMPurify !== 'undefined') html = DOMPurify.sanitize(html);
    contentDiv.innerHTML = html;
    msgDiv.appendChild(contentDiv);
  }

  dom.chatContainer.appendChild(msgDiv);
  scrollToBottom();
  return contentDiv;
}

// ========== QUESTIONS PARSING ==========
function extractQuestions(text) {
  const marker = '---QUESTIONS---';
  if (!text.includes(marker)) return { cleanText: text, questions: [] };
  const [before, after] = text.split(marker);
  const questions = after.trim().split('\n').map(q => q.replace(/^[-*0-9.]+\s*/, '').trim()).filter(q => q.length > 0);
  return { cleanText: before.trim(), questions };
}

function renderQuestions(questions) {
  if (!questions || questions.length === 0) return;
  const container = document.createElement('div');
  container.className = 'suggested-questions-container';
  questions.slice(0, 3).forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'suggested-question-btn';
    btn.textContent = '💡 ' + q;
    btn.addEventListener('click', () => {
      dom.userInput.value = q;
      dom.sendBtn.disabled = false;
      dom.chatForm.dispatchEvent(new Event('submit'));
    });
    container.appendChild(btn);
  });
  dom.chatContainer.appendChild(container);
  scrollToBottom();
}

// ========== API CALL (STREAMING) ==========
async function generateResponse(userText, isAction = false, customPrompt = null) {
  await loadSettings();
  if (!settings.apiKey) {
    appendMessage('ai', '⚠️ Bạn chưa nhập API Key. Nhấn nút **⚙ Cài đặt** ở góc trên để thiết lập.');
    return;
  }

  if (!isAction) {
    chatHistory.push({ role: 'user', parts: [{ text: userText }] });
  }

  dom.sendBtn.classList.add('hidden');
  dom.stopBtn.classList.remove('hidden');
  dom.userInput.disabled = true;

  const contentDiv = appendMessage('ai', '');
  contentDiv.innerHTML = '<div class="generating-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';

  currentController = new AbortController();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:streamGenerateContent?key=${settings.apiKey}&alt=sse`;
    const contents = [...chatHistory];
    if (isAction && customPrompt) {
      contents.push({ role: 'user', parts: [{ text: customPrompt }] });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
      signal: currentController.signal
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    contentDiv.innerHTML = '<span class="cursor"></span>';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const data = JSON.parse(dataStr);
          const t = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) {
            fullText += t;
            let html = typeof marked !== 'undefined' ? marked.parse(fullText) : fullText;
            if (typeof DOMPurify !== 'undefined') html = DOMPurify.sanitize(html);
            contentDiv.innerHTML = html + '<span class="cursor"></span>';
            scrollToBottom();
          }
        } catch (_) { /* ignore partial JSON */ }
      }
    }

    // Finalize
    const { cleanText, questions } = extractQuestions(fullText);
    let finalHtml = typeof marked !== 'undefined' ? marked.parse(cleanText) : cleanText;
    if (typeof DOMPurify !== 'undefined') finalHtml = DOMPurify.sanitize(finalHtml);
    contentDiv.innerHTML = finalHtml;

    if (questions.length > 0) renderQuestions(questions);

    if (isAction) chatHistory.push({ role: 'user', parts: [{ text: userText }] });
    chatHistory.push({ role: 'model', parts: [{ text: cleanText }] });
    saveCurrentChat();

  } catch (err) {
    if (err.name === 'AbortError') {
      contentDiv.innerHTML += '<br><em style="color:var(--text-secondary)">(Đã dừng)</em>';
    } else {
      contentDiv.innerHTML = `<span style="color:#ff5546">❌ Lỗi: ${err.message}</span>`;
    }
  } finally {
    currentController = null;
    dom.stopBtn.classList.add('hidden');
    dom.sendBtn.classList.remove('hidden');
    dom.userInput.disabled = false;
    dom.userInput.focus();
  }
}

// ========== PAGE TEXT EXTRACTION ==========
async function getPageText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://')) {
    throw new Error('Không thể đọc trang hệ thống.');
  }
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText
  });
  const text = results?.[0]?.result;
  if (!text || text.trim().length < 10) throw new Error('Trang này không có nội dung văn bản.');
  return text.substring(0, 30000);
}

// ========== EVENT LISTENERS ==========

// --- Chat submit ---
dom.chatForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = dom.userInput.value.trim();
  if (!text) return;
  dom.userInput.value = '';
  dom.userInput.style.height = 'auto';
  dom.sendBtn.disabled = true;
  appendMessage('user', text);
  generateResponse(text);
});

// --- Auto resize ---
dom.userInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
  dom.sendBtn.disabled = this.value.trim().length === 0;
});
dom.userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!dom.sendBtn.disabled) dom.chatForm.dispatchEvent(new Event('submit'));
  }
});

// --- Stop ---
dom.stopBtn.addEventListener('click', () => { if (currentController) currentController.abort(); });

// --- New chat ---
dom.newChatBtn.addEventListener('click', () => {
  chatHistory = [];
  currentChatId = Date.now().toString();
  dom.chatContainer.innerHTML = '<div class="welcome-message"><h2>Xin chào!</h2><p>Tôi có thể giúp gì cho bạn hôm nay?</p></div>';
});

// --- Theme ---
dom.themeBtn.addEventListener('click', () => {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = settings.theme;
  chrome.storage.local.set({ theme: settings.theme });
});

// --- Settings modal ---
dom.settingsBtn.addEventListener('click', () => {
  // Sync current values into form
  dom.apiKey.value = settings.apiKey;
  dom.geminiModel.value = settings.model;
  dom.summaryStyle.value = settings.style;
  dom.summaryTone.value = settings.tone;
  dom.settingsModal.classList.remove('hidden');
});
dom.closeSettingsBtn.addEventListener('click', () => { dom.settingsModal.classList.add('hidden'); });
dom.saveSettingsBtn.addEventListener('click', () => {
  settings.apiKey = dom.apiKey.value.trim();
  settings.model = dom.geminiModel.value;
  settings.style = dom.summaryStyle.value;
  settings.tone = dom.summaryTone.value;
  chrome.storage.local.set({
    geminiApiKey: settings.apiKey,
    geminiModel: settings.model,
    summaryStyle: settings.style,
    summaryTone: settings.tone
  }, () => {
    dom.settingsStatus.textContent = '✅ Đã lưu!';
    setTimeout(() => { dom.settingsStatus.textContent = ''; dom.settingsModal.classList.add('hidden'); }, 1200);
  });
});

// --- History modal ---
dom.historyBtn.addEventListener('click', async () => {
  await loadSettings(); // refresh savedChats
  dom.historyList.innerHTML = '';
  if (savedChats.length === 0) {
    dom.historyList.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:30px;">Chưa có lịch sử nào.</div>';
  } else {
    // Clear all history button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑️ Xóa toàn bộ lịch sử';
    clearBtn.style.cssText = 'width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);background:transparent;color:#ff5546;font-family:inherit;font-size:13px;cursor:pointer;margin-bottom:10px;transition:background 0.2s;';
    clearBtn.addEventListener('mouseenter', () => { clearBtn.style.background = 'rgba(255,85,70,0.1)'; });
    clearBtn.addEventListener('mouseleave', () => { clearBtn.style.background = 'transparent'; });
    clearBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
        savedChats = [];
        chrome.storage.local.set({ savedChats: [] });
        dom.historyList.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:30px;">Đã xóa toàn bộ lịch sử.</div>';
      }
    });
    dom.historyList.appendChild(clearBtn);

    savedChats.forEach(chat => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `<div class="history-title">${chat.title}</div><div class="history-date">${new Date(chat.date).toLocaleString('vi-VN')}</div>`;
      item.addEventListener('click', () => {
        chatHistory = JSON.parse(JSON.stringify(chat.messages));
        currentChatId = chat.id;
        dom.chatContainer.innerHTML = '';
        chatHistory.forEach(msg => appendMessage(msg.role === 'model' ? 'ai' : 'user', msg.parts[0].text));
        dom.historyModal.classList.add('hidden');
      });
      dom.historyList.appendChild(item);
    });
  }
  dom.historyModal.classList.remove('hidden');
});
dom.closeHistoryBtn.addEventListener('click', () => { dom.historyModal.classList.add('hidden'); });

// --- Summarize ---
dom.summarizeBtn.addEventListener('click', async () => {
  appendMessage('user', 'Tóm tắt trang hiện tại');
  try {
    const pageText = await getPageText();
    const toneMap = { easy: 'dễ hiểu', professional: 'chuyên nghiệp', casual: 'gần gũi' };
    const styleMap = { short: 'ngắn gọn bằng bullet points', medium: 'vừa phải, đầy đủ ý chính', detailed: 'chi tiết và phân tích sâu' };
    const prompt = `Tóm tắt nội dung sau.
Văn phong: ${toneMap[settings.tone] || settings.tone}
Độ dài: ${styleMap[settings.style] || settings.style}

Ở cuối câu trả lời, chèn chính xác cụm "---QUESTIONS---" rồi liệt kê 3 câu hỏi chuyên sâu bằng tiếng Việt (mỗi câu một dòng, bắt đầu bằng "- ").

Nội dung:
${pageText}`;
    generateResponse('Tóm tắt trang hiện tại', true, prompt);
  } catch (e) {
    appendMessage('ai', `⚠️ ${e.message}`);
  }
});

// --- Translate (inline bilingual via free Google Translate API) ---
let isTranslated = false;

async function googleTranslate(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Google Translate lỗi ' + resp.status);
  const data = await resp.json();
  return data[0].map(s => s[0]).join('');
}

dom.translateBtn.addEventListener('click', async () => {
  // Toggle off
  if (isTranslated) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        document.querySelectorAll('.gemini-inline-translation').forEach(el => el.remove());
        document.querySelectorAll('[data-gt-translated]').forEach(el => {
          el.removeAttribute('data-gt-translated');
          el.removeAttribute('data-gt-idx');
        });
      }
    });
    isTranslated = false;
    dom.translateBtn.textContent = '🌐 Dịch trang này';
    appendMessage('ai', '🗑️ Đã xóa bản dịch khỏi trang.');
    return;
  }

  appendMessage('user', 'Dịch song ngữ trên trang');
  const statusDiv = appendMessage('ai', '');
  statusDiv.innerHTML = '⏳ Đang quét nội dung trang...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
      throw new Error('Không thể dịch trang hệ thống.');
    }

    // Step 1: Smart extract — only content paragraphs, skip UI/nav/code/fixed
    const extractResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Ancestor tags & roles to skip entirely
        const SKIP_ANCESTORS = 'nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"], [role="menu"], [role="menubar"], [role="toolbar"], [role="dialog"], [role="alertdialog"], pre, code, svg, script, style, noscript, iframe, .gemini-inline-translation';
        // Only translate these content tags
        const CONTENT_TAGS = 'p, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th';

        // Prefer <main> or <article>; fallback to body
        let root = document.querySelector('main') || document.querySelector('article') || document.querySelector('[role="main"]');
        if (!root) root = document.body;

        const elements = root.querySelectorAll(CONTENT_TAGS);
        const result = [];
        let idx = 0;

        elements.forEach(el => {
          // Skip if inside a banned ancestor
          if (el.closest(SKIP_ANCESTORS)) return;
          // Skip already translated
          if (el.dataset.gtTranslated) return;
          // Skip invisible or zero-size
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return;
          // Skip fixed/sticky elements (UI overlays)
          let parent = el;
          let isFloating = false;
          while (parent && parent !== document.body) {
            const pos = getComputedStyle(parent).position;
            if (pos === 'fixed' || pos === 'sticky') { isFloating = true; break; }
            parent = parent.parentElement;
          }
          if (isFloating) return;

          const text = el.innerText.trim();
          // Min 10 chars & at least one space (likely a real sentence/phrase)
          if (text.length < 10 || !text.includes(' ')) return;
          // Skip if mostly code/symbols (>40% non-letter characters)
          const letterCount = (text.match(/[\p{L}]/gu) || []).length;
          if (letterCount / text.length < 0.5) return;

          el.dataset.gtIdx = String(idx);
          result.push({ idx: idx, text: text.substring(0, 800) });
          idx++;
        });
        return result;
      }
    });

    const paragraphs = extractResult?.[0]?.result;
    if (!paragraphs || paragraphs.length === 0) {
      statusDiv.innerHTML = '⚠️ Không tìm thấy nội dung bài viết để dịch.';
      return;
    }

    statusDiv.innerHTML = `⏳ Đang dịch 0 / ${paragraphs.length} đoạn...`;

    // Step 2: Translate & inject one by one
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      try {
        const translated = await googleTranslate(p.text, 'vi');
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (idx, translatedText) => {
            var el = document.querySelector('[data-gt-idx="' + idx + '"]');
            if (el && !el.dataset.gtTranslated) {
              el.dataset.gtTranslated = 'true';
              var d = document.createElement('div');
              d.className = 'gemini-inline-translation';
              d.style.cssText = 'display:block;background:#e8f0fe;color:#1a237e;padding:4px 8px;margin:2px 0 6px 0;border-left:2px solid #4285f4;border-radius:4px;font-size:0.92em;line-height:1.5;opacity:0;transition:opacity 0.3s;';
              d.textContent = translatedText;
              // For table cells: append INSIDE the cell (vertical) instead of after it (horizontal)
              var tag = el.tagName.toLowerCase();
              if (tag === 'td' || tag === 'th') {
                el.appendChild(d);
              } else {
                el.parentNode.insertBefore(d, el.nextSibling);
              }
              requestAnimationFrame(function() { d.style.opacity = '1'; });
            }
          },
          args: [p.idx, translated]
        });
      } catch (e) {
        console.warn('Translate skip', p.idx, e);
      }

      if (i % 3 === 0 || i === paragraphs.length - 1) {
        statusDiv.innerHTML = `⏳ Đã dịch ${i + 1} / ${paragraphs.length} đoạn...`;
      }
    }

    isTranslated = true;
    dom.translateBtn.textContent = '↩️ Xóa bản dịch';
    statusDiv.innerHTML = `✅ Đã dịch ${paragraphs.length} đoạn nội dung! Nhấn "Xóa bản dịch" để gỡ.`;

  } catch (e) {
    statusDiv.innerHTML = '<span style="color:#ff5546">❌ ' + e.message + '</span>';
  }
});

// --- Context menu fill ---
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'FILL_INPUT' && request.text) {
    dom.userInput.value = request.text;
    dom.userInput.style.height = 'auto';
    dom.userInput.style.height = dom.userInput.scrollHeight + 'px';
    dom.sendBtn.disabled = false;
    dom.userInput.focus();
  }
});

// ========== INIT ==========
loadSettings();
