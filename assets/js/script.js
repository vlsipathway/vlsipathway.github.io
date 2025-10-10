'use strict';

//----------------------------------------------------------------------
// CONFIGURATION: GOOGLE APPS SCRIPT URL
//----------------------------------------------------------------------
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyGgGzSFEDYomU-fkl-fCTeLOuVk6RlxqrID0g0EiDB6TuyYlHRV36QUvHlwHpe7FFYFQ/exec";

const SECURE_CONTENT_URL = "./paid-content.html";
const LOGIN_PAGE_URL = "./login.html";

//----------------------------------------------------------------------
// 1. LOGIN HANDLER
//----------------------------------------------------------------------
function checkSecureAccess() {
  const accessEmailInput = document.getElementById('access-email');
  const accessKeyInput = document.getElementById('access-key');
  const errorMessage = document.getElementById('error-message');
  const formButton = document.getElementById('login-button');
  
  const submittedEmail = accessEmailInput.value.trim();
  const submittedKey = accessKeyInput.value.trim();
  errorMessage.textContent = "";

  if (!submittedEmail || !submittedKey) {
    errorMessage.textContent = "Please provide both email and access key.";
    return;
  }

  formButton.disabled = true;
  formButton.querySelector('.span').textContent = 'Authenticating...';

  const url = `${APPS_SCRIPT_URL}?key=${encodeURIComponent(submittedKey)}&email=${encodeURIComponent(submittedEmail)}`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('API request failed with status: ' + response.status);
      return response.json();
    })
    .then(data => {
      if (data.success === true) {
        sessionStorage.setItem('vlsi_access_granted', 'true');
        sessionStorage.setItem('vlsi_user_email', data.email);
        window.location.href = SECURE_CONTENT_URL;
      } else {
        errorMessage.textContent = data.message || "Login failed. Check your key and email.";
      }
    })
    .catch(error => {
      console.error("Fetch Error:", error);
      errorMessage.textContent = "A connection error occurred. Please try again.";
    })
    .finally(() => {
      formButton.disabled = false;
      formButton.querySelector('.span').textContent = 'Unlock My Course';
    });
}

//----------------------------------------------------------------------
// 2. ACCESS ENFORCEMENT
//----------------------------------------------------------------------
function enforceAccessGate() {
  const currentPath = window.location.pathname;
  const mainContent = document.getElementById('main-course-content');
  const loadingScreen = document.getElementById('loading-screen');

  if (currentPath.includes('paid-content.html')) {
    if (sessionStorage.getItem('vlsi_access_granted') !== 'true') {
      if (mainContent) mainContent.style.display = 'none';
      window.location.replace(LOGIN_PAGE_URL);
    } else {
      if (loadingScreen) loadingScreen.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';
      const userDisplay = document.getElementById('user-display');
      if (userDisplay) userDisplay.textContent = sessionStorage.getItem('vlsi_user_email') || '';
    }
  }
}

// Run enforcement immediately
enforceAccessGate();

//----------------------------------------------------------------------
// 3. NAVIGATION + ACCORDION LOGIC
//----------------------------------------------------------------------
const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
};

const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
};

addEventOnElem(navTogglers, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  overlay.classList.remove("active");
};

addEventOnElem(navLinks, "click", closeNavbar);

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const activeElem = function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
};

addEventOnElem(window, "scroll", activeElem);

document.addEventListener('DOMContentLoaded', function() {
  const lectureTogglers = document.querySelectorAll('.lecture-toggler');

  lectureTogglers.forEach(toggler => {
    toggler.addEventListener('click', function(event) {
      if (event.target.closest('.video-container') || event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
        return;
      }

      const isActive = this.classList.contains('active');

      document.querySelectorAll('.lecture-toggler.active').forEach(activeToggler => {
        if (activeToggler !== this) {
          activeToggler.classList.remove('active');
          const iframe = activeToggler.querySelector('.lecture-video-content iframe');
          if (iframe) iframe.src = iframe.src;
        }
      });

      if (!isActive) {
        this.classList.add('active');
      } else {
        const iframe = this.querySelector('.lecture-video-content iframe');
        if (iframe) iframe.src = iframe.src;
        this.classList.remove('active');
      }
    });
  });
});
