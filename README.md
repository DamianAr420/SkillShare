# 🚀 SkillShare

<p align="center">
  <img src="src/assets/SkillShareLogo.png" alt="SkillShare Logo" width="200"/>
</p>

## 🌐 Live Demo
**Sprawdź aplikację online:** [https://damianar420.github.io/SkillShare/](https://damianar420.github.io/SkillShare/)  
*(Uwaga: Backend jest hostowany na darmowej instancji Render, więc pierwsze ładowanie może zająć kilkanaście sekund).*

---

## 🇵🇱 Opis (PL)

**SkillShare** to aplikacja typu marketplace, stworzona w modelu Fullstack, która umożliwia użytkownikom **oferowanie oraz wyszukiwanie unikalnych umiejętności**. 

Platforma została zbudowana z myślą o płynnym UX, oferując dynamiczne wyszukiwanie ogłoszeń, zaawansowane profile użytkowników oraz autorski system komunikacji. Kluczowym elementem projektu była implementacja **czatu w czasie rzeczywistym**, co pozwoliło na zgłębienie tematyki asynchroniczności i komunikacji dwukierunkowej (WebSockets).

### ✨ Główne Funkcjonalności
- **System Ogłoszeń:** Pełny CRUD (tworzenie, przeglądanie, edycja, usuwanie) z kategoryzacją.
- **Real-time Chat:** Błyskawiczna komunikacja między użytkownikami dzięki Socket.io.
- **Interaktywna Wyszukiwarka:** Filtrowanie ofert według kategorii i typu (oferta/prośba).
- **Zarządzanie Profilem:** Personalizacja konta, wgrywanie avatarów oraz podgląd watchlisty (obserwowanych ogłoszeń).
- **Bezpieczeństwo:** Autoryzacja oparta o JWT oraz chronione ścieżki (Protected Routes).

### 🛠 Stack Technologiczny

**Frontend:**
- **Vue 3 (Composition API)** – nowoczesna i reaktywna struktura komponentów.
- **Pinia** – profesjonalne zarządzanie stanem aplikacji (Store).
- **Tailwind CSS** – responsywny i nowoczesny design.
- **Vue Router** – zaawansowane zarządzanie nawigacją.

**Backend:**
- **Node.js & Express.js** – stabilna architektura serwerowa.
- **MongoDB & Mongoose** – baza danych NoSQL z modelowaniem danych.
- **Socket.io** – obsługa WebSocketów dla czatu.
- **Cloudinary** – chmura do przechowywania zdjęć użytkowników i ogłoszeń.

---

## 🇬🇧 Description (EN)

**SkillShare** is a fullstack marketplace application designed for users to **exchange and discover unique skills**. 

The platform focuses on a seamless user experience, featuring dynamic ad browsing, detailed user profiles, and a built-in messaging system. The core technical highlight of this project is the **real-time chat** implementation, which allowed for deep exploration of asynchronous data flow and bi-directional communication (WebSockets).

### ✨ Key Features
- **Advertisement System:** Full CRUD functionality (create, read, update, delete) with categorization.
- **Real-time Chat:** Instant messaging between users powered by Socket.io.
- **Interactive Search:** Filtering offers by category and type (offer/request).
- **Profile Management:** Account personalization, avatar uploads, and watchlist management.
- **Security:** JWT-based authentication and protected frontend/backend routes.

### 🛠 Tech Stack

**Frontend:**
- **Vue 3 (Composition API)**
- **Pinia** (State Management)
- **Tailwind CSS**
- **Vue Router**

**Backend:**
- **Node.js & Express.js**
- **MongoDB & Mongoose**
- **Socket.io** (Real-time communication)
- **Cloudinary** (Image hosting)

---

## 📌 Key Learnings / Czego się nauczyłem

<details open>
<summary><b>🇵🇱 Wersja Polska</b></summary>

* **Komunikacja w czasie rzeczywistym:** * Implementacja **WebSockets (Socket.io)** do obsługi czatu na żywo.
    * Zarządzanie pokojami rozmów (`rooms`) oraz dynamiczne śledzenie statusu **online/offline**.
* **Zaawansowane zarządzanie stanem:** * Architektura **Pinia** – synchronizacja danych między widokami, m.in. globalny licznik nieprzeczytanych wiadomości oraz reaktywne sortowanie listy konwersacji.
* **Projektowanie UI/UX:** * Tworzenie responsywnego interfejsu (Mobile First) z wykorzystaniem **Tailwind CSS**.
    * Obsługa stanów ładowania (Loadery) oraz system powiadomień typu Toast.
* **Fullstack Deployment:** * Konfiguracja procesów **CI/CD** dla frontendu (GitHub Pages) oraz zarządzanie środowiskiem produkcyjnym na hostingu Render.

</details>

<details>
<summary><b>🇬🇧 English Version</b></summary>

* **Real-time Communication:** * Implementation of **WebSockets (Socket.io)** for live messaging.
    * Chat room management (`rooms`) and dynamic **online/offline** status tracking.
* **Advanced State Management:** * Using **Pinia** architecture to synchronize data across views, including global unread message counters and reactive conversation sorting.
* **UI/UX Design:** * Building a responsive, mobile-first interface using **Tailwind CSS**.
    * Handling loading states (Loaders) and implementing a Toast notification system.
* **Fullstack Deployment:** * Configuring **CI/CD** processes for frontend (GitHub Pages) and managing production environments on Render.

</details>

---

## 🚧 Project Status / Status projektu
![Completed](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)
![Type](https://img.shields.io/badge/Type-Educational%20Fullstack-blue?style=for-the-badge)

---

## 👤 Author / Autor
**Damian**
- **GitHub:** [@damianar420](https://github.com/damianar420)
- **Project Link:** [SkillShare Live](https://damianar420.github.io/SkillShare/)
