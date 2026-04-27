# 📖 Webpage Q\&A Assistant

An AI-powered fullstack web application that can read entire webpages and answer user questions about their content. Built with **React** for the frontend, **Express.js** for the backend, and **Google’s AI Studio** for natural language processing.

This app uses **RAG (Retrieval-Augmented Generation)** for handling large/multiple webpages, **function calling** for reliable task execution, and **structured outputs** for extracting clean, machine-readable data.

---

# Deployment Link

https://readingassist.netlify.app/

---

## 🚀 Features

* Extracts and processes text from webpages
* AI-powered Q\&A based on page content
* Interactive chat interface for clarifying doubts
* **RAG-powered knowledge retrieval** across long or multiple webpages
* **Function calling** for reliable backend task execution
* **Structured outputs** for extracting clean JSON data (tables, product info, metadata, etc.)
* Fullstack setup with React + Express
* Extensible architecture for future enhancements

---

## 🛠️ Tech Stack

* **Frontend:** React + Vite (or CRA)
* **Backend:** Express.js (Node.js)
* **AI API:** Google AI Studio (Generative AI API)
* **Vector DB (for RAG):** Pinecone / Weaviate / Qdrant / pgvector
* **Optional:** Chrome Extension integration

---

## 🔌 API Endpoints

### `POST /api/ask`

Ask a question about the webpage content.
**Request body:**

```json
{
  "url": "https://example.com",
  "question": "What is this page about?"
}
```

**Response:**

```json
{
  "answer": "This page explains..."
}
```

---

## 📚 RAG Features

1. **Ask Across Multiple Pages** → Query knowledge across multiple URLs or documents.
2. **Contextual Summaries** → Generate section-wise summaries (FAQ, pricing, reviews, etc.).
3. **Comparative Q\&A** → Compare content between different websites.
4. **Persistent Knowledge Base** → Save and query previously visited webpages.

---

## ⚡ Function Calling Features

1. **URL Fetching** → AI can call `fetchWebpage(url)` to pull webpage content.
2. **Highlight & Answer** → Users click text, AI calls `highlightSection(text)` to explain.
3. **Search Within Page** → AI calls `findInPage(query, content)` for precise answers.
4. **Fact Verification** → AI calls `checkFact(statement)` before answering.

---

## 📊 Structured Output Features

Sometimes you need **clean, machine-readable answers** instead of plain text. This app supports structured outputs such as JSON:

* **Product Extraction** → Extract `{ name, price, rating }` from an e-commerce page
* **Metadata Extraction** → Get `{ title, author, publishDate }` from articles/blogs
* **Table Conversion** → Convert raw page tables into structured JSON arrays
* **Key-Value Summaries** → Return FAQs or policy documents as structured fields

**Example:**

```json
{
  "products": [
    { "name": "Wireless Mouse", "price": "$19.99", "rating": 4.5 },
    { "name": "Mechanical Keyboard", "price": "$89.99", "rating": 4.7 }
  ]
}
```

---

## 📦 Future Improvements

* Chrome extension for real-time Q\&A on any page
* Support for multiple document formats (PDF, Word, etc.)
* Chat memory with RAG for persistent sessions
* Export structured data directly as CSV/Excel