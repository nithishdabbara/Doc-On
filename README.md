# 🏥 Doc-On Healthcare Portal

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://doc-on-ten.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge)](https://github.com/nithishdabbara/Doc-On)

**Doc-On** is a next-generation healthcare portal designed to bridge the gap between patients and doctors. Featuring an AI-powered diagnostic assistant, secure medical record management with OCR, and real-time communication, Doc-On simplifies healthcare accessibility for everyone.

---

## 🚀 Live Link
Explore the portal live at: **[https://doc-on-ten.vercel.app](https://doc-on-ten.vercel.app)**

---

## ✨ Key Features

### 🤖 AI-Powered Chatbot (Gemini AI)
- **Symptom Analysis:** Describe your symptoms in natural language, and the AI suggests the right specialist (e.g., Dermatologist, Cardiologist).
- **Multimodal Support:** Upload medical reports or prescriptions, and the AI analyzes the content to provide insights.
- **Voice Integration:** Speak your symptoms directly using the built-in voice recognition.
- **Urgency Assessment:** Automatically identifies high-risk symptoms and provides immediate precautions.

### 📄 Medical Record Management & OCR
- **Digital Records:** Securely upload and manage your medical history, prescriptions, and lab reports.
- **OCR Technology:** Integrated Tesseract.js (OCR) to extract text from scanned documents for easier searching and analysis.

### 💳 Integrated Payments (Razorpay)
- Seamless and secure payment gateway for booking doctor appointments and lab tests.
- Automated receipt generation and billing history.

### 💬 Real-time Communication
- **Patient-Doctor Chat:** Instant messaging powered by **Socket.io** for seamless follow-ups and consultations.
- **Video Consultations:** (Future Scope) High-quality video calls for remote diagnosis.

### 📊 Health Analytics
- **Personalized Dashboards:** Track your health vitals, appointment history, and upcoming checkups.
- **Risk Assessment:** Advanced algorithms to predict potential health risks based on historical data.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **AI/ML:** Google Gemini Pro API, Tesseract.js (OCR)
- **Payments:** Razorpay API
- **Authentication:** JWT, Google OAuth
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🏗️ Project Structure

```text
Doc-On/
├── client/           # React Frontend (Vite)
├── server/           # Node.js Backend
│   ├── controllers/  # Logic for AI, Payments, OCR, etc.
│   ├── models/       # MongoDB Schemas
│   ├── routes/       # API Endpoints
│   └── uploads/      # Static storage for records
└── package.json      # Main entry and scripts
```

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nithishdabbara/Doc-On.git
   cd Doc-On
   ```

2. **Install Dependencies:**
   ```bash
   # Install root, client, and server dependencies
   npm run install-all 
   # (Or manually in each folder)
   ```

3. **Environment Variables:**
   Create a `.env` file in both `client` and `server` directories following the `.env.example` file (ensure you have Gemini and Razorpay keys).

4. **Run the Application:**
   ```bash
   npm run dev
   ```
   The app will run concurrently on `http://localhost:5173` (Client) and `http://localhost:5000` (Server).

---

## 🛡️ Security & Privacy
Doc-On prioritizes patient data privacy by using industry-standard encryption, secure JWT-based authentication, and restricted access to sensitive medical records.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License
This project is licensed under the ISC License.

---

Developed with ❤️ by [Nithish Dabbara](https://github.com/nithishdabbara)
