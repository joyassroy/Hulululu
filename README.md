# 💬 Hulululu - Real-Time Chat Application

Hulululu is a modern, fully responsive, and feature-rich real-time chat application built with Next.js. It offers a seamless messaging experience with real-time updates, image sharing, dynamic online statuses, and advanced user privacy controls.

## ✨ Features

* **Real-Time Messaging:** Instant message delivery and reception powered by Pusher.
* **Authentication:** Secure login and registration using NextAuth.js (Supports Google OAuth and Credentials/Email-Password).
* **Media Sharing:** Effortless image uploading and rendering integrated with Cloudinary.
* **Live Status & Last Seen:** Real-time online/offline presence indicators and accurate "last seen" timestamps.
* **Typing Indicators:** Animated real-time typing bubbles when the other user is typing.
* **Smart Chat Sorting:** Active conversations automatically move to the top of the sidebar.
* **User Privacy (Block/Unblock):** Advanced block system hiding inputs and showing targeted alerts.
* **Push Notifications:** Sound alerts and beautiful toast notifications for incoming messages.
* **Bilingual UI:** Toggle seamlessly between English and Bengali interfaces.
* **Modern UI/UX:** Glassmorphism effects, smooth Framer Motion animations, and a fully responsive mobile-first design.

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Frontend:** React, Tailwind CSS, Framer Motion, Lucide React
* **Backend & Database:** Node.js, MongoDB (Mongoose)
* **Real-time WebSocket:** [Pusher](https://pusher.com/)
* **Authentication:** [NextAuth.js](https://next-auth.js.org/)
* **Image Storage:** [Cloudinary](https://cloudinary.com/)
* **Alerts & Emojis:** React Hot Toast, Emoji Picker React

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

Make sure you have the following accounts created:
* MongoDB Atlas (Database)
* Pusher (Real-time WebSockets)
* Cloudinary (Image Storage)
* Google Cloud Console (For Google OAuth Client ID & Secret)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/joyassroy/hulululu.git](https://github.com/joyassroy/hulululu.git)
    cd hulululu
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add the following keys:

    ```env
    # Database
    MONGODB_URI=your_mongodb_connection_string

    # NextAuth
    NEXTAUTH_SECRET=your_nextauth_secret_key
    NEXTAUTH_URL=http://localhost:3000

    # Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    # Pusher
    PUSHER_APP_ID=your_pusher_app_id
    NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
    PUSHER_SECRET=your_pusher_secret
    NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster

    # Cloudinary
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_unsigned_preset
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.
6.  LiveLink: https://hulululu.vercel.app/

## 👨‍💻 Author

**Joyassroy Barua (ijb)**
* Location: Gazipur, Bangladesh
* Institution: Daffodil International University (DIU)

---
*Feel free to star ⭐ this repository if you find it helpful!*
