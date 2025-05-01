🧑‍⚕️ Nurse Scheduler Agent (SPFx Web Part)
===========================================

This project is an intelligent **nurse shift scheduling assistant**, built with **SharePoint Framework (SPFx)**. It combines conversational AI, dynamic UI, and SharePoint list integration to streamline scheduling, availability checks, and shift management for healthcare teams.

* * * *

🔧 Technologies Used
--------------------

-   **SharePoint Framework (SPFx) v1.20**

-   **React + Fluent UI**

-   **PnP JS for SharePoint list access**

-   **Azure OpenAI / LLM backend for intent classification**

-   **Custom scheduling logic**

-   **Speech recognition with live transcription**

-   **Dynamic message rendering with action buttons**

* * * *

💡 Features
-----------

-   🎙️ **Voice-enabled chat** with live speech-to-text input

-   🧠 **Intent-based scheduling** using natural language input

-   📅 Smart understanding of dates like "next Monday" or "this weekend"

-   📋 Shift table responses for availability or "what's my schedule" questions

-   🔁 **Cancel a shift** directly from the chat table

-   🧠 Memory of partial inputs: asks only what's missing

-   👋 Greets user on load and explains what it can do

-   ⚙️ Dynamic follow-ups and quick reply buttons

-   🎨 Auto-scroll and fluid UX


* * * *

📦 Getting Started
------------------

### ✅ Prerequisites

-   [Node.js v16.x](https://nodejs.org)

-   [Gulp CLI](https://gulpjs.com/) (`npm install -g gulp-cli`)

-   A Microsoft 365 developer tenant

-   App Catalog site in SharePoint

### 🚀 Installation

```bash
git clone https://github.com/your-org/nurse-scheduler-agent.git
cd nurse-scheduler-agent
npm install
```

### 🧪 Local Testing

```bash
gulp serve
```

* * * *

🛠️ Build and Deployment
------------------------

### Bundle & Package

```bash
gulp bundle --ship
gulp package-solution --ship
```

Find the `.sppkg` file under:

```bash
sharepoint/solution/nurse-scheduler-agent.sppkg
```

### Upload to App Catalog

1.  Go to your SharePoint **App Catalog** site.

2.  Navigate to **Apps for SharePoint**.

3.  Upload the `.sppkg` file.

4.  Approve permissions if prompted (especially for Graph API).

### Add to Site

1.  Go to any SharePoint site.

2.  Click **Site Contents → Add an App** → Select **Nurse Scheduler Agent**.

3.  Edit a modern page and add the web part.


⚠️ Disclaimer
-------------

This project is provided **as-is** without warranty. Use at your own discretion in production environments.