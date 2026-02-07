<div align="center">
  <img src="assets/logo.JPG" alt="Poco Logo" width="150" height="150" style="border-radius: 25px;">

# Poco: Your Pocket Coworker

**A cloud-based Claude Code Agent Platform delivering a Manus-like experience**

Think of it as a **safer** (sandboxed isolation), **more beautiful** (modern UI), and **simpler to configure** (ready-to-use) alternative to **OpenClaw**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue)](https://www.docker.com/)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/poco-ai/poco-agent)

[English](./README.md) | [English](./README_EN.md)

</div>

---

## Core Features

- **Secure Sandbox**: Tasks run in isolated containers - install dependencies or modify files freely without affecting your host environment.
- **Beautiful UI & Mobile Support**: Provides an attractive web interface with output previews, allowing you to command your Agent from anywhere on your phone.
- **Zero Configuration Ready-to-Use**: No complex local environment setup needed - one-click Docker launch with a complete runtime environment.
- **Complete Capabilities & MCP/Skills Extensions**: Fully replicates Claude Code native features (Slash Commands, Plan Mode, AskQuestion), and supports MCP protocol or custom Skills for unlimited extensibility.
- **Async & Scheduled Tasks**: Supports background execution and scheduled triggers - your Agent keeps working in the cloud even with the browser closed.
- **More Features**: Built-in **browser** for autonomous web research, **GitHub repository connection** support, and many more powerful features waiting to be discovered!

![home](assets/home.png)

<details>
<summary><strong>Click to view more feature screenshots</strong></summary>
<br>

**1. Beautiful frontend output rendering**

![output](assets/output.png)

**2. Full MCP/skills support with easy configuration**

![home](assets/capability.png)

![skills](assets/skills.png)

**3. Scheduled tasks**

![schedule](assets/schedule.png)

</details>

<details>
<summary><strong>Click to view feature demos</strong></summary>
<br>

**1. Mobile operation demo**
Perfectly adapted for mobile - your AI Coworker in your pocket.
![Demo4](https://github.com/user-attachments/assets/ccf680bb-358c-4fc9-ad97-50f75b5ea3ac)

**2. Coding and output preview**
Create a game through a few conversations with live preview on the right.
![Demo1](https://github.com/user-attachments/assets/0ef59c4c-8363-44a6-b9ed-7005ccfd71cb)

**3. Complex file processing**
Supports reading and analyzing various project files.
![Demo3](https://github.com/user-attachments/assets/8135dab4-6396-4af8-97af-6f665853fb56)

</details>

## Quick Start

Run the interactive setup script to automatically generate configuration and start services:

```bash
./scripts/quickstart.sh
```

Visit: http://localhost:3000 after startup completes.

For detailed deployment documentation and troubleshooting, please refer to the [Deployment Guide](./docs/README.md).

## Community

Scan to join our WeChat group:

<img src="assets/wx_group.jpg" alt="WeChat Group QR Code" width="180">

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=poco-ai/poco-agent&type=date&legend=top-left)](https://www.star-history.com/#poco-ai/poco-agent&type=date&legend=top-left)

## Acknowledgments

Our project is inspired by [wegent](https://github.com/wecode-ai/Wegent) and refers to its architecture design. Thanks for the hard work of the original author!
