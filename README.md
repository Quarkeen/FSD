# 📊 Multi-Tab CSV Processor

> A powerful, browser-based CSV editor and viewer with AI assistance, multi-tab support, and advanced data manipulation tools.

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![CSV Processor Demo](./demo-screenshot.png)

---

## ✨ Features

- 🗂️ **Multi-Tab Interface** - Work on multiple CSV files simultaneously
- ✏️ **Inline Editing** - Double-click any cell to edit with undo/redo support
- 🔄 **Advanced Operations** - Sort, filter, merge files with SQL-style joins (LEFT, RIGHT, INNER, OUTER, CROSS)
- 🤖 **AI Assistant** - Built-in AI chat to ask questions about your data
- 📊 **Data Transformation**
  - Formula columns (Excel-like formulas)
  - Pivot tables and grouping
  - Conditional formatting
  - Remove duplicates
  - Handle missing data (drop, fill, forward-fill)
- ⚡ **Lightning Fast** - All processing happens locally using Web Workers
- 🔒 **100% Secure** - No data leaves your browser
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 💾 **Export Options** - Download processed data as CSV
- 🎨 **Clean UI** - Professional, minimal design inspired by ConvertCSV

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

Clone the repository
Navigate to project directory
Install dependencies
npm install
### Running the Application
npm run dev
### Building for Production
npm run build

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next-generation frontend tooling

### Data Processing
- **PapaParse** - Fast CSV parsing library
- **Web Workers** - Background processing for performance

### AI Integration
- **GEMINI API** - AI-powered data assistant (optional)

---

## 📁 Project Structure
├── public/ # Static assets
├── src/
│ ├── components/ # React components
│ │ ├── DataTable.jsx # Data display table
│ │ ├── EditableTable/ # Inline editing component
│ │ ├── TabManager/ # Multi-tab management
│ │ ├── DynamicControlPanel/ # Control panel
│ │ ├── DataChat/ # AI chat interface
│ │ └── Profile.jsx # User profile
│ ├── hooks/ # Custom React hooks
│ │ ├── useUndoRedo.js # Undo/redo functionality
│ │ └── useResponsive.js # Responsive detection
│ ├── pages/ # Route pages
│ │ ├── LandingPage.jsx # Landing page
│ │ ├── SignInPage.jsx # Authentication
│ │ └── SignUpPage.jsx # Registration
│ ├── worker/ # Web Workers
│ │ └── processor.js # CSV processing logic
│ ├── App.jsx # Main app component
│ ├── main.jsx # App entry point
│ └── index.css # Global styles
├── .env.example # Environment variables template
├── package.json # Dependencies
├── vite.config.js # Vite configuration
└── README.md # You are here!
## 🔧 Configuration

### Environment Variables
refer the .env.example

---

## 💡 Usage Examples

### Basic CSV Upload

1. Click on "Choose file" or drag & drop your CSV
2. Data automatically loads in the table
3. Use controls to sort, filter, or edit

### Multi-Tab Workflow



