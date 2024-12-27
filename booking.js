
const userData = localStorage.getItem("user");
if (!userData) {
    setTimeout(() => {
        document.getElementById("background-light").style.display = "flex";
    }, 5000);
}
document.getElementById("doneButton").addEventListener("click", () => {
    window.location.href = "/login";
});
        user = JSON.parse(userData); 
const form = document.querySelector('.booking-form');
document.querySelector(".dropdown-toggle").innerHTML=user.name;
 form.addEventListener('submit', function(event) {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    const checkInDate = document.getElementById('check-in').value;
    const checkOutDate = document.getElementById('check-out').value;
    const roomType = document.getElementById('room-type').value;
    const numberOfGuests = document.getElementById('guests').value;
    if(checkOutDate>checkInDate){
        const bookingData = {
            userId: user.id, 
            roomType,
            checkInDate,
            checkOutDate,
            numberOfGuests
        };
        fetch("/roomBooking", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bookingData)
        })
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
           console.log(data);
            if (data.message) {
                window.location.href = "/payment";
                alert(data.message); 
            
            }
        })
        .catch(error => {
            // Handle any errors that occur during the request
            console.error('Error:', error);
            alert("An error occurred while booking the room. Please try again.");
        });
    }else{
        alert("Check-out date must be later than check-in date.");
    }
});
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');
const dropdownToggle = document.getElementById('dropdownToggle');
const dropdownMenu = document.getElementById('dropdownMenu');

function toggleNav() {
    navLinks.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeNav() {
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
}

function toggleDropdown() {
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
}

navToggle.addEventListener('click', toggleNav);
overlay.addEventListener('click', closeNav);
closeBtn.addEventListener('click', closeNav);

dropdownToggle.addEventListener('click', toggleDropdown);

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-section')) {
        dropdownMenu.style.display = 'none';
    }
});
function local(){
    localStorage.removeItem('user');
}
let greetingTimeout;

function showGreeting(username) {
            if (!username) return;
            
            const greetingBox = document.getElementById('aiGreeting');
            const greetingText = document.getElementById('greetingText');
            
            // Show the notification with loading state
            greetingBox.classList.remove('hide');
            greetingBox.classList.add('show');
            
            // Fetch greeting from backend
            fetch(`/ai/greeting/${encodeURIComponent(username)}`)
                .then(response => {
                
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                   
                    typeGreeting(data.greeting);
                    
                    // Set timeout for auto-hide
                  
                })
                .catch(error => {
                    console.error('Error fetching greeting:', error);
                    greetingText.innerHTML = `Welcome back, ${username}! We're glad to see you.`;
                });
        }

        function typeGreeting(greeting) {
            const greetingText = document.getElementById('greetingText');
            let index = 0;
            greetingText.innerHTML = ''; // Clear the previous greeting
        
            // Type each letter one by one with a delay
            function typingEffect() {
                if (index < greeting.length) {
                    greetingText.innerHTML += greeting.charAt(index);
                    index++;
                    setTimeout(typingEffect, 40); // Adjust speed of typing by changing this timeout
                } else {
                    // Once typing is finished, hide the greeting after an additional delay
                    setTimeout(() => {
                        hideGreeting();
                    }, 2000);
                }
            }
        
            typingEffect(); // Start the typing effect
        }
function hideGreeting() {
            const greetingBox = document.getElementById('aiGreeting');
            clearTimeout(greetingTimeout);
            
            greetingBox.classList.add('hide');
            setTimeout(() => {
                greetingBox.classList.remove('show', 'hide');
            }, 500);
        }
        showGreeting(user.name);