# 🏥 MedRescue

[![Hackathon](https://img.shields.io/badge/Hackathon-HackVSIT_7.0-blue.svg)](https://hack-vsit.tech/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **MedRescue** is a decentralized, 3hospital management and triage ecosystem designed to eliminate clinical bottlenecks, digitize patient history, and automate critical resource allocation. Built during the 24-hour **HackVSIT 7.0** sprint.

---

## ⚠️ The Problem
In modern clinics and mid-tier hospitals, patient management is highly fragmented:
- **No Unified History:** Doctors lack immediate access to holistic patient medication and medical history.
- **Triage Failures:** Critical patients (e.g., heart disease) are often stuck in the same queue as routine check-ups.
- **Resource Mismanagement:** Bed allocation and pharmacy inventory (medication stock) are tracked manually, leading to dangerous shortages.
- **Low-Tech Adherence:** Sometimes patients miss medication doses.

---

## 💡 Our Solution
MedRescue replaces the chaos with an intelligent, end-to-end platform:
1. **Universal Patient ID:** A single ID instantly fetches the patient's entire medical history and current prescriptions.
2. **AI-Powered Priority Triage(upcoming Featurek):** The system analyzes patient profiles upon registration. If critical symptoms (like a history of heart disease) are detected, they are automatically bumped to the top of the queue.
3. **Smart Inventory & Bed Allocation:** Real-time tracking of medication quantities and hospital bed availability, with AI predictive restocking and outbreak detection.
4. **"Zero-Data" Med Reminders:** Using an automated missed-call system, patients receive medication reminders without needing a smartphone or active data plan.

---

## ⚙️ Core Features
- [x] **Smart Appointment Booking:** Seamless online booking to eliminate waiting room rush.
- [x] **AI Diagnostic Suggestions:** AI analyzes the patient's ID and history to suggest potential diagnoses or symptom clusters to the doctor.
- [x] **Automated Triage System:** High-risk patients are flagged and prioritized automatically.
- [x] **Predictive Outbreak AI:** Analyzes incoming symptom data clusters to predict localized disease outbreaks.
- [x] **Pharmacy Inventory Sync:** Live tracking of medication stocks with automated low-stock alerts.
- [x] **Missed-Call Notifications:** Telecom-integrated reminders for patients to take their medicine.

---

## 🛠️ Tech Stack (Proposed)
* **Frontend:** React.js / Next.js / Tailwind CSS
* **Backend:** Node.js / Express or Python / FastAPI
* **Database:** MongoDB / PostgreSQL
* **AI/ML:** Python (TensorFlow / Scikit-learn for predictions)
* **Cloud/Integrations:** Twilio API (for missed call routing), Firebase

---

## 🚀 Local Setup & Installation

Follow these steps to run MedRescue locally:

### 1. Clone the repository
```bash
git clone https://github.com/techienikhil/MedRescue.git
cd MedRescue
```

### 2. Backend Setup
```bash
cd backend
npm install  # or pip install -r requirements.txt if using Python
# Add your environment variables in a .env file (Twilio keys, DB URI)
npm start    # or python main.py
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The application will start on `http://localhost:3000`.

---

## 🔮 Future Scope
- **Blockchain Integration:** Secure, decentralized storage for immutable patient records.
- **Wearable Device Sync:** Real-time IoT vitals tracking fed directly into the patient's dashboard.
- **B2B SaaS Expansion:** Scaling the platform for multi-hospital network deployment.

---

## 👥 The Team
We are a team of passionate developers from KIET Ghaziabad, building this for HackVSIT 7.0!
* **Aditya Pritam** - [GitHub](https://github.com/adityapritam) / [LinkedIn](https://www.linkedin.com/in/adityapritam)
* **Dhruv Sharma** - [GitHub](https://github.com/dhruv-lx) / [LinkedIn](https://www.linkedin.com/in/dhruv-sharma55/)
* **Nikhil Kumar** - [GitHub](https://github.com/techienikhil) / [LinkedIn](https://www.linkedin.com/in/techienikhil/)

---
*Made with ❤️ for HackVSIT.*
