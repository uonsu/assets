const hiddenFade     = document.querySelectorAll(".animateFadeInHidden");
const loader         = document.getElementById("loader-overlay");
const hero         = document.getElementById("hero");
const form           = document.getElementById("appeal");
const successDiv     = document.getElementById("request-success");
const dropzone       = document.getElementById("file-dropzone");
const dropzoneText   = document.getElementById("dropzone-text");
const fileInput      = document.getElementById("file-input");
const fileList       = document.getElementById("file-list");
const removeAllBtn   = document.getElementById("remove-all");
const siteKey        = "6LdsiPUrAAAAAFdbTE5WSkby8cUsua7zXDxhlBpm";
const maxFiles    = 5;
const maxSize     = 10 * 1024 * 1024; // 10 MB
const GUID_REGEX  = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const EMAIL_REGEX = /^[^@]+@nottingham\.ac\.uk$/i;
const MAX_WORDS   = 1000;

const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg","image/png","image/gif",
    "audio/mpeg","audio/mp3","audio/wav",
    "video/mp4","video/quicktime","video/webm","video/mpeg","video/x-msvideo"
];

let selectedFiles = [];

const showLoader = () => loader.classList.add("show");
const hideLoader = () => loader.classList.remove("show");

// Intersection observer (animations)

const observerFade = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("animateFadeInAppear");
    });
});
hiddenFade.forEach(el => observerFade.observe(el));

// File management (identical logic to main.js)

const isValidFile = file => allowedTypes.includes(file.type) && file.size <= maxSize;

const getFileIcon = file => {
    const t = file.type;
    if (t.startsWith("image/")) return "📷";
    if (t.startsWith("video/")) return "🎞️";
    if (t.startsWith("audio/")) return "🎧";
    if (t.includes("pdf"))   return "📕";
    if (t.includes("word"))  return "📘";
    if (t.includes("excel") || t.includes("spreadsheet")) return "📗";
    if (t.includes("presentation")) return "📙";
    return "📄";
};

const updateFileList = () => {
    fileList.innerHTML = "";
    selectedFiles.forEach((file, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${getFileIcon(file)} ${file.name}</span>
            <button type="button" class="remove-btn" data-index="${index}">×</button>
        `;
        fileList.appendChild(li);
    });
    removeAllBtn.style.display = selectedFiles.length ? "inline-block" : "none";
};

const handleFiles = files => {
    for (const file of files) {
        if (selectedFiles.length >= maxFiles) {
            CoolAlert.show({ icon: "error", title: "Error", text: "You can attach a maximum of 5 files.", position: "top-right", showCancelButton: false, timeout: 4000 });
            break;
        }
        if (!isValidFile(file)) {
            CoolAlert.show({ icon: "error", title: "Error", text: `"${file.name}" is not an accepted file type or exceeds 10 MB.`, position: "top-right", showCancelButton: false, timeout: 4000 });
            continue;
        }
        const isDuplicate = selectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (isDuplicate) {
            CoolAlert.show({ icon: "error", title: "Error", text: `"${file.name}" has already been added.`, position: "top-right", showCancelButton: false });
            continue;
        }
        selectedFiles.push(file);
    }
    updateFileList();
};

const countWords = text => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
};

const attachWordCounter = (textareaId, counterId) => {
    const ta  = document.getElementById(textareaId);
    const ctr = document.getElementById(counterId);
    if (!ta || !ctr) return;
    ta.addEventListener("input", () => {
        const count = countWords(ta.value);
        ctr.textContent = `${count} / ${MAX_WORDS} words`;
        ctr.style.color = count > MAX_WORDS ? "#e34928" : "#999";
    });
};

const toggleGround = (checkId, textareaContainerId, textareaId) => {
    const check     = document.getElementById(checkId);
    const container = document.getElementById(textareaContainerId);
    const ta        = document.getElementById(textareaId);
    if (!check || !container) return;
    check.addEventListener("change", () => {
        if (check.checked) {
            container.style.display = "block";
        } else {
            container.style.display = "none";
            if (ta) ta.value = "";
        }
    });
};

const showError = (element, message) => {
    if (!element) return;
    CoolAlert.show({ title: "Form validation", text: message, type: "error", timeout: 5000, showCancelButton: false });
    element.classList.add("input-error");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus?.();
};

// Submit handler
const handleSubmit = form => {
    showLoader();
    document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));

    const appellantName  = document.getElementById("appellantName");
    const appellantEmail = document.getElementById("appellantEmail");
    const complaintId    = document.getElementById("complaintId");
    const adjustments    = document.getElementById("areThereAnyReasonableAdjustments");

    const ground1 = document.getElementById("ground1Check");
    const ground2 = document.getElementById("ground2Check");
    const ground3 = document.getElementById("ground3Check");

    const response1 = document.getElementById("groundResponseUnreasonableOutcome");
    const response2 = document.getElementById("groundResponseNonCorrectProcedure");
    const response3 = document.getElementById("groundResponseExceptionalCircumstance");

    // Appellant name
    if (!appellantName.value.trim()) {
        showError(appellantName, "Your full name is required.");
        hideLoader(); return;
    }

    // Email
    if (!appellantEmail.value.trim()) {
        showError(appellantEmail, "Your university email address is required.");
        hideLoader(); return;
    }
    if (!EMAIL_REGEX.test(appellantEmail.value.trim())) {
        showError(appellantEmail, "Please enter a valid University of Nottingham email address (@nottingham.ac.uk).");
        hideLoader(); return;
    }

    // Complaint reference
    if (!complaintId.value.trim()) {
        showError(complaintId, "The original complaint reference is required.");
        hideLoader(); return;
    }
    if (!GUID_REGEX.test(complaintId.value.trim())) {
        showError(complaintId, "Please enter a valid complaint reference ID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).");
        hideLoader(); return;
    }

    // At least one ground
    const anyGroundSelected = ground1.checked || ground2.checked || ground3.checked;
    if (!anyGroundSelected) {
        CoolAlert.show({ title: "Form validation", text: "Please select at least one ground for appeal and provide a written response.", type: "error", timeout: 5000, showCancelButton: false });
        document.getElementById("ground1Check").scrollIntoView({ behavior: "smooth", block: "center" });
        hideLoader(); return;
    }

    // Validate each selected ground has a response and is within word limit
    if (ground1.checked) {
        if (!response1.value.trim()) { showError(response1, "Please provide a response for Ground 1."); hideLoader(); return; }
        if (countWords(response1.value) > MAX_WORDS) { showError(response1, `Ground 1 response exceeds the ${MAX_WORDS}-word limit.`); hideLoader(); return; }
    }
    if (ground2.checked) {
        if (!response2.value.trim()) { showError(response2, "Please provide a response for Ground 2."); hideLoader(); return; }
        if (countWords(response2.value) > MAX_WORDS) { showError(response2, `Ground 2 response exceeds the ${MAX_WORDS}-word limit.`); hideLoader(); return; }
    }
    if (ground3.checked) {
        if (!response3.value.trim()) { showError(response3, "Please provide a response for Ground 3."); hideLoader(); return; }
        if (countWords(response3.value) > MAX_WORDS) { showError(response3, `Ground 3 response exceeds the ${MAX_WORDS}-word limit.`); hideLoader(); return; }
    }

    // Reasonable adjustments
    if (!adjustments.value.trim()) {
        showError(adjustments, "Please answer the reasonable adjustments question.");
        hideLoader(); return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("appellantName",  appellantName.value.trim());
    formData.append("appellantEmail", appellantEmail.value.trim().toLowerCase());
    formData.append("complaintId",    complaintId.value.trim());
    formData.append("areThereAnyReasonableAdjustments", adjustments.value.trim());

    // Only include ground responses for checked grounds
    if (ground1.checked && response1.value.trim()) formData.append("groundResponseUnreasonableOutcome",    response1.value.trim());
    if (ground2.checked && response2.value.trim()) formData.append("groundResponseNonCorrectProcedure",    response2.value.trim());
    if (ground3.checked && response3.value.trim()) formData.append("groundResponseExceptionalCircumstance", response3.value.trim());

    // Attachments (optional)
    formData.delete("attachments");
    selectedFiles.forEach(file => formData.append("attachments", file));

    // Execute reCAPTCHA then submit
    grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action: "submit_appeal" })
            .then(token => {
                formData.append("recaptchaToken", token);

                fetch("https://api.uonsu-dms.com/v1/appeals/save", {
                    method: "POST",
                    body: formData
                })
                .then(async res => {
                    if (!res.ok) {
                        const errorText = await res.text();
                        hideLoader();
                        let parsed;
                        try { parsed = JSON.parse(errorText); }
                        catch { parsed = { message: "Something went wrong" }; }
                        const errorMessages = [];
                        if (parsed.errors && typeof parsed.errors === "object") {
                            for (const [, message] of Object.entries(parsed.errors)) {
                                errorMessages.push(message);
                            }
                        }
                        CoolAlert.show({
                            toast: false, icon: "error", title: "Validation Error",
                            text: errorMessages.length ? errorMessages.join("\n") : (parsed.message || "An unexpected error occurred."),
                            position: "center", showCancelButton: false
                        });
                        throw { handled: true };
                    }
                    return res.json();
                })
                .then(() => {
                    hideLoader();
                    setTimeout(() => resetAppealForm(), 500);
                })
                .catch(err => {
                    hideLoader();
                    if (err?.handled) return;
                    CoolAlert.show({ toast: true, icon: "error", title: "Error", text: "Something went wrong while submitting your appeal.", position: "top-right", timeout: 4000, showCancelButton: false });
                });
            });
    });
};

// Reset
const resetAppealForm = () => {
    form.reset();
    selectedFiles = [];
    updateFileList();
    // Hide all ground text areas
    ["ground1Textarea","ground2Textarea","ground3Textarea"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    // Reset word counters
    ["ground1WordCount","ground2WordCount","ground3WordCount"].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = "0 / 1000 words"; el.style.color = "#999"; }
    });
    form.style.display = "none";
    hero.style.display = "none";
    successDiv.style.display = "flex";
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
};

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {

    // Update logo if needed (same as complaints form)
    const logoImg = document.querySelector(".navbar-brand img");
    if (logoImg) logoImg.src = "https://assets-cdn.sums.su/NT/Web-Design/Freshers/LogoUpdated.png";

    // Load lottie animations
    const loadingEl = document.getElementById("loader-lottie");
    const loadingElSuccess = document.getElementById("loader-lottie-success");
    if (loadingEl) {
        loadingEl.load("https://cdn.jsdelivr.net/gh/uonsu/assets@main/lotties/loader.json");
    }
    if (loadingElSuccess) {
        loadingElSuccess.load("https://cdn.jsdelivr.net/gh/uonsu/assets@main/lotties/success.json");
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);

    // Ground checkbox toggles
    toggleGround("ground1Check", "ground1Textarea", "groundResponseUnreasonableOutcome");
    toggleGround("ground2Check", "ground2Textarea", "groundResponseNonCorrectProcedure");
    toggleGround("ground3Check", "ground3Textarea", "groundResponseExceptionalCircumstance");

    // Word counters
    attachWordCounter("groundResponseUnreasonableOutcome",    "ground1WordCount");
    attachWordCounter("groundResponseNonCorrectProcedure",    "ground2WordCount");
    attachWordCounter("groundResponseExceptionalCircumstance","ground3WordCount");

    // File dropzone
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", e => {
        e.preventDefault();
        dropzone.classList.add("dragover");
        dropzoneText.textContent = "Release to upload";
    });

    dropzone.addEventListener("dragleave", e => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        dropzoneText.textContent = "Drag and drop files here, or click to select";
    });

    dropzone.addEventListener("drop", e => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        dropzoneText.textContent = "Drag and drop files here, or click to select";
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener("change", e => handleFiles(e.target.files));

    fileList.addEventListener("click", e => {
        if (e.target.classList.contains("remove-btn")) {
            selectedFiles.splice(parseInt(e.target.dataset.index), 1);
            updateFileList();
        }
    });

    removeAllBtn.addEventListener("click", () => {
        selectedFiles = [];
        updateFileList();
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        handleSubmit(form);
    });

});
