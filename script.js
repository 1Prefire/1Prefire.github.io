document.addEventListener("DOMContentLoaded", () => {
 
  // ==========================================================================
  // 1. BACKGROUND CANVAS HI-TECH (RETTANGOLI CON CROCETTA + ROTAZIONE)
  // ==========================================================================
  const canvas = document.getElementById("particleCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let boxesArray = [];
 
    let mouse = {
      x: null,
      y: null,
      radius: 180
    };
 
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
 
    window.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });
 
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
 
    class TechBox {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 35 + 20;
        this.speedX = (Math.random() - 0.5) * 0.35;
        this.speedY = (Math.random() - 0.5) * 0.35;
        this.angle = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.005;
        this.opacity = Math.random() * 0.18 + 0.06;
      }
 
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.spinSpeed;
 
        if (this.x < -60) this.x = canvas.width + 60;
        if (this.x > canvas.width + 60) this.x = -60;
        if (this.y < -60) this.y = canvas.height + 60;
        if (this.y > canvas.height + 60) this.y = -60;
      }
 
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
 
        ctx.strokeStyle = `rgba(0, 240, 255, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
 
        const crossSize = 4;
        ctx.beginPath();
        ctx.moveTo(-crossSize, 0);
        ctx.lineTo(crossSize, 0);
        ctx.moveTo(0, -crossSize);
        ctx.lineTo(0, crossSize);
        ctx.strokeStyle = `rgba(0, 240, 255, ${this.opacity * 1.5})`;
        ctx.stroke();
 
        ctx.restore();
      }
    }
 
    function initBoxes() {
      boxesArray = [];
      const count = Math.floor((canvas.width * canvas.height) / 22000);
      for (let i = 0; i < count; i++) {
        boxesArray.push(new TechBox());
      }
    }
    initBoxes();
 
    function animateCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
 
      boxesArray.forEach(box => {
        box.update();
        box.draw();
      });
 
      if (mouse.x !== null && mouse.y !== null) {
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, mouse.radius
        );
        gradient.addColorStop(0, "rgba(0, 240, 255, 0.16)");
        gradient.addColorStop(1, "rgba(0, 240, 255, 0)");
 
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
      }
 
      requestAnimationFrame(animateCanvas);
    }
    animateCanvas();
  }
 
  // ==========================================================================
  // 2. SMOOTH SCROLL: ROTELLINA (INERZIA) + LINK DI NAVIGAZIONE (ANIMATO)
  // ==========================================================================
  // Se Windows/Mac ha le animazioni di sistema disattivate, il browser lo segnala e lo scroll fluido
// verrebbe spento. Con false lo scroll fluido resta SEMPRE attivo; con true rispetta quell'impostazione.
const RESPECT_REDUCED_MOTION = false;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const reduceMotion = { get matches() { return RESPECT_REDUCED_MOTION && reduceMotionQuery.matches; } };
 
  // --- Regolazioni: cambia questi numeri per modificare la sensazione ---
  const WHEEL_SPEED = 1.6;          // quanto avanza la pagina a ogni "tacca" della rotellina
  const WHEEL_SMOOTHING_MS = 320;   // più alto = scivolamento più lungo e morbido
  const ANCHOR_MIN_MS = 1000;       // durata minima dello scroll dei link (ms)
  const ANCHOR_MAX_MS = 2200;       // durata massima dello scroll dei link (ms)
  const ANCHOR_MS_PER_PX = 1.5;     // più alto = scroll dei link più lento
  const HEADER_OFFSET = 80;         // altezza della navbar fissa
 
  let mode = "idle";                // "idle" | "wheel" (inerzia rotellina) | "anchor" (click su un link)
  let targetY = window.scrollY;     // dove deve arrivare la pagina
  let currentY = window.scrollY;    // dove si trova ora (con decimali, non arrotondata)
  let lastWrittenY = window.scrollY;
  let lastFrameTime = null;
  let rafId = null;
 
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  const getMaxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
 
  function writeScroll(y) {
    window.scrollTo(0, y);
    lastWrittenY = window.scrollY;  // ricordo cosa ho scritto io, per riconoscere lo scroll fatto dall'utente
  }
 
  function syncToNative() {
    currentY = targetY = lastWrittenY = window.scrollY;
  }
 
  function stopAnimation() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    mode = "idle";
  }
 
  // --- Rotellina con inerzia morbida ---
  function wheelDeltaInPixels(e) {
    if (e.deltaMode === 1) return e.deltaY * 33;                  // righe (Firefox) → pixel
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight;  // pagine → pixel
    return e.deltaY;
  }
 
  window.addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;                                  // Ctrl + rotellina = zoom del browser
    if (reduceMotion.matches) return;                       // chi preferisce meno animazioni: scroll normale
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;    // scroll orizzontale: ci pensa il browser
 
    const el = e.target instanceof Element ? e.target : null;
    if (el && el.closest("textarea, select")) return;       // lascia scorrere i campi del modulo
 
    e.preventDefault();
 
    if (mode !== "wheel") {                                 // si parte da fermo o dall'animazione dei link
      stopAnimation();
      syncToNative();
    }
 
    targetY = clamp(targetY + wheelDeltaInPixels(e) * WHEEL_SPEED, 0, getMaxScroll());
 
    if (mode !== "wheel") {
      mode = "wheel";
      lastFrameTime = null;
      rafId = requestAnimationFrame(wheelStep);
    }
  }, { passive: false });
 
  function wheelStep(now) {
    // Il movimento dipende dal tempo e non dal numero di frame:
    // identico su schermi a 60, 120 o 144 Hz.
    const dt = lastFrameTime === null ? 16.7 : clamp(now - lastFrameTime, 1, 50);
    lastFrameTime = now;
 
    const distance = targetY - currentY;
 
    if (Math.abs(distance) < 0.5) {      // arrivati: mi fermo del tutto
      currentY = targetY;
      writeScroll(currentY);
      rafId = null;
      mode = "idle";
      return;
    }
 
    currentY += distance * (1 - Math.exp(-dt / WHEEL_SMOOTHING_MS));
    writeScroll(currentY);
    rafId = requestAnimationFrame(wheelStep);
  }
 
  // --- Animazione lenta per i click sui link ---
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
 
  function smoothScrollTo(target) {
    const start = window.scrollY;
    target = clamp(target, 0, getMaxScroll());
    const distance = target - start;
 
    stopAnimation();
 
    if (Math.abs(distance) < 1) {
      syncToNative();
      return;
    }
 
    if (reduceMotion.matches) {          // niente animazione: salto diretto
      writeScroll(target);
      syncToNative();
      return;
    }
 
    // Più la sezione è lontana, più dura (tra ANCHOR_MIN_MS e ANCHOR_MAX_MS)
    const duration = clamp(Math.abs(distance) * ANCHOR_MS_PER_PX, ANCHOR_MIN_MS, ANCHOR_MAX_MS);
    let startTime = null;
    mode = "anchor";
 
    function step(now) {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
 
      writeScroll(start + distance * easeInOutCubic(progress));
 
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
        mode = "idle";
        syncToNative();
      }
    }
 
    rafId = requestAnimationFrame(step);
  }
 
  // Click sui link (Home, Servizi, Preventivo, Contatti, bottoni hero)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const targetElement = document.querySelector(targetId);
      if (!targetElement) return;
 
      e.preventDefault();
      const elementTop = targetElement.getBoundingClientRect().top + window.scrollY;
      smoothScrollTo(elementTop - HEADER_OFFSET);
    });
  });
 
  // Se la pagina viene scrollata in altro modo (barra laterale, tastiera, touch, ricerca nella pagina),
  // l'animazione si ferma subito e cede il controllo: niente più "strattoni" all'indietro.
  window.addEventListener("scroll", () => {
    if (mode === "idle") {
      syncToNative();
    } else if (Math.abs(window.scrollY - lastWrittenY) > 2) {
      stopAnimation();
      syncToNative();
    }
  }, { passive: true });
 
  window.addEventListener("touchstart", () => {
    if (mode !== "idle") {
      stopAnimation();
      syncToNative();
    }
  }, { passive: true });
 
  window.addEventListener("resize", () => {
    if (mode === "idle") {
      syncToNative();
    } else {
      targetY = clamp(targetY, 0, getMaxScroll());
    }
  });
 
  // ==========================================================================
  // 3. HAMBURGER MENU MOBILE
  // ==========================================================================
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  const navLinks = document.querySelectorAll(".nav-link");
 
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("active");
      navMenu.classList.toggle("active");
    });
 
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }
 
  // ==========================================================================
  // 4. CALCOLATORE PREVENTIVO DINAMICO
  // ==========================================================================
  const calcService = document.getElementById("calcService");
  const urgentCheck = document.getElementById("urgentCheck");
  const calcTotal = document.getElementById("calcTotal");
 
  function updateTotal() {
    if (!calcService || !calcTotal) return;
    let basePrice = parseInt(calcService.value, 10);
    if (urgentCheck && urgentCheck.checked) {
      basePrice += 50;
    }
    calcTotal.textContent = `${basePrice}€`;
  }
 
  if (calcService) {
    calcService.addEventListener("change", updateTotal);
    if (urgentCheck) urgentCheck.addEventListener("change", updateTotal);
    updateTotal();
  }
 
  // ==========================================================================
  // 5. INVIO MODULO CONTATTI (Web3Forms, senza uscire dalla pagina)
  // ==========================================================================
  const contactForm = document.getElementById("contactForm");
  const formFeedback = document.getElementById("formFeedback");
 
  if (contactForm && formFeedback) {
    const PHONE_LABEL = "06 9281174";
    const PHONE_LINK = "tel:+39069281174";
    const SEND_TIMEOUT_MS = 15000;
 
    const submitBtn = contactForm.querySelector(".btn-submit");
    const submitLabel = submitBtn.querySelector(".btn-label");
    const defaultLabel = submitLabel.textContent;
 
    // type: "info" | "success" | "error"
    function showFeedback(type, message, { detail = "", callUs = false } = {}) {
      formFeedback.className = "result-box " + type;
      formFeedback.textContent = message;          // textContent: nessun codice HTML inserito dal visitatore
 
      if (callUs) {
        formFeedback.append(" Per urgenze chiama il ");
        const link = document.createElement("a");
        link.href = PHONE_LINK;
        link.textContent = PHONE_LABEL;
        formFeedback.append(link, ".");
      }
 
      if (detail) {
        const small = document.createElement("small");
        small.textContent = detail;
        formFeedback.append(small);
      }
    }
 
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (submitBtn.disabled) return;                    // evita invii doppi
 
      const formData = new FormData(contactForm);
      if (formData.get("botcheck")) return;              // solo i bot spuntano il campo trappola
 
      const payload = Object.fromEntries(formData);
      delete payload.redirect;                           // serve solo all'invio senza JavaScript
 
      submitBtn.disabled = true;
      submitLabel.textContent = "INVIO IN CORSO...";
      showFeedback("info", "Invio della richiesta in corso...");
 
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
 
      try {
        const response = await fetch(contactForm.action, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
 
        let result = null;
        try {
          result = await response.json();
        } catch (_) {
          // risposta non in formato JSON
        }
 
        if (response.ok && result && result.success) {
          const name = String(payload.name || "").trim();
          showFeedback(
            "success",
            `✓ GRAZIE ${name.toUpperCase()}! Richiesta inviata con successo.`,
            { detail: "Ti ricontatteremo al numero che hai indicato." }
          );
          contactForm.reset();
        } else {
          const reason = (result && result.message) || "risposta non valida dal server";
          console.error("Web3Forms ha rifiutato l'invio:", response.status, result);
          showFeedback("error", "Invio non riuscito: riprova tra poco.", {
            callUs: true,
            detail: `Dettaglio: ${reason} (codice ${response.status})`
          });
        }
      } catch (err) {
        console.error("Invio non riuscito:", err);
        const timedOut = err && err.name === "AbortError";
        showFeedback(
          "error",
          timedOut
            ? "Il server non ha risposto in tempo: riprova."
            : "Impossibile contattare il servizio di invio: controlla la connessione e riprova.",
          {
            callUs: true,
            detail: timedOut ? "" : "Se usi un blocco annunci, disattivalo per questo sito."
          }
        );
      } finally {
        clearTimeout(timer);
        submitBtn.disabled = false;
        submitLabel.textContent = defaultLabel;
        formFeedback.scrollIntoView({
          block: "nearest",
          behavior: reduceMotion.matches ? "auto" : "smooth"
        });
      }
    });
  }
});
 