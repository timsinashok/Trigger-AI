// Ensure the side panel opens on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let lastSelectedText = "";

setInterval(async () => {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    // Inject script to get the first 4000 characters from the webpage
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getFirst4000CharactersFromWebpage,
    });

    const selectedText = result.result;

    if (selectedText && selectedText !== lastSelectedText) {
      lastSelectedText = selectedText;
      // Send selected text to side panel
      chrome.runtime.sendMessage({ type: "NEW_TEXT", text: selectedText });
    }
  } catch (error) {
    console.error("Error fetching selected text:", error);
  }
}, 5000);

function getFirst4000CharactersFromWebpage() {
  const bodyText = document.body.innerText;
  console.log('bodyText', bodyText.substring(1000, 4000).trim());
  return bodyText.substring(0, 4790).trim();
}

