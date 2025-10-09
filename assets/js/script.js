'use strict';

//======================================================================
// 0. SECURITY CONFIGURATION (CRUCIAL)
//======================================================================

// *** PASTE THE LIVE GOOGLE APPS SCRIPT URL HERE (The /exec link) ***
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQe8OHlaHetbZryPD6Fe57EkPEgfrmwIwY9bFuy1Ev42EogvT_-7A5AQltKkF_TrUN2w/exec"; 
const SECURE_CONTENT_URL = "./paid-content.html";
const LOGIN_PAGE_URL = "./login.html";

//======================================================================
// 1. UTILITY FUNCTIONS (Existing)
//======================================================================

/**
 * add event on element
 */
const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}

//======================================================================
// 2. WEBSITE NAVIGATION & HEADER BEHAVIOR (Existing)
//======================================================================

/**
 * navbar toggle
 */
const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const navLinks = document.querySelectorAll("[data-nav-link]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
}

addEventOnElem(navTogglers, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  overlay.classList.remove("active");
}

addEventOnElem(navLinks, "click", closeNavbar);


/**
 * header active when scroll down to 100px
 */
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
}

addEventOnElem(window, "scroll", activeElem);


//======================================================================
// 3. SECURE ACCESS GATE LOGIC
//======================================================================

/**
 * Handles the secure login check by calling the private Google Apps Script API.
 * This runs when the user submits the form on courses/login.html.
 */
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

    // --- Build the GET request URL with parameters ---
    const url = `${APPS_SCRIPT_URL}?key=${encodeURIComponent(submittedKey)}&email=${encodeURIComponent(submittedEmail)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success === true) {
                // ACCESS GRANTED: Set session flag and redirect to the secure page
                sessionStorage.setItem('vlsi_access_granted', 'true');
                sessionStorage.setItem('vlsi_user_email', data.email);
                window.location.href = SECURE_CONTENT_URL;
            } else {
                // ACCESS DENIED: Display the error message returned from the server (Code.gs)
                errorMessage.textContent = data.message || "Login failed. Check your key and email.";
            }
        })
        .catch(error => {
            console.error("API Call Failed:", error);
            errorMessage.textContent = "A server error occurred. Please try again later. Check console for API status.";
        })
        .finally(() => {
            // Re-enable the button
            formButton.disabled = false;
            formButton.querySelector('.span').textContent = 'Unlock My Course'; 
        });
}


/**
 * Enforces the access gate on the paid content page.
 * If the user visits paid-content.html without the session flag, they are redirected.
 */
function enforceAccessGate() {
    const currentPath = window.location.pathname;

    // Check if we are on the paid content page (SECURE_CONTENT_URL)
    // NOTE: path checking is generalized for GitHub Pages sub-directory hosting
    if (currentPath.includes(SECURE_CONTENT_URL.substring(2))) { 
        if (sessionStorage.getItem('vlsi_access_granted') !== 'true') {
            // Redirect to login page if flag is missing
            window.location.replace(LOGIN_PAGE_URL); 
        }
    }
}

// Attach the enforcement check to run when the page loads
document.addEventListener('DOMContentLoaded', enforceAccessGate);


//======================================================================
// 4. ACCORDION (Content Toggle) LOGIC
//======================================================================

const lectureTogglers = document.querySelectorAll('.lecture-toggler');

lectureTogglers.forEach(toggler => {
    toggler.addEventListener('click', function(event) {
        
        // Don't toggle if user clicks inside an iframe or button
        if (event.target.closest('.video-container') || event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
            return;
        }

        const isActive = this.classList.contains('active');

        // Close all other active togglers and stop video playback
        document.querySelectorAll('.lecture-toggler.active').forEach(activeToggler => {
            if (activeToggler !== this) {
                activeToggler.classList.remove('active');
                const activeVideoIframe = activeToggler.querySelector('.lecture-video-content iframe');
                if (activeVideoIframe) {
                    activeVideoIframe.src = activeVideoIframe.src; 
                }
            }
        });

        // Toggle the current item open/closed
        if (!isActive) {
            this.classList.add('active');
        } else {
            // If it was already active, close it and stop the video
            const currentVideoIframe = this.querySelector('.lecture-video-content iframe');
            if (currentVideoIframe) {
                currentVideoIframe.src = currentVideoIframe.src; 
            }
            this.classList.remove('active');
        }
    });
});
