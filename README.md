# 📦 PackSite: Collector's Hub

A high-performance pack-opening and inventory management platform built with **Next.js**, **NextAuth**, and **Tailwind CSS**. Users can open digital packs, collect rare items, manage their inventory, and trade items for currency.

## 🚀 Features

*   **Real-time Inventory Management:** See your collection update instantly with optimistic UI updates.
*   **Authentication:** Secure user sessions powered by NextAuth.
*   **Dynamic Balances:** Global balance state management across the app via custom events.
*   **Responsive UI:** A modern, mobile-first design using Tailwind CSS with a dark-mode-first aesthetic.
*   **Activity Tracking:** Detailed history of every pack opened and item sold.

## 🛠 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Authentication:** [NextAuth.js](https://next-auth.js.org/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Deployment:** Vercel (recommended)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## ⚙️ Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Chilbill235/packsite
    cd packsite
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    DATABASE_URL=your_database_url
    NEXTAUTH_SECRET=your_secret_key
    NEXTAUTH_URL=http://localhost:3000
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the project in your browser.

## 📁 Project Structure

*   `app/`: Contains the page routes and layouts.
*   `components/`: Reusable UI components (Notification, ErrorDialog, Balance, Navbar).
*   `lib/`: Utility functions and database client configurations.
*   `public/`: Static assets.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
