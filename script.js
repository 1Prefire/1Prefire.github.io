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
  let targetScrollY = window.pageYOffset;
  let currentScrollY = window.pageYOffset;
  let isScrollingActive = false;   // inerzia rotellina in corso
  let isAnchorScrolling = false;   // animazione click sui link in corso
  let anchorRaf = null;
 
  function getMaxScroll() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }
 
  // --- Rotellina con inerzia morbida ---
  window.addEventListener("wheel", (e) => {
    if (e.target.closest('textarea') || e.target.closest('select')) return;
 
    e.preventDefault();
 
    // Se stava andando l'animazione dei link, la interrompiamo
    if (isAnchorScrolling) {
      cancelAnimationFrame(anchorRaf);
      isAnchorScrolling = false;
      targetScrollY = window.pageYOffset;
    }
 
    targetScrollY += e.deltaY * 0.7; // più basso = scroll più corto e lento
    targetScrollY = Math.max(0, Math.min(targetScrollY, getMaxScroll()));
 
    if (!isScrollingActive) {
      isScrollingActive = true;
      requestAnimationFrame(stepScroll);
    }
  }, { passive: false });
 
  function stepScroll() {
    // Se è partita l'animazione dei link, la rotellina si ferma
    if (isAnchorScrolling) {
      isScrollingActive = false;
      return;
    }
 
    currentScrollY = window.pageYOffset;
    const distance = targetScrollY - currentScrollY;
 
    currentScrollY += distance * 0.06; // più basso = scivolamento più lungo e morbido
    window.scrollTo(0, currentScrollY);
 
    if (Math.abs(distance) > 0.5) {
      requestAnimationFrame(stepScroll);
    } else {
      isScrollingActive = false;
    }
  }
 
  // Sincronizza con la barra di scorrimento laterale / tastiera
  window.addEventListener("scroll", () => {
    if (!isScrollingActive && !isAnchorScrolling) {
      targetScrollY = window.pageYOffset;
    }
  });
 
  // --- Animazione lenta per i click sui link ---
  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
 
  function smoothScrollTo(target) {
    cancelAnimationFrame(anchorRaf);
    isScrollingActive = false;
 
    const start = window.pageYOffset;
    target = Math.max(0, Math.min(target, getMaxScroll()));
    const distance = target - start;
 
    if (Math.abs(distance) < 1) return;
 
    // Durata in millisecondi: più è lontana la sezione, più dura.
    // Per rendere lo scroll PIÙ LENTO aumenta questi numeri.
    const duration = Math.min(2200, Math.max(1000, Math.abs(distance) * 1.5));
 
    let startTime = null;
    isAnchorScrolling = true;
 
    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const position = start + distance * easeInOutCubic(progress);
 
      window.scrollTo(0, position);
 
      if (progress < 1) {
        anchorRaf = requestAnimationFrame(step);
      } else {
        isAnchorScrolling = false;
        targetScrollY = window.pageYOffset;
      }
    }
 
    anchorRaf = requestAnimationFrame(step);
  }
 
  // Click sui link (Home, Servizi, Preventivo, Contatti, bottoni hero)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
 
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const targetPosition = elementPosition + window.pageYOffset - headerOffset;
 
        smoothScrollTo(targetPosition);
      }
    });
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
    calcTotal.textContent = `€${basePrice}`;
  }
 
  if (calcService) calcService.addEventListener("change", updateTotal);
  if (urgentCheck) urgentCheck.addEventListener("change", updateTotal);
 
  // ==========================================================================
  // 5. INVIO FORM DI CONTATTO
  // ==========================================================================
  const contactForm = document.getElementById("contactForm");
  const formFeedback = document.getElementById("formFeedback");
 
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
 
      formFeedback.className = "result-box success";
      formFeedback.innerHTML = `✓ GRAZIE ${name.toUpperCase()}! Richiesta inviata con successo.`;
      formFeedback.classList.remove("hidden");
 
      contactForm.reset();
 
      setTimeout(() => {
        formFeedback.classList.add("hidden");
      }, 5000);
    });
  }
});