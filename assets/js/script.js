'use strict';

//----------------------------------------------------------------------
// CONFIGURATION: PASTE YOUR GOOGLE APPS SCRIPT URL HERE
//----------------------------------------------------------------------

// *** PASTE THE /exec URL YOU COPIED FROM GOOGLE APPS SCRIPT IN STEP 5 ***
const APPS_SCRIPT_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"; 
const SECURE_CONTENT_URL = "./paid-content.html";
const LOGIN_PAGE_URL = "./login.html";

//----------------------------------------------------------------------
// 1. SECURE ACCESS GATE LOGIC
//----------------------------------------------------------------------

/**
 * Handles the secure login check by calling the private Google Apps Script API.
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
            errorMessage.textContent = "A server error occurred. Please try again later.";
        })
        .finally(() => {
            // Re-enable the button
            formButton.disabled = false;
            formButton.querySelector('.span').textContent = 'Unlock My Course'; 
        });
}


/**
 * Enforces the access gate on the paid content page.
 * This runs before the page content is shown (due to the defer attribute).
 */
function enforceAccessGate() {
    const currentPath = window.location.pathname;
    const mainContent = document.getElementById('main-course-content');
    const loadingScreen = document.getElementById('loading-screen');

    // Check if we are on the paid content page (SECURE_CONTENT_URL)
    // The currentPath check is made more robust here.
    if (currentPath.includes(SECURE_CONTENT_URL.substring(2))) { 
        if (sessionStorage.getItem('vlsi_access_granted') !== 'true') {
            // SECURITY FAILURE: Redirect to login page
            if (mainContent) mainContent.style.display = 'none'; 
            window.location.replace(LOGIN_PAGE_URL); 
        } else {
            // ACCESS GRANTED: Hide loading screen and SHOW content
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (mainContent) {
                 mainContent.style.display = 'block';
            }
            // Display user's email if the element exists
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                 userDisplay.textContent = sessionStorage.getItem('vlsi_user_email') || '';
            }
        }
    }
}

// Ensure the enforcement check runs right after the script loads
enforceAccessGate();


//----------------------------------------------------------------------
// 2. EXISTING NAVIGATION AND ACCORDION LOGIC
//----------------------------------------------------------------------

// --- Existing Navigation Code ---
const addEventOnElem = function (elem, type, callback) {
    if (elem.length > 1) {
        for (let i = 0; i < elem.length; i++) {
            elem[i].addEventListener(type, callback);
        }
    } else {
        elem.addEventListener(type, callback);
    }
}

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


// --- Accordion Toggle Logic ---
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
                    const activeVideoIframe = activeToggler.querySelector('.lecture-video-content iframe');
                    if (activeVideoIframe) {
                        activeVideoIframe.src = activeVideoIframe.src; 
                    }
                }
            });

            if (!isActive) {
                this.classList.add('active');
            } else {
                const currentVideoIframe = this.querySelector('.lecture-video-content iframe');
                if (currentVideoIframe) {
                    currentVideoIframe.src = currentVideoIframe.src; 
                }
                this.classList.remove('active');
            }
        });
    });
});
