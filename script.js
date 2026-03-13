// 0. Force scroll to top on refresh
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Configuration
const SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbxME1JvpPCHhAwwyzXu6JS5ASceh_PbnL5-JIOaKDwnhAhEQnEJe9S6xuI0EtJOwXrIRg/exec';

// Elements
const cover = document.getElementById('cover');
const mainInvitation = document.getElementById('main-invitation');
const openBtn = document.getElementById('open-invitation');
const musicBtn = document.getElementById('music-control');
const scrollBtn = document.getElementById('scroll-control');
const bgMusic = document.getElementById('bg-music');
const guestNameEl = document.getElementById('guest-name');
const rsvpForm = document.getElementById('rsvp-form');
const commentForm = document.getElementById('comment-form'); // New
const commentList = document.getElementById('comment-list'); // New
const formMessage = document.getElementById('form-message');
const submitBtn = document.getElementById('submit-btn');
const submitCommentBtn = document.getElementById('submit-comment-btn'); // New

// Multiple Countdown Logic
function updateCountdowns() {
    const now = new Date().getTime();
    const counters = document.querySelectorAll('.mini-countdown');

    counters.forEach(counter => {
        const targetStr = counter.getAttribute('data-date');
        const target = new Date(targetStr).getTime();
        const distance = target - now;

        if (distance < 0) {
            counter.innerHTML = "<span style='font-size: 0.8rem; font-weight: 600; color: var(--gold);'>ACARA SEDANG BERLANGSUNG</span>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        counter.querySelector('.days').innerText = days.toString().padStart(2, '0');
        counter.querySelector('.hours').innerText = hours.toString().padStart(2, '0');
        counter.querySelector('.mins').innerText = minutes.toString().padStart(2, '0');
        counter.querySelector('.secs').innerText = seconds.toString().padStart(2, '0');
    });
}

setInterval(updateCountdowns, 1000);
updateCountdowns();

// 1. Get Guest Name from URL
const urlParams = new URLSearchParams(window.location.search);
const to = urlParams.get('to');
if (to) {
    guestNameEl.textContent = to;
    document.getElementById('name').value = to; // Pre-fill name in RSVP
}

// Auto Scroll State
let isAutoScrolling = false;
let scrollRequest;

// 2. Continuous Auto Scroll Functions
function startAutoScroll() {
    if (isAutoScrolling) return;
    isAutoScrolling = true;
    scrollBtn.innerHTML = '<i class="fas fa-pause"></i>';
    scrollBtn.classList.add('pulse');

    function scrollStep() {
        if (!isAutoScrolling) return;
        window.scrollBy(0, 1.2); // Kecepatan scroll ditingkatkan agar tidak dibulatkan ke 0
        if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 2) {
            stopAutoScroll();
            return;
        }
        scrollRequest = requestAnimationFrame(scrollStep);
    }
    scrollRequest = requestAnimationFrame(scrollStep);
}

function stopAutoScroll() {
    isAutoScrolling = false;
    cancelAnimationFrame(scrollRequest);
    scrollBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
    scrollBtn.classList.remove('pulse');
}

// 2. Open Invitation
openBtn.addEventListener('click', () => {
    // Reset to absolute top
    window.scrollTo(0, 0);

    // Start Cover slide up
    cover.classList.add('open');

    // Preparation for content (keeping it hidden during fade-in prep)
    mainInvitation.classList.remove('hidden');

    // Play music
    bgMusic.currentTime = 20; // Skip long intro, adjust this value if needed
    bgMusic.play().catch(error => console.log("Music blocked"));
    musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
    musicBtn.dataset.playing = "true";

    // Synchronized sequence
    setTimeout(() => {
        // Step 1: Smoothly reveal main content (already has CSS transition for opacity)
        mainInvitation.classList.add('show-content');

        // Step 2: Start auto-scrolling slightly after fade begins
        setTimeout(() => {
            startAutoScroll();

            // Step 3: Remove cover from layout after animation completes
            setTimeout(() => {
                cover.style.display = 'none';
            }, 1200);
        }, 500);

        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }

        // Start guestbook sync
        loadComments();
        setInterval(loadComments, 30000); // Sync every 30 seconds


    }, 100);
});


// 3. Universal Animation Engine (Text, Boxes, & Photos)
const animatableElements = document.querySelectorAll('[data-animate], h1, h2, h3, p:not(.lab):not(.num), .couple-img-container, .event-card, .gallery-item');

let lastStyleIndex = 0;
const textStyles = ['blur', 'pop', 'slide', 'zoom', 'reveal'];

animatableElements.forEach((el, index) => {
    if (el.closest('.cover')) return;

    const specificAnim = el.getAttribute('data-animate');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (specificAnim) {
                    el.classList.add('animate__animated', specificAnim);
                } else if (el.tagName.match(/H1|H2|H3|P/)) {
                    // Benar-benar RANDOM agar tidak monoton
                    const chosenStyle = textStyles[Math.floor(Math.random() * textStyles.length)];
                    const isParagraph = el.tagName === 'P';
                    animateTextPerChar(el, isParagraph ? 'typing' : chosenStyle);
                } else {
                    el.classList.add('animate__animated', 'animate__fadeInUp');
                }
                observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.2,
        rootMargin: '0px 0px -15% 0px' // Trigered when 15% from bottom to center
    });

    observer.observe(el);
});

// Helper: Animate text with mode selection
function animateTextPerChar(el, mode = 'reveal') {
    if (el.querySelector('.char')) return;
    const originalText = el.textContent.trim();
    if (!originalText) return;

    el.textContent = '';
    el.classList.add('text-reveal');

    // Terapkan kelas gaya CSS berdasarkan mode yang dipilih
    if (mode === 'typing') el.classList.add('typing-effect');
    else if (mode === 'blur') el.classList.add('text-blur');
    else if (mode === 'pop') el.classList.add('text-pop');
    else if (mode === 'slide') el.classList.add('text-slide');
    else if (mode === 'zoom') el.classList.add('text-zoom');

    el.classList.add('animate-start');

    const stagger = el.tagName === 'P' ? 0.02 : 0.05;
    let charIndex = 0;
    const words = originalText.split(/(\s+)/);

    words.forEach(word => {
        if (word.trim().length === 0) {
            const space = document.createElement('span');
            space.textContent = '\u00A0';
            el.appendChild(space);
        } else {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            [...word].forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                span.classList.add('char');
                span.style.setProperty('--char-index', charIndex);
                span.style.animationDelay = `${charIndex * stagger}s`;
                wordSpan.appendChild(span);
                charIndex++;
            });
            el.appendChild(wordSpan);
        }
    });
}

// 4. Scroll Control logic...
if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
        if (isAutoScrolling) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }
    });
}

// 5. Music Control
if (musicBtn) {
    musicBtn.addEventListener('click', () => {
        if (musicBtn.dataset.playing === "true") {
            bgMusic.pause();
            musicBtn.innerHTML = '<i class="fas fa-play"></i>';
            musicBtn.dataset.playing = "false";
            musicBtn.classList.remove('pulse');
        } else {
            bgMusic.play();
            musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
            musicBtn.dataset.playing = "true";
            musicBtn.classList.add('pulse');
        }
    });
}

// 6. Guestbook / Comments Logic
async function loadComments() {
    try {
        const response = await fetch(SPREADSHEET_URL + '?action=getComments');
        const allData = await response.json();

        // 1. Filter out invalid/empty rows from Spreadsheet
        const validData = (allData || []).filter(item => 
            item.nama && String(item.nama).trim() !== "" && 
            item.pesan && String(item.pesan).trim() !== ""
        );

        if (validData.length > 0) {
            commentList.innerHTML = '';
            
            // Separate main comments and replies
            const mainComments = validData.filter(c => !c.replyTo);
            const replies = validData.filter(c => c.replyTo);
            
            mainComments.reverse().forEach(item => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment-thread';
                
                // Logic for Secret Codes (Bride & Groom)
                let rawName = String(item.nama).trim();
                let displayName = item.nama;
                let specialClass = "";
                
                if (rawName === "2203") {
                    displayName = '<i class="fas fa-check-circle"></i> Syarifah, S.pd.';
                    specialClass = "mempelai-admin";
                } else if (rawName === "0326" || rawName === "326") {
                    displayName = '<i class="fas fa-check-circle"></i> Ghufron, S.sos.';
                    specialClass = "mempelai-admin";
                } else if (rawName === "1711") {
                    displayName = '<i class="fas fa-user-shield"></i> ADMIN';
                    specialClass = "super-admin";
                }

                const likes = item.likes || 0;
                commentDiv.innerHTML = `
                    <div class="comment-item ${specialClass}" id="comment-${item.id}">
                        <div class="comment-header">
                            <span class="comment-name">${displayName}</span>
                            <span class="comment-time">${item.timestamp}</span>
                        </div>
                        <p class="comment-text">${item.pesan}</p>
                        <div class="comment-footer">
                            <button class="reply-btn-toggle" onclick="showReplyForm('${item.id}', '${rawName === "2203" || rawName === "0326" || rawName === "326" || rawName === "1711" ? "Admin" : item.nama}')">
                                <i class="fas fa-reply"></i> Balas
                            </button>
                            <button class="love-btn" onclick="likeComment('${item.id}', this)">
                                <i class="far fa-heart"></i> <span class="count">${likes}</span>
                            </button>
                        </div>
                        <div id="reply-form-container-${item.id}" class="reply-form-inline hidden"></div>
                    </div>
                    <div class="replies-container" id="replies-${item.id}"></div>
                `;
                
                commentList.appendChild(commentDiv);
                
                // Add replies for this comment
                const thisReplies = replies.filter(r => r.replyTo === item.id);
                const replyContainer = document.getElementById(`replies-${item.id}`);
                
                thisReplies.forEach(reply => {
                    const replyDiv = document.createElement('div');
                    let rRawName = String(reply.nama).trim();
                    let rDisplayName = reply.nama;
                    let rSpecialClass = "";

                    if (rRawName === "2203") {
                        rDisplayName = '<i class="fas fa-check-circle"></i> Syarifah, S.pd.';
                        rSpecialClass = "mempelai-admin";
                    } else if (rRawName === "0326" || rRawName === "326") {
                        rDisplayName = '<i class="fas fa-check-circle"></i> Ghufron, S.sos.';
                        rSpecialClass = "mempelai-admin";
                    } else if (rRawName === "1711") {
                        rDisplayName = '<i class="fas fa-user-shield"></i> ADMIN';
                        rSpecialClass = "super-admin";
                    }

                    replyDiv.className = `comment-item reply-item ${rSpecialClass}`;
                    const rLikes = reply.likes || 0;
                    replyDiv.innerHTML = `
                        <div class="comment-header">
                            <span class="comment-name">${rDisplayName}</span>
                            <span class="comment-time">${reply.timestamp}</span>
                        </div>
                        <p class="comment-text">${reply.pesan}</p>
                        <div class="comment-footer">
                            <button class="love-btn" onclick="likeComment('${reply.id}', this)">
                                <i class="far fa-heart"></i> <span class="count">${rLikes}</span>
                            </button>
                        </div>
                    `;
                    replyContainer.appendChild(replyDiv);
                });
            });
        } else {
            commentList.innerHTML = '<div class="loading-comments">Belum ada ucapan. Jadilah yang pertama!</div>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        commentList.innerHTML = '<div class="loading-comments">Gagal memuat ucapan.</div>';
    }
}

// Show/Toggle Reply Form
function showReplyForm(commentId, targetName) {
    const container = document.getElementById(`reply-form-container-${commentId}`);
    
    // Toggle if already has content
    if (container.innerHTML !== '') {
        container.classList.toggle('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="reply-box-inner">
            <p class="replying-to">Membalas <strong>${targetName}</strong></p>
            <input type="text" id="reply-name-${commentId}" placeholder="Nama Anda (Optional: Hamba Allah)" class="reply-input">
            <textarea id="reply-msg-${commentId}" placeholder="Tulis balasan..." class="reply-textarea" rows="2"></textarea>
            <div class="reply-actions">
                <button class="btn-cancel" onclick="toggleReplyForm('${commentId}')">Batal</button>
                <button class="btn-send-reply" onclick="submitReply('${commentId}')" id="btn-submit-reply-${commentId}">Kirim Balasan</button>
            </div>
        </div>
    `;
}

function toggleReplyForm(id) {
    document.getElementById(`reply-form-container-${id}`).classList.add('hidden');
}

// Submit Reply
async function submitReply(replyToId) {
    const nameInput = document.getElementById(`reply-name-${replyToId}`);
    const msgInput = document.getElementById(`reply-msg-${replyToId}`);
    const btn = document.getElementById(`btn-submit-reply-${replyToId}`);
    
    const nama = nameInput.value.trim() || "Hamba Allah";
    const pesan = msgInput.value.trim();
    
    if (!pesan) {
        alert("Silakan tulis balasan Anda.");
        return;
    }
    
    btn.disabled = true;
    btn.innerText = "Mengirim...";
    
    const data = {
        action: 'postComment',
        timestamp: new Date().toLocaleString('id-ID'),
        nama: nama,
        pesan: pesan,
        replyTo: replyToId
    };
    
    try {
        await fetch(SPREADSHEET_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            mode: 'no-cors'
        });
        
        // Since no-cors doesn't allow reading response, we assume success if no crash
        // and we refresh the UI
        alert("Balasan terkirim!");
        toggleReplyForm(replyToId);
        setTimeout(loadComments, 1000); 
    } catch (error) {
        // Technically with no-cors it might still enter here due to redirect
        // But the alert above is much safer
        console.log("Post reply attempted");
        alert("Ucapan terkirim!");
        toggleReplyForm(replyToId);
        setTimeout(loadComments, 1000);
    }
}

// Like/Love a Comment
async function likeComment(commentId, btn) {
    if (btn.classList.contains('active')) return;

    const countSpan = btn.querySelector('.count');
    let currentCount = parseInt(countSpan.innerText);

    // Optimistic Update
    btn.classList.add('active');
    btn.querySelector('i').className = 'fas fa-heart';
    countSpan.innerText = currentCount + 1;

    try {
        const data = {
            action: 'reactComment',
            id: commentId,
            type: 'like'
        };

        await fetch(SPREADSHEET_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            mode: 'no-cors'
        });
    } catch (error) {
        console.error('Error liking comment:', error);
    }
}

// Post Comment
if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        submitCommentBtn.disabled = true;
        submitCommentBtn.innerText = 'Mengirim...';

        const formData = new FormData(commentForm);
        const data = {
            action: 'postComment',
            timestamp: new Date().toLocaleString('id-ID'),
            nama: formData.get('name'),
            pesan: formData.get('message')
        };

        try {
            await fetch(SPREADSHEET_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                mode: 'no-cors'
            });

            // Optimistic update / UI Feedback
            commentForm.reset();
            alert('Terima kasih atas ucapannya!');

            // Reload real data after a short delay
            setTimeout(loadComments, 1000);

        } catch (error) {
            // Assume success for no-cors
            commentForm.reset();
            alert('Terima kasih atas ucapannya!');
            setTimeout(loadComments, 1000);
        } finally {
            submitCommentBtn.disabled = false;
            submitCommentBtn.innerText = 'Kirim Ucapan';
        }
    });
}


// 4. Form Submission to Google Sheets (RSVP)
if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Change button state
        submitBtn.disabled = true;
        submitBtn.innerText = 'Mengirim...';

        // Get form data
        const formData = new FormData(rsvpForm);
        const data = {
            action: 'postRSVP',
            timestamp: new Date().toLocaleString('id-ID'),
            nama: formData.get('name'),
            kehadiran: formData.get('attendance'),
            jumlah_tamu: formData.get('guests')
        };

        try {
            const response = await fetch(SPREADSHEET_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                mode: 'no-cors'
            });

            // Show success message
            formMessage.innerHTML = 'Terima kasih atas konfirmasinya! Sampai jumpa di hari bahagia kami.';
            formMessage.className = 'success-msg';
            formMessage.classList.remove('hidden');

            // Reset form
            rsvpForm.reset();

        } catch (error) {
            console.error('Error!', error.message);
            formMessage.innerHTML = 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.';
            formMessage.className = 'error-msg';
            formMessage.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Kirim Konfirmasi';
        }
    });
}



