# NEXU AI WORKSTATION PC BUILD GUIDE
## 🖥️ Zero-Bottleneck Custom PC Builds for Local AI Models (LLMs & Vision)

Aapke paas **Monitor already hai**, isliye yeh poora budget **sirf aur sirf CPU Cabinet (Desktop Tower)** ke liye plan kiya gaya hai.

---

## 📌 TABLE OF CONTENTS
1. [AI PC Buying Rules (No Bottleneck Formula)](#ai-pc-buying-rules)
2. [BUILD 1: ₹50,000 AI WORKHORSE (14B Models Master)](#build-1-50000-ai-workhorse)
3. [BUILD 2: ₹1,00,000 AI POWERHOUSE BEAST (14B, 32B & 70B Ready)](#build-2-100000-ai-powerhouse-beast)
4. [AI Model Capability Comparison (Kaunsa Model Kaise Chalega)](#ai-model-capability-comparison)
5. [Connecting to Your Monitor (Ports & Cables)](#connecting-to-your-monitor)

---

## 🧠 1. AI PC BUYING RULES (Bottleneck Na Aane Ka Formula)

AI Models (jaise Ollama, vLLM, DeepSeek, Qwen) chalane ke liye 3 cheezein sabse zaroori hoti hain:
1. **GPU VRAM:** Sabse zyada VRAM honi chahiye (12 GB ya 16 GB minimum). 8 GB VRAM me 14B model atak jata hai.
2. **RAM Bandwidth & Size:** Hamesha **Dual Channel (2 sticks)** honi chahiye taaki jab model GPU se RAM me offload ho, toh speed aadhi na ho.
3. **Gen4 NVMe SSD:** 10GB–40GB ke models disk se RAM me 2–3 second me load hone chahiye, isliye fast M.2 NVMe SSD zaroori hai.

---

## 🛠️ BUILD 1: ₹50,000 AI WORKHORSE
> **Target:** 14B AI Models (Qwen 2.5 14B, DeepSeek-R1-14B) 100% GPU par smooth speed (30–40 tokens/sec) se chalana.

| Component | Model & Specifications | Est. Price (₹) | Kyu Chuna? (Zero Bottleneck Reason) |
| :--- | :--- | :--- | :--- |
| **Graphics Card (GPU)** | **NVIDIA GeForce RTX 3060 12GB GDDR6** *(Zotac / MSI / Asus)* | ₹23,500 (New) / ₹17,000 (Used) | **12 GB VRAM!** ₹50k me 14B model chalane ke liye yeh akela GPU hai jo poore model ko VRAM me fit kar leta hai. |
| **Processor (CPU)** | **AMD Ryzen 5 5600** (6 Cores / 12 Threads, 32MB L3 Cache, PCIe 4.0) | ₹9,500 | 32MB L3 cache aur PCIe 4.0 support. RTX 3060 ke saath 0% bottleneck. |
| **Motherboard** | **MSI B550M PRO-VDH WiFi** | ₹8,500 | 4 RAM Slots (aage jaakar 64GB kar sakte ho), PCIe 4.0 x16, Dual M.2 slots, Built-in WiFi + Bluetooth. |
| **RAM** | **32 GB (16GB × 2) DDR4 3200MHz CL16** *(G.Skill Ripjaws / Corsair Vengeance)* | ₹5,500 | Dual Channel mode me chaleagi. 32B model chalane me RAM buffer degi. |
| **Storage (SSD)** | **1 TB Western Digital Blue SN580 Gen4 NVMe M.2** (Read: 4150 MB/s) | ₹5,200 | Fast model weights loading. 1 TB me 15-20 bade models store ho jayenge. |
| **Power Supply (PSU)** | **Deepcool PK650D / Cooler Master MWE 650W 80+ Bronze** | ₹4,200 | 650W certified power. System full load par 350W lega, toh 300W ka safe buffer rahega. |
| **Cabinet** | **Ant Esports ICE-112 / Galax Revolution 05 Mesh** | ₹3,200 | Mesh front panel + 4 pre-installed 120mm fans taaki ghanto heavy model run karne par GPU thanda rahe. |
| **TOTAL ESTIMATED** | | **₹49,600 – ₹51,000** | *(Pura Cabinet Ready)* |

---

## 🚀 BUILD 2: ₹1,00,000 AI POWERHOUSE BEAST
> **Target:** 14B models super fast speed par, 32B models aaram se, aur 70B models Q4 quantized mode me bina crash hue chalana. Future-proof AM5 Platform.

| Component | Model & Specifications | Est. Price (₹) | Kyu Chuna? (Zero Bottleneck Reason) |
| :--- | :--- | :--- | :--- |
| **Graphics Card (GPU)** | **NVIDIA GeForce RTX 4060 Ti 16GB GDDR6** *(Zotac / Inno3D)* | ₹42,500 | **16 GB Dedicated VRAM!** Ada Lovelace architecture, 4th Gen Tensor Cores. 14B model ke saath 16k context window aaram se GPU me fit hoga. |
| **Processor (CPU)** | **AMD Ryzen 5 7600** (6 Cores / 12 Threads, 5.1 GHz Boost, AM5 Platform) | ₹17,500 | AM5 platform par hai. Future me bina motherboard change kiye Ryzen 9000 lag sakega. |
| **CPU Cooler** | **Deepcool AG400 / AK400 Digital** | ₹2,200 | CPU temperature ko 60-65°C par lock rakhega continuous AI task ke dauran. |
| **Motherboard** | **MSI PRO B650M-A WiFi / ASRock B650M PG Lightning** | ₹12,500 | DDR5 support, PCIe 5.0 M.2 slot, heavy VRM heatsinks. |
| **RAM** | **64 GB (32GB × 2) DDR5 6000MHz CL30/CL36** *(Corsair Vengeance / G.Skill)* | ₹14,500 | **64 GB DDR5!** 70B model chalane ke liye 64GB RAM zaroori hai. 6000MHz speed se CPU offload 2x fast hoga. |
| **Storage (SSD)** | **2 TB Western Digital Black SN770 Gen4 NVMe M.2** (5150 MB/s) | ₹10,500 | 2TB high endurance storage taaki 50GB ke 70B models aur dataset bina jagah kam pade store ho sakein. |
| **Power Supply (PSU)** | **MSI MAG A750GL / DeepCool PM750D 750W 80+ Gold / Bronze** | ₹5,800 | 750W certified. Stable power deliver karega zero voltage drops ke saath. |
| **Cabinet** | **Lian Li Lancool 216 / Ant Esports 511MT Mesh High-Airflow** | ₹4,500 | 2x 140mm front high-RPM fans + 120mm exhaust. Top-class thermal performance. |
| **TOTAL ESTIMATED** | | **₹99,500 – ₹1,03,000** | *(Full AI Studio Workstation)* |

---

## 📊 AI MODEL CAPABILITY COMPARISON

| AI Model Size | Example Models | ₹50,000 Build Par Speed | ₹1,00,000 Build Par Speed |
| :--- | :--- | :--- | :--- |
| **7B / 8B** | Llama 3 8B, Mistral 7B, Gemma 2 | **55 - 65 Tokens/sec** (100% GPU) | **85 - 100 Tokens/sec** (100% GPU) |
| **14B** | **Qwen 2.5 14B, DeepSeek-R1-14B** | **30 - 38 Tokens/sec** (100% GPU - 12GB VRAM me fit) | **50 - 65 Tokens/sec** (100% GPU - 16GB VRAM me fit) |
| **32B** | Qwen 2.5 32B, DeepSeek-R1-32B | **12 - 16 Tokens/sec** (GPU 12GB + RAM 32GB) | **22 - 28 Tokens/sec** (GPU 16GB + DDR5 64GB) |
| **70B** | Llama 3.3 70B Q4 | Memory kam padegi (Not Recommended) | **5 - 8 Tokens/sec** (GPU 16GB + 64GB DDR5 RAM offload) |

---

## 🖥️ CONNECTING TO YOUR EXISTING MONITOR

Aapko bas yeh dekhna hai ki aapke monitor me kaunsa port hai:
* **HDMI:** Dono graphic card (RTX 3060 aur RTX 4060 Ti) me 1x HDMI 2.1 port hota hai. Standard HDMI cable se direct lag jayega.
* **DisplayPort (DP):** Dono cards me 3x DisplayPort 1.4a ports hote hain. Agar monitor 144Hz/165Hz ka hai toh DP cable lagaiye.
* *Note:* Monitor ka cable motherboard me mat lagana, hamesha peeche GPU (graphics card) ke port me lagana.

