# Dynamic-price-comparison
A dynamic price comparison system tracks and compares product prices across multiple platforms in real time. It updates automatically with discounts and availability, helping users find the best deals quickly and make smarter, cost-effective purchasing decisions.
# 💰 PriceScout – Smart Product Price Comparison Platform

PriceScout is a web-based application that helps users compare product prices across multiple e-commerce platforms like Amazon and Flipkart. It provides a simple and efficient way to find the best deals on products.

---

## 🚀 Features

* 🔍 Browse products by category (Laptops, etc.)
* 🛒 Compare prices from Amazon & Flipkart
* ⭐ View ratings and reviews
* 📦 Simple order management system
* 👤 Basic user authentication (in-memory)
* ⚡ Fast and lightweight backend using Node.js

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Frontend:** HTML, CSS, JavaScript (Static files)
* **Other Tools:** CORS, Nodemon

---

## 📁 Project Structure

```
project-root/
│── server.js
│── package.json
│── public/        # Frontend files
│── node_modules/
```

---

## ⚙️ Installation & Setup

1. Clone the repository:

```
git clone https://github.com/your-username/pricescout.git
cd pricescout
```

2. Install dependencies:

```
npm install
```

3. Run the project:

```
npm start
```

For development (auto-restart server):

```
npm run dev
```

4. Open in browser:

```
http://localhost:3000
```

---

## 📊 Product Catalogue

* Includes multiple categories (e.g., Laptops)
* Each product contains:

  * Name
  * Price & MRP
  * Rating & Reviews
  * Amazon & Flipkart links

---

## 🔐 Authentication

* Basic in-memory authentication system
* Stores users temporarily (no database used)

---

## 📦 Order System

* Users can place orders
* Orders stored in memory
* Each order has a unique ID

---

## ⚠️ Limitations

* No database (data resets on server restart)
* Static product data
* Basic authentication (not secure for production)

---

## 🔮 Future Improvements

* ✅ Add database (MongoDB / MySQL)
* ✅ Implement secure authentication (JWT)
* ✅ Add more product categories
* ✅ Real-time price updates using APIs
* ✅ Responsive UI improvements

---


---
