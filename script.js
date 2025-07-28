document.addEventListener('DOMContentLoaded', () => {
    const headmasters = [
        { id: 'browning', name: 'Browning', years: '1888–1920' },
        { id: 'jones', name: 'Jones', years: '1920–1948' },
        { id: 'tobin', name: 'Tobin', years: '1948–1952' },
        { id: 'cook', name: 'Cook', years: '1952–1988' },
        { id: 'clement', name: 'Clement', years: '1988–2016' },
        { id: 'botti', name: 'Botti', years: '2016-Present' }
    ];

    const mainContainer = document.querySelector('.container.mx-auto.space-y-24');
    const scrubberContainer = document.querySelector('#timeline-scrubber .flex');
    const mobileMenuContainer = document.getElementById('mobile-menu');

    // --- Gemini API Configuration ---
    const API_KEY = ""; // This will be handled by the environment.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    async function callGemini(prompt) {
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`API call failed: ${response.status}`);
            const result = await response.json();
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "Error generating narrative. Please check the console.";
        }
    }

    async function generateNarrative(headmasterName, years) {
        const prompt = `You are a historian for The Browning School's digital archive. Write a compelling, one-paragraph narrative for Headmaster ${headmasterName}'s tenure (${years}). Focus on the key challenges, achievements, and the overall atmosphere of the school during their leadership. Make it engaging for a website visitor.`;
        return await callGemini(prompt);
    }

    // --- Dynamic Content Generation ---
    async function populateHeadmasters() {
        // Skip the first headmaster (Browning) as it's hardcoded as an example
        for (let i = 1; i < headmasters.length; i++) {
            const hm = headmasters[i];
            const narrativeText = await generateNarrative(hm.name, hm.years);
            const sectionHTML = `
                <section id="${hm.id}" class="headmaster-section section-divider pb-16">
                    <div class="text-center mb-12">
                        <h2 class="text-5xl font-bold font-serif">${hm.name}</h2>
                        <h3 class="text-3xl font-semibold text-primary-red mt-2">${hm.years}</h3>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div class="narrative-column lg:col-span-2">
                            <div class="space-y-4">
                                <div class="accordion-item">
                                    <div class="accordion-header flex justify-between items-center open">
                                        <h4 class="text-xl font-bold">Overview</h4>
                                        <span class="accordion-arrow text-2xl">&rsaquo;</span>
                                    </div>
                                    <div class="accordion-content open">
                                        <p class="text-gray-300 leading-relaxed">${narrativeText}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="documents-column lg:col-span-1 space-y-6">
                            <div class="document-card rounded-lg p-4" data-img="https://placehold.co/800x600/333333/eeeeee?text=Document+for+${hm.name}" data-title="Key Document, ${hm.years}" data-desc="A significant artifact from ${hm.name}'s era, highlighting their impact on the school.">
                                <h5 class="font-bold text-lg">[Doc. 1] Key Document</h5>
                                <p class="text-sm text-gray-400">An artifact from the ${hm.name} era.</p>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            mainContainer.insertAdjacentHTML('beforeend', sectionHTML);
        }
        
        // After all content is added, initialize all event listeners
        initializeEventListeners();
    }

    // --- UI Interactivity ---
    function initializeEventListeners() {
        // Mobile menu toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

        // Accordion functionality
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                header.classList.toggle('open');
                content.classList.toggle('open');
            });
        });

        // Document reference highlighting
        document.querySelectorAll('.doc-ref').forEach(ref => {
            const docId = ref.getAttribute('data-doc');
            const targetDoc = document.getElementById(docId);
            if (targetDoc) {
                ref.addEventListener('mouseenter', () => targetDoc.classList.add('highlighted'));
                ref.addEventListener('mouseleave', () => targetDoc.classList.remove('highlighted'));
            }
        });

        // Document card click to open modal
        document.querySelectorAll('.document-card').forEach(card => {
            card.addEventListener('click', () => {
                const imgSrc = card.getAttribute('data-img');
                const title = card.getAttribute('data-title');
                const desc = card.getAttribute('data-desc');
                openModal(imgSrc, title, desc);
            });
        });
    }

    // --- Navigation and Scrubber ---
    function setupNavigation() {
        headmasters.forEach(hm => {
            // Populate Scrubber
            const scrubberLink = `<a href="#${hm.id}" class="scrubber-link" data-section="${hm.id}">${hm.name}</a>`;
            scrubberContainer.innerHTML += scrubberLink;
            // Populate Mobile Menu
            const mobileLink = `<a href="#${hm.id}" class="block py-2 text-gray-300 hover:text-white">${hm.name}</a>`;
            mobileMenuContainer.innerHTML += mobileLink;
        });

        const scrubberLinks = document.querySelectorAll('.scrubber-link');
        const sections = document.querySelectorAll('.headmaster-section');

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    scrubberLinks.forEach(link => {
                        link.classList.toggle('active', link.dataset.section === entry.target.id);
                    });
                }
            });
        }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });

        sections.forEach(section => observer.observe(section));
    }

    // --- Vertical Timeline Sidebar ---
    function setupVerticalTimeline() {
        const timeline = document.getElementById('vertical-timeline');
        if (!timeline) return;
        timeline.innerHTML = '';
        headmasters.forEach(hm => {
            const link = document.createElement('a');
            link.href = `#${hm.id}`;
            link.className = 'timeline-link py-2 px-3 my-1 rounded text-gray-300 hover:bg-primary-red hover:text-white transition block w-full';
            link.textContent = `${hm.name} (${hm.years})`;
            link.setAttribute('data-section', hm.id);
            timeline.appendChild(link);
        });
        // Highlight active section
        const links = timeline.querySelectorAll('.timeline-link');
        const sections = document.querySelectorAll('.headmaster-section');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    links.forEach(link => {
                        link.classList.toggle('bg-primary-red', link.dataset.section === entry.target.id);
                        link.classList.toggle('text-white', link.dataset.section === entry.target.id);
                    });
                }
            });
        }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
        sections.forEach(section => observer.observe(section));
    }

    // --- Editable Content Logic ---
    function setupEditableContent() {
        // Restore edits from localStorage
        document.querySelectorAll('.editable').forEach(el => {
            const id = el.dataset.editId;
            if (!id) return;
            const saved = localStorage.getItem('edit-' + id);
            if (saved !== null) el.innerHTML = saved;
        });
        // Show edit buttons on hover
        document.querySelectorAll('.editable').forEach(el => {
            const btn = el.nextElementSibling;
            if (!btn || !btn.classList.contains('edit-btn')) return;
            el.parentElement.addEventListener('mouseenter', () => btn.classList.remove('hidden'));
            el.parentElement.addEventListener('mouseleave', () => btn.classList.add('hidden'));
            btn.addEventListener('click', () => startEditing(el, btn));
        });
    }

    function startEditing(el, btn) {
        if (el.isContentEditable) return;
        el.contentEditable = 'true';
        el.focus();
        btn.textContent = 'Save';
        btn.classList.remove('bg-primary-red');
        btn.classList.add('bg-green-600');
        // Add cancel button
        let cancelBtn = btn.nextElementSibling;
        if (!cancelBtn || !cancelBtn.classList.contains('cancel-btn')) {
            cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn ml-2 px-2 py-1 text-xs bg-gray-500 text-white rounded';
            cancelBtn.textContent = 'Cancel';
            btn.after(cancelBtn);
        } else {
            cancelBtn.classList.remove('hidden');
        }
        // Save on button click
        btn.onclick = () => {
            el.contentEditable = 'false';
            btn.textContent = 'Edit';
            btn.classList.add('bg-primary-red');
            btn.classList.remove('bg-green-600');
            cancelBtn.classList.add('hidden');
            // Save to localStorage
            const id = el.dataset.editId;
            if (id) localStorage.setItem('edit-' + id, el.innerHTML);
            // Restore edit button click
            btn.onclick = () => startEditing(el, btn);
        };
        // Cancel logic
        cancelBtn.onclick = () => {
            el.contentEditable = 'false';
            btn.textContent = 'Edit';
            btn.classList.add('bg-primary-red');
            btn.classList.remove('bg-green-600');
            cancelBtn.classList.add('hidden');
            // Restore from localStorage or original
            const id = el.dataset.editId;
            const saved = localStorage.getItem('edit-' + id);
            if (saved !== null) el.innerHTML = saved;
            btn.onclick = () => startEditing(el, btn);
        };
    }


    // --- Modal Functionality ---
    const modal = document.getElementById('modal');
    window.openModal = (imgSrc, title, desc) => {
        modal.querySelector('#modal-img').src = imgSrc;
        modal.querySelector('#modal-img').alt = title;
        modal.querySelector('#modal-title').textContent = title;
        modal.querySelector('#modal-desc').textContent = desc;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    window.closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
    modal.addEventListener('click', e => e.target === modal && closeModal());


    // --- Initialization ---
    setupNavigation();
    populateHeadmasters(); // This will now also call initializeEventListeners
    setupVerticalTimeline();
    setupEditableContent();
});
