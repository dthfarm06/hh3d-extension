# 🤖 Copilot Instructions for **HH3D Vấn Đáp Helper** (Chrome MV3)

This document tells GitHub Copilot **how to assist and extend** this extension safely and consistently.

> Context: A Chrome **Manifest V3** extension that auto-detects quiz questions on `hoathinh3d.mx/van-dap-tong-mon`, finds answers from a local DB (in `content.js`), and (optionally) auto-clicks the correct option. The UI is a popup (MV3 action). There is a background service worker that tries to open the popup automatically on the đúng page.

---

## 0) ✅ High‑level goals Copilot should keep
- Keep the **MV3** structure: `manifest.json` (MV3), `background.js` (service worker), `content.js` (DOM logic + Q&A DB), `popup.html`, `popup.js`, `styles.css`.
- Make behavior **deterministic**, **resilient** to DOM changes (selectors may change), and **non-disruptive** to users.
- Prefer **message passing** between popup ↔ content rather than directly touching the page from popup.
- Ensure **safe automation**: no infinite loops, guarded intervals/observers, and clear stop mechanics.

---

## 1) Architecture & Data Flow (Target State)

```
popup.html/js  <--(chrome.tabs.sendMessage)-->  content.js
        ^                                           |
        | (chrome.runtime.sendMessage for logs)     v
                     background.js (optional logging/diagnostics)

manifest.json (MV3): action popup, content_scripts, service_worker
```

- **content.js** holds the main class `VanDapHelper` with logic:
  - detect the current **question** and **options** from DOM
  - match against local **questionData** (array of `{ stt, cau_hoi, dap_an }`)
  - implement **auto-click** and **auto mode**
  - expose **message handlers** for popup controls
- **popup.js** is the control panel:
  - polls/requests **current state** from content
  - toggles **auto-click**, **auto mode**
  - manual **click answer**, **refresh**, **restart**, **stop**
- **background.js** can optionally **log** and attempt to **prompt opening the popup** when entering the quiz URL (note: `chrome.action.openPopup()` may be blocked when not user-initiated).

---

## 2) Message Contract (popup ↔ content)

**Add/keep these actions** handled in `content.js` (on `chrome.runtime.onMessage`):

- `getState` → returns current state `{ isVanDapPage, question, answer, questionCount, maxQuestions, autoClick, autoMode, availableOptions }`
- `setAutoClick` (`enabled: boolean`) → call `setAutoClick(enabled)`
- `setAutoMode` (`enabled: boolean`) → call `setAutoMode(enabled)`
- `clickAnswer` → call `clickAnswerManually()` and return `{ success: boolean }`
- `refreshQuestion` → call `checkForNewQuestion()`
- `restartQuiz` → call `restartQuiz()`
- `stopAutoMode` → call `stopAutoMode()`

> Implementation notes: Always `try/catch` in the message listener and `sendResponse({ success:false, error })` on failure. Return `true` if using async to keep the channel open.

---

## 3) Coding Style & Docs

- Use **JSDoc** for all public methods in `content.js`, `popup.js`, `background.js`:
  - Describe **purpose**, **params**, **returns**, and important **side effects**.
- Prefer **`const`** for immutable references, **`let`** otherwise. Avoid `var`.
- Wrap any DOM query or click in **`try/catch`**; log with a clear prefix: `[VanDap Helper]` or `[VanDap Popup]`.
- Keep **intervals/observers** guarded:
  - clear existing interval before setting a new one
  - disconnect and nullify MutationObserver on cleanup
- Gate automation by booleans (`autoClick`, `autoMode`) and **early return** when disabled.

**Example JSDoc (content.js):**
```js
/**
 * Attempt to detect the current quiz question from DOM.
 * Tries multiple selectors and basic heuristics (presence of '?', length bounds).
 * @returns {string|null} The question text, or null if not found.
 */
detectCurrentQuestion() { ... }
```

---

## 4) Known Gaps & TODOs for Copilot

1) **Missing message listener in content.js**
- Implement `chrome.runtime.onMessage.addListener` to handle the actions listed in §2 and wire to `VanDapHelper` methods.

2) **Popup tries to update even when no content script**
- In `popup.js`, already handles `chrome.runtime.lastError`. Keep that behavior but add a **UI hint** like: “Mở đúng tab vấn đáp rồi nhấn icon extension.”

3) **`background.js` auto-open popup may be blocked**
- `chrome.action.openPopup()` typically requires a **user gesture** in MV3. Keep try/catch and fallback to **badge text** or **notification** suggesting the user click the icon.
- Consider adding a **context menu** on action to open popup with a user gesture.

4) **Permissions**
- Consider adding `"tabs"` permission if we need reliable access to `tab.url` in background/popup. Host permissions are already implied by content_scripts but not necessarily for background usage.
- Keep `"storage"` if we plan to persist: auto flags, pin state, last used settings.

5) **Question detection robustness**
- Add **Shadow DOM** traversal fallback (iterate `document.querySelectorAll('*')` and check `shadowRoot`).
- Add **language/diacritics normalization** when matching questions/answers.

6) **Auto-click safety**
- Add a small randomized delay (`400–900 ms`) before clicks to mimic user pacing.
- Ensure we only click **one** option once per question; guard with a timestamp or hash of last question + answer.

7) **State accuracy**
- `questionCount` should increase only when a **new** question is detected (avoid double counts due to minor DOM changes).
- When `restartQuiz()` is called, ensure UI counter resets and **next detection** re-primes after a short delay.

8) **Logging**
- Provide a thin `log(level, message, data?)` helper that prefixes with context and throttles noisy logs.
- Optionally mirror logs to background via `chrome.runtime.sendMessage({ action:'logEvent', ... })`.

9) **UI (popup)**
- Pin state is visual-only; consider persisting to `chrome.storage.local` so it survives reopen.
- Show **Available Options** only when detected; allow clicking an option from the list to attempt a manual click (send `clickAnswer` with that text).

10) **Testing hooks**
- Keep a separate **test mode** (`file://.../test-vandap.html` or `mock-vandap.html`) that renders a stable DOM for regression checks.
- Provide a `debugExtension()` method (already present) and surface its data when requested by popup (e.g., a “Debug dump” button).

---

## 5) Error Handling Patterns

- **Rule**: No silent failures. Always **log** unexpected conditions and **return a safe default**.
- When selectors fail, log the top 5–10 candidate nodes with `?` to assist debugging.
- Wrap all `chrome.*` async calls with error checks:
  ```js
  chrome.tabs.sendMessage(tabId, payload, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[VanDap Popup] sendMessage error:', chrome.runtime.lastError.message);
      return;
    }
    // use response
  });
  ```
- In content automation, **never** assume elements exist; verify `el && el.isConnected` before clicking.
- On `MutationObserver`, **debounce** checks (e.g., 100–300ms) to avoid thrash.

---

## 6) Selector Strategy (Question & Options)

- Try ordered selector lists; stop at the first that returns reasonable text:
  - Question (prod): `#question`, `.question-text`, `.quiz-question`, `[class*="question"]`, `h1–h3` with `?` heuristic
  - Options: `.option`, `.answer-option`, `button[data-index]`, `[class*="choice"]`, fallback to `button` in question container
- Normalize text:
  - trim + collapse spaces → `text.replace(/\s+/g, ' ').trim()`
  - also compare **accent-stripped** strings for fuzzy match
- Matching tiers: **exact match** → **contains** → **punctuation-stripped** → **word-overlap**

---

## 7) State Model (content.js)

```ts
interface State {
  isVanDapPage: boolean;
  question: string|null;
  answer: string|null;
  questionCount: number;
  maxQuestions: number; // default 5
  autoClick: boolean;
  autoMode: boolean;
  availableOptions: string[];
}
```

- `sendUpdateToPopup()` should always include a **fresh** `availableOptions` snapshot.
- In **auto mode**, after a click succeeds, **reset** `currentQuestion/currentAnswer` after `nextQuestionDelay` so the next detection can trigger.

---

## 8) Minimal Patches Copilot Can Start With

1. **Add onMessage handler** in `content.js`:
```js
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  try {
    switch (req.action) {
      case 'getState':
        sendResponse(vanDapHelper.getCurrentState());
        return; // sync
      case 'setAutoClick':
        vanDapHelper.setAutoClick(!!req.enabled);
        sendResponse({ success: true });
        return;
      case 'setAutoMode':
        vanDapHelper.setAutoMode(!!req.enabled);
        sendResponse({ success: true });
        return;
      case 'clickAnswer':
        sendResponse({ success: !!vanDapHelper.clickAnswerManually() });
        return;
      case 'refreshQuestion':
        vanDapHelper.checkForNewQuestion();
        sendResponse({ success: true });
        return;
      case 'restartQuiz':
        vanDapHelper.restartQuiz();
        sendResponse({ success: true });
        return;
      case 'stopAutoMode':
        vanDapHelper.stopAutoMode();
        sendResponse({ success: true });
        return;
      default:
        sendResponse({ success: false, error: 'Unknown action' });
        return;
    }
  } catch (e) {
    console.error('[VanDap Helper] onMessage error:', e);
    sendResponse({ success: false, error: String(e) });
  }
  // no async work -> do not return true
});
```

2. **Guard background auto-popup**:
```js
try {
  await chrome.action.openPopup();
} catch (e) {
  console.warn('[VanDap Background] openPopup may require user gesture. Showing badge.');
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF6B6B' });
}
```

3. **Persist pin state** (optional):
```js
// popup.js
chrome.storage.local.get(['pinned'], ({ pinned }) => { if (pinned) togglePin(true); });
// When toggled:
chrome.storage.local.set({ pinned: this.isPinned });
```

---

## 9) Non‑Goals & Constraints
- Do **not** inject external libraries.
- Do **not** bypass website security in invasive ways.
- Keep automation human-like and respectful of site behavior and terms.

---

## 10) Test Checklist (manual)
- [ ] Popup shows “✅ Đang ở trang vấn đáp” on đúng URL
- [ ] Detects question text reliably on both **TEST** and **PROD**
- [ ] Lists available options; manual “Nhấn đáp án” works
- [ ] **Auto-click** toggle works; clicks only once per question
- [ ] **Auto mode** advances through 5/5 with delays
- [ ] **Restart** resets counters/state; **Stop** fully halts automation
- [ ] Works after **SPA navigation** (URL changes without reload)
- [ ] Background doesn’t crash; popup still usable when auto-open blocked

---

## 11) Future Enhancements (nice-to-have)
- Shadow DOM & iframe traversal
- Lightweight i18n for popup
- Minimal telemetry (opt‑in) for success/failure counts
- Import/export custom Q&A DB

---

## 12) Commit Message Hints for Copilot
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `perf:`, `test:`
- Example: `feat(content): add runtime message listener and state API`
