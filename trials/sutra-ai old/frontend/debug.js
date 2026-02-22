// Quick debug script for testing frontend components
// Run in browser console when app is loaded

console.log("=== Sutra AI Debug Script ===");

// Test Firebase auth
function testAuth() {
    console.log("Current user:", window.firebase?.auth?.currentUser);
    console.log("Auth state:", window.firebase?.auth?.currentUser ? "Logged in" : "Not logged in");
}

// Test API connections
async function testAPI() {
    try {
        const response = await fetch('http://localhost:5000/api/test');
        console.log("Node.js API:", response.status === 200 ? "Working" : "Failed");
    } catch (e) {
        console.log("Node.js API: Connection failed", e.message);
    }
    
    try {
        const response = await fetch('http://localhost:8000/docs');
        console.log("Python API:", response.status === 200 ? "Working" : "Failed");
    } catch (e) {
        console.log("Python API: Connection failed", e.message);
    }
}

// Check local storage
function checkStorage() {
    console.log("Local storage keys:", Object.keys(localStorage));
    console.log("Session storage keys:", Object.keys(sessionStorage));
}

// Test socket connection
function testSocket() {
    if (window.io) {
        const socket = window.io('http://localhost:5000');
        socket.on('connect', () => console.log('Socket connected'));
        socket.on('disconnect', () => console.log('Socket disconnected'));
    } else {
        console.log("Socket.io not loaded");
    }
}

// Run all tests
function runAllTests() {
    console.log("Running debug tests...");
    testAuth();
    testAPI();
    checkStorage();
    testSocket();
}

// Make functions available globally
window.debugSutra = {
    testAuth,
    testAPI,
    checkStorage,
    testSocket,
    runAllTests
};

console.log("Debug functions available: window.debugSutra");
console.log("Run window.debugSutra.runAllTests() to test everything");