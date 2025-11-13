import React, { useState, useEffect, useRef } from 'react';

/**
 * A reusable fetch wrapper with exponential backoff.
 * @param {string} url The API endpoint to call.
 * @param {object} payload The JSON payload for the POST request.
 * @param {number} retries Number of retries left.
 * @param {number} delay The current delay in ms.
 * @returns {Promise<object>} The JSON response from the API.
 */
async function fetchWithBackoff(url, payload, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`APIError ${response.status}`);
      }
      const errorData = await response.json();
      throw new Error(errorData.error.message || "An unknown API error occurred.");
    }
    return response.json();
  } catch (error) {
    if (error.message.startsWith('APIError') && retries > 0) {
      // Don't log to console for throttled requests
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithBackoff(url, payload, retries - 1, delay * 2);
    } else {
      console.error("Fetch error:", error.message);
      throw error; // Rethrow the final error
    }
  }
}

/**
 * Calls the Gemini API with the provided context and prompt.
 * @param {string} userPrompt The user's question.
 * @param {object} data The data (first 20 rows) to use as context.
 * @returns {Promise<string>} The AI's text response.
 */
async function callGeminiApi(userPrompt, data) {
  const apiKey = "import.meta.env.VITE_GEMINI_KEY"; // API key is injected by the environment
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`;

  const dataContext = JSON.stringify(data, null, 2);

  const systemPrompt = `You are a helpful data analyst. You will be given a JSON array representing the first 20 rows of a user's CSV data. Your task is to answer the user's question based *only* on this data snippet.

RULES:
- Base your answer *only* on the provided JSON data.
- If the data snippet is insufficient to answer the question, clearly state that your analysis is limited to the first 20 rows and you cannot provide a complete answer.
- Do not make up information or data.
- Be concise and clear.`;
  
  const userQuery = `Here is my data sample (first 20 rows):
${dataContext}

My question is: ${userPrompt}`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
  };

  try {
    const result = await fetchWithBackoff(apiUrl, payload);
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "Sorry, I couldn't get a response from the AI.";
  } catch (error) {
    return `Error: ${error.message}`;
  }
}


function DataChat({ summary, data, onClose }) {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! I am ready to answer questions about the first 20 rows of your data. What would you like to know?' }
  ]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMsg = { sender: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setPrompt('');

    const aiText = await callGeminiApi(prompt, data);
    const aiMsg = { sender: 'ai', text: aiText };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[400px] bg-white border border-gray-300 rounded-lg shadow-lg mt-6">
      <div className="flex justify-between items-center p-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-indigo-700">Ask AI</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-xl ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md px-4 py-2 rounded-xl bg-gray-200 text-gray-800">
              <p className="text-sm">Typing...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default DataChat;