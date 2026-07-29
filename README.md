# FlowForge - Lightweight Production Tracking System

FlowForge is a lightweight, generic, multi-tenant production tracking web application designed for small and medium manufacturing businesses (PCB, Furniture, Textile, Printing, Packaging, Metal Fabrication, Food Processing, Plastics, Electronics, etc.).

## 🚀 Features

- **Multi-Step Setup Wizard**: 4-step onboarding for company profile, custom departments, reorderable production stages, and department logins.
- **Company Owner Dashboard**: KPI metrics, department active workload breakdown, floor activity audit stream, quick order creation, and CSV export.
- **Department Dashboard**: Workstation view showing only assigned orders with 1-click **Complete Stage** progression.
- **Dynamic Order Workflow Engine**: Interactive `StageStepper` visual timeline showing sequential production progress, entry/completion timestamps, and user signatures.
- **Department & Stage Management**: Reorderable workflow stages assigned to custom departments.
- **Reports & Activity Logs**: Complete audit log history and raw order CSV export.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), JavaScript, Tailwind CSS, React Router v6, Axios, Lucide Icons.
- **Backend**: Node.js, Express.js (MVC Pattern).
- **Database**: MongoDB with Mongoose ODM.
- **Authentication**: JWT stored in HTTP-Only Cookies, bcrypt password hashing, Role-Based Access Control (RBAC).

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on `mongodb://127.0.0.1:27017`)

### 1. Install & Seed Database
```bash
# Setup Backend
cd backend
npm install
npm run seed

# Setup Frontend
cd ../frontend
npm install
```

### 2. Run the Application
In terminal 1 (Backend):
```bash
cd backend
npm start
```
*Backend API server runs on `http://localhost:5000`.*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend dev server runs on `http://localhost:5173`.*

---

## 🔐 Demo Credentials

| Role | Username | Password |
|---|---|---|
| **Company Owner** | `owner` | `password123` |
| **Cutting Department** | `dept_cutting` | `password123` |
| **Assembly Department** | `dept_assembly` | `password123` |
| **Quality Department** | `dept_quality` | `password123` |
| **Dispatch Department** | `dept_dispatch` | `password123` |

---

## 📄 License
ISC
