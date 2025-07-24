console.log("🔄 Claude extension started");

// Configuration
let API_TIMEOUT = 60000; // Default timeout in milliseconds (60 seconds)
let SERVER_PORT = 3000; // Default port

// Load saved settings on startup
chrome.storage.sync.get(['serverPort', 'timeout'], (result) => {
  if (chrome.runtime.lastError) {
    console.error('Error loading settings:', chrome.runtime.lastError);
    return;
  }
  
  if (result && result.serverPort) {
    SERVER_PORT = result.serverPort;
  }
  
  if (result && result.timeout) {
    API_TIMEOUT = result.timeout * 1000; // Convert seconds to milliseconds
  }
  
  console.log(`📍 Using server port: ${SERVER_PORT}`);
  console.log(`⏱️ Timeout set to: ${API_TIMEOUT/1000} seconds`);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.serverPort) {
      SERVER_PORT = changes.serverPort.newValue;
      console.log(`📍 Server port updated to: ${SERVER_PORT}`);
    }
    if (changes.timeout) {
      API_TIMEOUT = changes.timeout.newValue * 1000;
      console.log(`⏱️ Timeout updated to: ${changes.timeout.newValue} seconds`);
    }
  }
});

// Define contexts for all menus - INCLUDING editable for textareas/inputs
const MENU_CONTEXTS = ["selection", "editable"];

// Create main Claude menu with icon
chrome.contextMenus.create({
  id: "claude",
  title: "Claude Tools",
  contexts: MENU_CONTEXTS,
  icons: {
    16: "icon16.png",
    32: "icon32.png", // Firefox uses 32px for retina displays
  },
});

// Create "Claude pop-up" submenu
chrome.contextMenus.create({
  id: "claude-popup",
  parentId: "claude",
  title: "Claude pop-up",
  contexts: MENU_CONTEXTS,
});

// Pop-up menu items
chrome.contextMenus.create({
  id: "summarize-popup",
  parentId: "claude-popup",
  title: "Summarize",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "beautify-popup",
  parentId: "claude-popup",
  title: "Beautify",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "explain-popup",
  parentId: "claude-popup",
  title: "Explain",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "elaborate-popup",
  parentId: "claude-popup",
  title: "Elaborate",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "illustrate-popup",
  parentId: "claude-popup",
  title: "Illustrate",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translatefr-popup",
  parentId: "claude-popup",
  title: "Translate to French",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translateenuk-popup",
  parentId: "claude-popup",
  title: "Translate to English (UK)",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translateenus-popup",
  parentId: "claude-popup",
  title: "Translate to English (US)",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translatees-popup",
  parentId: "claude-popup",
  title: "Translate to Spanish",
  contexts: MENU_CONTEXTS,
});

// Create "Claude inline" submenu
chrome.contextMenus.create({
  id: "claude-inline",
  parentId: "claude",
  title: "Claude inline",
  contexts: MENU_CONTEXTS,
});

// Inline menu items
chrome.contextMenus.create({
  id: "summarize-inline",
  parentId: "claude-inline",
  title: "Summarize",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "beautify-inline",
  parentId: "claude-inline",
  title: "Beautify",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "explain-inline",
  parentId: "claude-inline",
  title: "Explain",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "elaborate-inline",
  parentId: "claude-inline",
  title: "Elaborate",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "illustrate-inline",
  parentId: "claude-inline",
  title: "Illustrate",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translatefr-inline",
  parentId: "claude-inline",
  title: "Translate to French",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translateenuk-inline",
  parentId: "claude-inline",
  title: "Translate to English (UK)",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translateenus-inline",
  parentId: "claude-inline",
  title: "Translate to English (US)",
  contexts: MENU_CONTEXTS,
});

chrome.contextMenus.create({
  id: "translatees-inline",
  parentId: "claude-inline",
  title: "Translate to Spanish",
  contexts: MENU_CONTEXTS,
});

console.log("✅ Contextual menus created");

// Common instructions for all actions
const baseInstructions = `CRITICAL INSTRUCTIONS:
- Output only what has been asked, no introduction, no explanation, no meta-commentary about what you have done or what has been changed, no sentence like "Here is the summary..." or "This text is about..." or "Let me..." or "I'll help you...". Start directly with the expected output`;

// Helper function to generate translation instructions
function getTranslationInstructions(targetLanguage) {
  return `
- Translate the text to ${targetLanguage}
- Keep the tone and style of the original
- Use proper ${targetLanguage} grammar and spelling`;
}

// Define specific instructions for each action
const specificInstructions = {
  summarize: `
- Keep the original language
- Make it at least 40% shorter than the original
- Return ONLY the summary, nothing else`,

  explain: `
- For single words: just the definition
- For phrases: just what it means
- For passages: just the context/meaning
- Keep the original language`,

  beautify: `
- Fix grammar, spelling, punctuation, and phrasing
- Keep the original meaning and language
- Return ONLY the improved text`,

  elaborate: `
- Take the original idea and develop it further
- Add relevant details and context
- Make it more formal and professional
- Fix any grammar or spelling errors
- Expand abbreviations and clarify vague references
- Keep the original meaning but express it more thoroughly
- Keep the original language
- Make it 2-3x longer than the original`,

  illustrate: `
- Analyze the content and create an SVG visualization
- For CODE: Create a flowchart or architecture diagram
- For TECHNICAL TEXT: Create a UML, sequence, or concept diagram
- For NARRATIVE/DESCRIPTIVE TEXT: Create a mind map, timeline, or conceptual diagram
- For PROCESSES: Create a step-by-step flow diagram
- For COMPARISONS: Create a comparison chart or Venn diagram
- Always output: Start with [SVG] then the complete SVG code
- SVG requirements:
  - Use a white background
  - Include proper viewBox attribute
  - Use clear shapes, text labels, and connecting arrows
  - Make it self-contained (no external dependencies)
  - Minimum size 400x300, adjust as needed for content
  - Use colors sparingly but effectively
  - Ensure text is readable (minimum 12px font)`,

  translatefr: getTranslationInstructions("French"),

  translateenuk: getTranslationInstructions("English (UK)"),

  translateenus: getTranslationInstructions("English (US)"),

  translatees: getTranslationInstructions("Spanish"),
};

// Combine base instructions with specific ones
const instructions = {};
for (const [action, specific] of Object.entries(specificInstructions)) {
  instructions[action] = baseInstructions + specific;
}

// Call Claude API endpoint with selected text and instruction (with timeout)
async function callClaudeLocalAPI(inputText, instruction) {
 const prompt = `${instruction.trim()}\n\n"${inputText.trim()}"`;
  console.log("✉️ Asking Claude: " + prompt);
  console.log(`⏱️ Timeout set to ${API_TIMEOUT}ms`);
  console.log(`📍 Using port: ${SERVER_PORT}`);

  // Create an AbortController for the timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/claude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: prompt }),
      signal: controller.signal, // Add the abort signal
    });

    // Clear the timeout if request completes successfully
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`❌ Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("💬 Claude answered: ", data.response);
    return data.response || "No answer";
  } catch (error) {
    // Clear timeout in case of error
    clearTimeout(timeoutId);

    // Check if error is due to timeout
    if (error.name === "AbortError") {
      console.error("❌ Request timeout after " + API_TIMEOUT + "ms");
      return `Error: Request timeout after ${
        API_TIMEOUT / 1000
      } second(s). Claude is taking too long to respond.`;
    }

    console.error("❌ Fetch error:", error);
    return `Error : ${error.message}`;
  }
}

// Inject and display loading spinner in the active tab
function showSpinner(tabId) {
  chrome.tabs.executeScript(tabId, {
    code: `
      (function() {
        // Create spinner element
        const spinner = document.createElement('div');
        spinner.id = 'claude-extension-spinner';
        spinner.innerHTML = '<div class="spinner"></div><div class="text">Claude is thinking...</div>';

        // Inject spinner styles
        const style = document.createElement('style');
        style.textContent = \`
          #claude-extension-spinner {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 999999;
            display: flex;
            align-items: center;
            gap: 15px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          
          #claude-extension-spinner .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: claude-spin 1s linear infinite;
          }
          
          #claude-extension-spinner .text {
            font-size: 14px;
          }
          
          @keyframes claude-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          body.claude-loading {
            cursor: wait !important;
          }
          
          body.claude-loading * {
            cursor: wait !important;
          }
        \`;
        
        document.head.appendChild(style);
        document.body.appendChild(spinner);
        document.body.classList.add('claude-loading');
      })();
    `,
  });
}

// Remove spinner from the active tab
function hideSpinner(tabId) {
  chrome.tabs.executeScript(tabId, {
    code: `
      (function() {
        const spinner = document.getElementById('claude-extension-spinner');
        if (spinner) {
          spinner.remove();
        }
        document.body.classList.remove('claude-loading');
      })();
    `,
  });
}

// Display illustration result (SVG or image prompt)
function displayIllustration(tabId, answer, mode) {
  if (answer.startsWith("[SVG]")) {
    // Extract SVG code
    const svgCode = answer.substring("[SVG]".length).trim();

    if (mode === "inline") {
      // For inline mode, insert the SVG directly
      chrome.tabs.executeScript(tabId, {
        code: `
          (function() {
            // Create a data URL for the SVG
            const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(\`${svgCode
              .replace(/\\/g, "\\\\")
              .replace(/`/g, "\\`")}\`)));
            
            // Create an image element
            const imgHTML = '<img src="' + svgDataUrl + '" style="max-width: 100%; height: auto;" />';
            
            console.log("Inserting SVG image");
            
            // Try to insert the image
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              try {
                // Use insertHTML for contentEditable
                document.execCommand('insertHTML', false, imgHTML);
                console.log("✅ Inserted SVG using insertHTML");
              } catch (e) {
                console.log("insertHTML failed, trying fallback");
                
                // Fallback: insert as text (SVG code)
                try {
                  document.execCommand('insertText', false, "\\n" + \`${svgCode
                    .replace(/\\/g, "\\\\")
                    .replace(/`/g, "\\`")}\` + "\\n");
                } catch (e2) {
                  alert("Cannot insert SVG inline. SVG code has been copied to clipboard.");
                  navigator.clipboard.writeText(\`${svgCode
                    .replace(/\\/g, "\\\\")
                    .replace(/`/g, "\\`")}\`);
                }
              }
            }
          })();
        `,
      });
    } else {
      // For popup mode, show SVG in modal
      chrome.tabs.executeScript(tabId, {
        code: `
          (function() {
            // Remove any existing modal
            const existingModal = document.getElementById('claude-svg-modal');
            if (existingModal) existingModal.remove();
            
            // Create modal for SVG
            const modal = document.createElement('div');
            modal.id = 'claude-svg-modal';
            modal.innerHTML = \`
              <div class="modal-content">
                <span class="close">&times;</span>
                <div style="text-align: center; padding: 20px;">
                  ${svgCode}
                </div>
              </div>
            \`;
            
            // Modal styles
            const style = document.createElement('style');
            style.id = 'claude-svg-modal-styles';
            style.textContent = \`
              #claude-svg-modal {
                position: fixed;
                z-index: 999999;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              #claude-svg-modal .modal-content {
                background-color: white;
                padding: 20px;
                border-radius: 10px;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                position: relative;
                min-width: 400px;
              }
              
              #claude-svg-modal .close {
                position: absolute;
                right: 10px;
                top: 10px;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                color: #aaa;
                z-index: 1000;
              }
              
              #claude-svg-modal .close:hover {
                color: #000;
              }
              
              #claude-svg-modal svg {
                max-width: 100%;
                height: auto;
              }
            \`;
            
            // Remove old styles if exist
            const oldStyle = document.getElementById('claude-svg-modal-styles');
            if (oldStyle) oldStyle.remove();
            
            document.head.appendChild(style);
            document.body.appendChild(modal);
            
            // Close modal handlers
            modal.querySelector('.close').onclick = function() {
              modal.remove();
            };
            
            modal.onclick = function(event) {
              if (event.target === modal) {
                modal.remove();
              }
            };
          })();
        `,
      });
    }
  } else if (answer.startsWith("[IMAGE_PROMPT]")) {
    // For image prompts, show in alert
    const imagePrompt = answer.substring("[IMAGE_PROMPT]".length).trim();
    chrome.tabs.executeScript(tabId, {
      code: `alert("Image Generation Prompt:\\n\\n${imagePrompt
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")}");`,
    });
  } else {
    // Fallback
    chrome.tabs.executeScript(tabId, {
      code: `alert(${JSON.stringify(answer)});`,
    });
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("🖱️ Click detected: ", info.menuItemId);

  // Get selected text - handle both regular selection and editable fields
  let selectedText = info.selectionText;
  
  // If no selection text but we're in an editable context, try to get text from the field
  if (!selectedText && info.editable) {
    console.log("📝 Editable context detected, attempting to get selection from field");
    
    // Execute script to get selection from textarea/input
    chrome.tabs.executeScript(tab.id, {
      code: `
        (function() {
          const activeElement = document.activeElement;
          if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
            return activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd);
          }
          return window.getSelection().toString();
        })();
      `
    }, function(results) {
      if (results && results[0]) {
        selectedText = results[0];
        console.log("📝 Retrieved text from field:", selectedText);
        processSelection(selectedText, info, tab);
      }
    });
    return;
  }
  
  processSelection(selectedText, info, tab);
});

// Separate function to process the selection
async function processSelection(selectedText, info, tab) {
  console.log("📝 Selected text:", selectedText);

  // Validate selection
  if (!selectedText || !selectedText.trim()) {
    console.warn("⚠️ No selected text");
    return;
  }

  // Extract action and mode from menu ID
  const [action, mode] = info.menuItemId.split("-");
  const instruction = instructions[action];

  if (instruction) {
    // Show loading indicator
    showSpinner(tab.id);

    try {
      // Call Claude API and wait for response
      const answer = await callClaudeLocalAPI(selectedText, instruction);
      console.log(`✅ ${action} received`);

      // Remove loading indicator
      hideSpinner(tab.id);

      // Special handling for illustrate action
      if (action === "illustrate") {
        displayIllustration(tab.id, answer, mode);
        return;
      }

      if (mode === "popup") {
        // Display result in a browser alert
        chrome.tabs.executeScript(tab.id, {
          code: `alert(${JSON.stringify(answer)});`,
        });
      } else if (mode === "inline") {
        // Replace selected text directly in the page
        chrome.tabs.executeScript(tab.id, {
          code: `
            (function() {
              const answer = ${JSON.stringify(answer)};
              
              // Debug information for troubleshooting
              console.log("🔍 Debugging info:");
              console.log("Active element:", document.activeElement);
              console.log("Active element tag:", document.activeElement.tagName);
              console.log("ContentEditable:", document.activeElement.contentEditable);
              console.log("Selection:", window.getSelection().toString());
              
              // Find the contentEditable parent (for editors like Nuclino)
              let editableParent = document.activeElement;
              while (editableParent && editableParent.contentEditable !== 'true') {
                editableParent = editableParent.parentElement;
              }
              console.log("Editable parent found:", editableParent);
              
              // Case 1: Standard input or textarea elements
              const activeElement = document.activeElement;
              if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                const start = activeElement.selectionStart;
                const end = activeElement.selectionEnd;
                const value = activeElement.value;
                
                // Replace selected text and update cursor position
                activeElement.value = value.substring(0, start) + answer + value.substring(end);
                activeElement.selectionStart = start + answer.length;
                activeElement.selectionEnd = start + answer.length;
                activeElement.focus();
                
                console.log("✅ Replaced text in input/textarea");
                return;
              }
              
              // Case 2: ContentEditable elements (modern editors)
              const selection = window.getSelection();
              
              if (selection.rangeCount > 0) {
                // Ensure the editable element has focus
                if (editableParent) {
                  editableParent.focus();
                }
                
                // Method 1: Use execCommand (preferred for modern editors)
                try {
                  // Ensure selection is still active
                  const range = selection.getRangeAt(0);
                  
                  // Use execCommand to maintain undo history
                  const success = document.execCommand('insertText', false, answer);
                  console.log("execCommand success:", success);
                  
                  if (success) {
                    console.log("✅ Replaced using execCommand");
                    return;
                  }
                } catch (e) {
                  console.log("execCommand error:", e);
                }
                
                // Method 2: Direct DOM manipulation (fallback)
                try {
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  const textNode = document.createTextNode(answer);
                  range.insertNode(textNode);
                  
                  // Move cursor after inserted text
                  range.setStartAfter(textNode);
                  range.setEndAfter(textNode);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  // Trigger input event to notify the editor of changes
                  if (editableParent) {
                    editableParent.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                  
                  console.log("✅ Replaced using DOM manipulation");
                  return;
                } catch (e) {
                  console.log("DOM manipulation error:", e);
                }
              }
              
              // Fallback: show result in alert if inline replacement fails
              alert("Cannot replace inline. Result:\\n\\n" + answer);
            })();
          `,
        });
      }
    } catch (error) {
      // Hide spinner even if an error occurs
      hideSpinner(tab.id);
      console.error("Error:", error);
    }
  }
}