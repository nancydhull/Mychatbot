# 💄 Dhull Cosmetic Shop Chatbot

> An AI-powered customer-support chatbot for **Dhull Cosmetic Shop**, Kaithal, Haryana, that answers customers' questions instantly, politely, and professionally.

🔗 **Replit Project:** [Dhull-Cosmetic-Shop-Chatbot](https://replit.com/@nancydhull72/Dhull-Cosmetic-Shop-Chatbot)

---

## 📌 Table of Contents

1. [About the Project](#-about-the-project)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [How It Works](#-how-it-works)
5. [Getting Started](#-getting-started)
6. [Environment Variables](#-environment-variables)
7. [Deployment on Vercel](#-deployment-on-vercel)
8. [Customizing the Chatbot](#-customizing-the-chatbot)
9. [Example Conversations](#-example-conversations)
10. [Troubleshooting](#-troubleshooting)
11. [Future Improvements](#-future-improvements)
12. [Security Notes](#-security-notes)
13. [About the Shop](#-about-the-shop)
14. [Author](#-author)
15. [License](#-license)

---

## 📖 About the Project

Customers often ask the same questions again and again: what products are available, what the shop timings are, where the shop is located, and so on. This chatbot handles those questions automatically so that customers get quick answers at any time of day.

The chatbot uses the **Groq API** to generate fast, natural replies, and it is instructed to answer only shop-related questions in a professional tone.

## ✨ Features

- 💬 **Instant replies** to customer questions, powered by Groq's fast AI models
- 🛍️ **Shop-focused answers** about products, services, and general shop information
- 🤝 **Professional and friendly tone** that matches a real shop assistant
- 📱 **Works in the browser** on mobile and desktop
- ⚡ **Quick to deploy** with Replit and Vercel
- 🔧 **Easy to customize**: update the shop details and instructions without rebuilding everything

## 🛠️ Tech Stack

| Part | Technology |
|------|------------|
| AI Model API | [Groq API](https://groq.com/) |
| Development | [Replit](https://replit.com/) |
| Hosting | [Vercel](https://vercel.com/) |

## ⚙️ How It Works

1. The customer types a question in the chat box.
2. The question is sent to the backend of the app.
3. The backend sends the question, along with the shop's instructions, to the Groq API.
4. Groq generates a reply.
5. The reply is shown to the customer in the chat window.

The API key stays on the server side, so it is never exposed to the customer's browser.

## 🚀 Getting Started

### Prerequisites

- A [Replit](https://replit.com/) account
- A [Groq](https://console.groq.com/) account and API key
- (For deployment) A [Vercel](https://vercel.com/) account

### Run on Replit

1. Open the project on Replit: [Dhull-Cosmetic-Shop-Chatbot](https://replit.com/@nancydhull72/Dhull-Cosmetic-Shop-Chatbot)
2. Click **Fork** (or **Remix**) to make your own copy.
3. Open the **Secrets** tool in Replit and add your Groq API key (see below).
4. Click **Run**.
5. Open the preview window and start chatting.

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your personal API key from the Groq console |

Example:

```
GROQ_API_KEY=your_api_key_here
```

> Replace `your_api_key_here` with your own key. Never write your real key in the code or in this README.

## 🌐 Deployment on Vercel

1. Push your project to a GitHub repository (without any API keys in the code).
2. Log in to [Vercel](https://vercel.com/) and click **Add New → Project**.
3. Import your GitHub repository.
4. Open **Settings → Environment Variables** and add `GROQ_API_KEY` with your key.
5. Click **Deploy**.
6. After deployment, Vercel gives you a public link that you can share with customers.

## 🎨 Customizing the Chatbot

You can change how the chatbot behaves by editing its instructions (system prompt). Things you may want to update:

- **Shop name and address**
- **Shop timings**
- **List of products and categories**
- **Offers and discounts**
- **Contact number and social media links**
- **Tone of replies** (formal, friendly, or in Hinglish)
- **What the bot should do** when it does not know an answer (for example, ask the customer to contact the shop directly)

Keep the shop information accurate and up to date so the chatbot never gives customers wrong details.

## 💬 Example Conversations

**Customer:** What products do you sell?
**Chatbot:** We offer a range of cosmetic products. Please tell me what you are looking for, and I will be happy to help!

**Customer:** Where is your shop located?
**Chatbot:** Our shop, Dhull Cosmetic Shop, is located in Kaithal, Haryana.

**Customer:** Do you have a skincare product for dry skin?
**Chatbot:** I would be glad to help you choose. Could you tell me a little more about what you need?

*(These are sample conversations. Actual replies depend on the chatbot's instructions.)*

## 🧰 Troubleshooting

| Problem | Possible Solution |
|---------|-------------------|
| Chatbot does not reply | Check that `GROQ_API_KEY` is added correctly in Replit Secrets or Vercel Environment Variables |
| "Invalid API key" error | Create a new key in the Groq console and update it |
| Works on Replit but not on Vercel | Make sure the environment variable is also added in Vercel, then redeploy |
| Replies are wrong or off-topic | Improve the instructions (system prompt) and add more shop details |
| Slow or no response | Check your internet connection and the Groq API usage limits |

## 🔮 Future Improvements

- [ ] Add a product catalog with prices
- [ ] Support Hindi and English replies
- [ ] Add voice support for customers
- [ ] Connect with WhatsApp
- [ ] Add a feedback button for customers
- [ ] Save common questions to improve answers over time

## 🔒 Security Notes

- Never share your API key publicly.
- Never upload your key to GitHub or put it inside the README.
- Store keys only in **Replit Secrets** and **Vercel Environment Variables**.
- If your key is ever leaked, delete it from the Groq console and create a new one immediately.

## 🏪 About the Shop

**Dhull Cosmetic Shop**
📍 Kaithal, Haryana

## 👩‍💻 Author

**Naincy**
📧 nancydhull72@gmail.com

If you like this project, feel free to give feedback and suggestions. 😊

## 📄 License

This project is free to use for personal and learning purposes.
