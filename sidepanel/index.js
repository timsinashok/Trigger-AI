import DOMPurify from 'dompurify';
import { marked } from 'marked';

const responseElement = document.getElementById("response");
const loadingElement = document.getElementById("loading");
const errorElement = document.getElementById("error");
const toggleThemeButton = document.getElementById("toggle-theme");

let session;

// Toggle dark/light mode
toggleThemeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Listen for messages from background.js
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "NEW_TEXT") {
    let text = message.text;
    console.log("Selected text:", text);

    showLoading();

    const params = {
      systemPrompt: "You are an expert to analyze text for specific triggers. You will be negativly rated if you miss any triggers. Read the given text and identify the triggers present in the text. The possible triggers are: 1. Adult Content Pornography, 2. Violence (Graphic Violence, Promotion of Violence), 3.Hate Speech (Racism, Harassment), 4. Misinformation, 5. Self-Harm, 6. Malware/Phishing, 7. Extremism (Terrorism, Radicalization), 8. Language (Profanity, Offensive). Provide your response in the format: {trigger_1}, {trigger_2}...{trigger_i} from the given trigger list or {No triggers on this website, safe to browse}",
      temperature: parseFloat(0.5),
      topK: parseInt(1),
    };

    try {
      text = "Text:" + text;
      const response = await runPrompt(text, params);
      showResponse(response);
    } catch (error) {
      showError(error.message || "An error occurred.");
    }
  }
});

async function runPrompt(prompt, params) {
  try {
    if (!session) {
      session = await chrome.aiOriginTrial.languageModel.create(params);
    }
    return session.prompt(prompt);
  } catch (e) {
    console.error("Prompt failed:", e);
    reset();
    throw e;
  }
}

async function reset() {
  if (session) {
    await session.destroy();
  }
  session = null;
}

function showLoading() {
  responseElement.hidden = true;
  errorElement.hidden = true;
  loadingElement.hidden = false;
}

function showResponse(response) {
  loadingElement.hidden = true;
  errorElement.hidden = true;
  responseElement.hidden = false;

  // List of triggers in order
  const triggers = [
    "Adult Content: Unsafe for people under 18",
    "Violence: Unsafe for people sensitive to violence",
    "Hate Speech: Unsafe for people sensitive to hate speech",
    "Misinformation: False information; may be harmful",
    "Self-Harm: Unsafe for people sensitive to self-harm",
    "Malware/Phishing: Be safe",
    "Extremism: Unsafe for people sensitive to extremism",
    "Language: Offensive language",
  ];

  // Split the AI response into an array of "Yes"/"No"
  let responses = DOMPurify.sanitize(marked.parse(response));
  console.log(responses);
  // responses = response.split(' ');

  // console.log(responses);

  // // Match triggers to their responses and filter "Yes"
  // const yesTriggers = triggers
  //   .map((trigger, index) => (responses[index] === "Yes" ? trigger : null))
  //   .filter(Boolean); // Remove nulls

  // // Create display text
  // const displayText = yesTriggers.length 
  //   ? yesTriggers.join('<br>') 
  //   : 'No triggers detected.';

  // // Sanitize and render the filtered response
  // const sanitizedHTML = DOMPurify.sanitize(displayText);
  // responseElement.innerHTML = sanitizedHTML;
  responseElement.innerHTML = responses;
}


function showError(error) {
  loadingElement.hidden = true;
  responseElement.hidden = true;
  errorElement.hidden = false;
  errorElement.textContent = error;
}


