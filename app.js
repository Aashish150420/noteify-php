// PROFILE
let profile = {
    name: "Student",
    course: "Computer Science",
    pic: "https://via.placeholder.com/35"
};

// DATA (start clean)
let resources = [
    {
        title: "Operating Systems Notes",
        course: "BCA",
        file: "resources/os_notes.pdf"
    },
    { 
        title: "Data Structures PDF",
        course: "BSC CSIT",
        file: "resources/dsa_notes.pdf"
    }
];
let posts = [
    {
        title: "How to study for OS?",
        content: "Share strategies, notes, and tips for Operating Systems.",
        course: "BCA"
    },
    {
        title: "BCA Exam Tips",
        content: "Important questions, exam patterns, and preparation tips.",
        course: "BSC CSIT"
    }
];

let rooms = [
    {
        name: "DSA Study Room",
        description: "Live discussion and doubt solving for Data Structures.",
        course: "BCA"
    },
    {
        name: "BCA Revision Room",
        description: "Quick revision sessions before exams.",
        course: "BCA"
    }
];

// PAGE SWITCHING
document.querySelectorAll("[data-page]").forEach(btn => {
    btn.onclick = () => showPage(btn.dataset.page);
});

function loadProfileForm() {
    document.getElementById("name").value = profile.name;
    document.getElementById("course").value = profile.course;
}
document.getElementById("profile-nav").onclick = () => {
    showPage("profile");
    loadProfileForm(); // ✅
};



function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(page + "-page").classList.add("active");
}

// =====================
// RENDER FUNCTIONS
// =====================
function renderResources() {
    let div = document.getElementById("resources");
    div.innerHTML = "";

    resources.forEach((r, index) => {
        if (r.course === profile.course) {
            let card = document.createElement("div");
            card.className = "card";
            card.innerText = "📄 " + r.title;

            card.onclick = () => {
                openPDF(r.title, r.file);
            };

            div.appendChild(card);
        }
    });
}


function renderPosts() {
    let div = document.getElementById("posts");
    div.innerHTML = "";

    posts.forEach(p => {
        if (p.course === profile.course) {
            let card = document.createElement("div");
            card.className = "card";
            card.innerText = "💬 " + p.title;

            card.onclick = () => {
                openPopup(p.title, p.content);
            };

            div.appendChild(card);
        }
    });
}

function renderRooms() {
    let div = document.getElementById("rooms");
    div.innerHTML = "";

    rooms.forEach(r => {
        if (r.course === profile.course) {
            let card = document.createElement("div");
            card.className = "card";
            card.innerText = "👥 " + r.name;

            card.onclick = () => {
                openPopup(
                    r.name,
                    `
                    <p>${r.description}</p>
                    <button onclick="alert('Joined room successfully!')">
                        Join Room
                    </button>
                    `
                );
            };

            div.appendChild(card);
        }
    });
}



// =====================
// POPUPS
// =====================
function openPopup(title, content) {
    document.getElementById("popup-title").innerText = title;
    document.getElementById("popup-content").innerHTML = content; // ✅
    document.getElementById("popup").style.display = "block";
}


function openPDF(title, fileURL) {
    if (!fileURL) {
        alert("No PDF available for this resource.");
        return;
    }

    document.getElementById("popup-title").innerText = title;

    document.getElementById("popup-content").innerHTML = `
        <iframe src="${fileURL}" style="width:100%; height:400px; border:none;"></iframe>
    `;

    document.getElementById("open-new-tab").onclick = () => {
        window.open(fileURL, "_blank");
    };

    document.getElementById("popup").style.display = "block";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// =====================
// MODALS
// =====================
function showModal(id) {
    document.getElementById(id).style.display = "block";
}

function closeModals() {
    document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
}

document.getElementById("open-upload").onclick = () => showModal("upload-modal");
document.getElementById("open-post").onclick = () => showModal("post-modal");
document.getElementById("open-room").onclick = () => showModal("room-modal");

// =====================
// SAVE ACTIONS
// =====================
document.getElementById("save-resource").onclick = () => {
    let title = document.getElementById("res-title").value;
    let fileInput = document.getElementById("res-file");
    let file = fileInput.files[0];

    if (!title || !file) {
        alert("Please enter a title and select a PDF");
        return;
    }

    let pdfURL = URL.createObjectURL(file);

    resources.push({
        title: title,
        course: profile.course,
        file: pdfURL
    });

    document.getElementById("res-title").value = "";
    document.getElementById("res-file").value = "";

    renderResources();
    closeModals();
};

document.getElementById("save-post").onclick = () => {
    let title = document.getElementById("post-title").value;
    let content = document.getElementById("post-content").value;

    if (!title || !content) return alert("Fill all fields");

    posts.push({
        title,
        content,
        course: profile.course
    });

    document.getElementById("post-title").value = "";
    document.getElementById("post-content").value = "";

    renderPosts();
    closeModals();
};


document.getElementById("save-room").onclick = () => {
    let name = document.getElementById("room-name").value;
    let desc = document.getElementById("room-desc").value;

    if (!name || !desc) return alert("Fill all fields");

    rooms.push({
        name: name,
        description: desc,
        course: profile.course
    });

    document.getElementById("room-name").value = "";
    document.getElementById("room-desc").value = "";

    renderRooms();
    closeModals();
};


// =====================
// PROFILE
// =====================
document.getElementById("save-profile").onclick = () => {
    profile.name = document.getElementById("name").value || profile.name;
    profile.course = document.getElementById("course").value;

    document.getElementById("profile-name").innerText = profile.name;

    renderResources();
    renderPosts();
    renderRooms();

    alert("Profile saved! Content filtered by course.");
};

document.getElementById("profile-upload").onchange = e => {
    let reader = new FileReader();
    reader.onload = () => document.getElementById("profile-pic").src = reader.result;
    reader.readAsDataURL(e.target.files[0]);
};

// INITIAL LOAD
window.onload = () => {
    renderResources();
    renderPosts();
    renderRooms();
};
