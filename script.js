(function () {
    // Always start at the top (Home) when the page is loaded or refreshed.
    // Stop the browser restoring the old scroll position, and drop any "#section" from the address.
    // A link from another page (e.g. business.html#contact) still lands on that section.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    var isReload = navEntry.type === 'reload' || navEntry.type === 'back_forward';
    var goTop = isReload || !location.hash;
    if (location.hash && isReload) history.replaceState(null, '', location.pathname + location.search);
    function toTop() {
        if (!goTop) return;
        var html = document.documentElement;
        var prev = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';   // jump instantly, no smooth scroll on load
        window.scrollTo(0, 0);
        html.style.scrollBehavior = prev;
    }
    toTop();
    window.addEventListener('load', toTop);
    window.addEventListener('pageshow', function (e) { if (e.persisted) { goTop = true; toTop(); } });

    var header = document.getElementById('header');
    var nav = document.getElementById('nav');
    var menu = document.getElementById('menu');

    var progress = document.getElementById('progress');
    var indicator = document.getElementById('navIndicator');
    // top-level menu links (multi-page site uses a.top; single pages use plain links)
    var links = Array.prototype.slice.call(nav.querySelectorAll('a.top'));
    if (!links.length) links = Array.prototype.slice.call(nav.querySelectorAll(':scope > a:not(.nav-cta)'));
    var pageLink = nav.querySelector('a.top.current');   // link of the page we are on
    var activeLink = null;

    // move the sliding indicator under a link
    function moveIndicator(link) {
        if (!indicator) return;
        if (!link) { indicator.classList.remove('show'); return; }
        var box = indicator.offsetParent || nav;   // the element the indicator is positioned inside
        var left = link.getBoundingClientRect().left - box.getBoundingClientRect().left;   // works inside dropdown wrappers too
        indicator.style.width = link.offsetWidth + 'px';
        indicator.style.transform = 'translateX(' + left + 'px)';
        indicator.classList.add('show');
    }
    links.forEach(function (a) {
        a.addEventListener('mouseenter', function () { moveIndicator(a); });
    });
    nav.addEventListener('mouseleave', function () { moveIndicator(activeLink); });
    window.addEventListener('resize', function () { moveIndicator(activeLink); });

    // highlight the link of the section currently on screen
    var sections = links.map(function (a) {
        var h = a.getAttribute('href') || '';
        return h.charAt(0) === '#' && h.length > 1 ? document.querySelector(h) : null;   // only in-page sections
    });
    function updateActive() {
        var y = window.scrollY + window.innerHeight * 0.35;
        var current = sections.some(Boolean) ? null : pageLink;
        sections.forEach(function (s, n) { if (s && s.offsetTop <= y) current = links[n]; });
        // at the very bottom, the last section (Contact) is active
        if (sections.some(Boolean) && window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = nav.querySelector('.nav-cta');
        if (current !== activeLink) {
            links.forEach(function (a) { a.classList.toggle('active', a === current); });
            activeLink = links.indexOf(current) > -1 ? current : null;
            moveIndicator(activeLink);
        }
    }

    function onScroll() {
        header.classList.toggle('ruled', window.scrollY > 8);
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
        updateActive();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', onScroll);
    onScroll();

    // mobile menu
    function setMenu(open) {
        // the phone menu starts right under the header, wherever it currently is
        // (lower at the top of the page, where the top bar is still showing)
        if (open) nav.style.top = Math.max(0, Math.round(header.getBoundingClientRect().bottom)) + 'px';
        nav.classList.toggle('open', open);
        menu.setAttribute('aria-expanded', open);
        menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
    }
    menu.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960 && nav.classList.contains('open')) setMenu(false); });
    nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setMenu(false); });
    });

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // partner rows: repeat the cards until they fill the screen, then double them
    // so the row can scroll forever without a visible jump.
    function startPartnerRow(track) {
        var base = Array.prototype.slice.call(track.children);
        function cloneAll(list) {
            list.forEach(function (li) {
                var c = li.cloneNode(true);
                c.setAttribute('aria-hidden', 'true');
                track.appendChild(c);
            });
        }
        track.classList.add('run');
        var need = Math.max(window.innerWidth, 1400);
        var guard = 0;
        while (track.scrollWidth < need && guard++ < 20) cloneAll(base);
        cloneAll(Array.prototype.slice.call(track.children));
        track.style.animationDuration = Math.round(track.scrollWidth / 2 / 40) + 's';   // ~40px per second
    }
    if (!reduceMotion) document.querySelectorAll('.pm-track').forEach(startPartnerRow);

    // ───────── project window: click a project card to see its pictures and details ─────────
    // To use real photos: put them in image/projects/ and replace the entries in that project's "images" list.
    // Pictures marked illustration: true show an "Illustration" label so visitors don't mistake them for photos.
    var ORDER = ['mpsepang', 'mekjajewels', 'nelmora', 'sprm'];
    var PROJECTS = {
        mpsepang: {
            partner: 'Majlis Perbandaran Sepang', logo: 'image/mpsepang.png', sector: 'Government · Municipal Council',
            title: 'Football Team Jerseys', scope: 'Apparel Supply', role: 'Supplier',
            text: ['Supplied football jerseys for the Majlis Perbandaran Sepang (MPSepang) football team.'],
            images: [
                { src: 'image/projects/jerseys-1.svg', alt: 'Football jersey', illustration: true },
                { src: 'image/projects/jerseys-2.svg', alt: 'Stack of folded jerseys', illustration: true },
                { src: 'image/projects/jerseys-3.svg', alt: 'Jerseys packed for delivery', illustration: true }
            ]
        },
        mekjajewels: {
            partner: 'MekjaJewels', logo: 'image/mekjajewels-web.png', sector: 'Private · Jewellery Brand',
            title: 'Information Cards', scope: 'Printing', role: 'Production & Supply',
            text: ['Produced information cards for MekjaJewels.'],
            images: [
                { src: 'image/projects/cards-1.svg', alt: 'Printed information card', illustration: true },
                { src: 'image/projects/cards-2.svg', alt: 'Set of information cards', illustration: true },
                { src: 'image/projects/cards-3.svg', alt: 'Information cards with envelope', illustration: true }
            ]
        },
        nelmora: {
            partner: 'Nelmora Parfums', logo: 'image/nelmora.png', sector: 'Private · Fragrance Brand',
            title: 'Product Stickers', scope: 'Printing', role: 'Production & Supply',
            text: ['Produced product stickers for Nelmora Parfums.'],
            images: [
                { src: 'image/projects/stickers-1.svg', alt: 'Labelled fragrance bottle', illustration: true },
                { src: 'image/projects/stickers-2.svg', alt: 'Sheet of product stickers', illustration: true },
                { src: 'image/projects/stickers-3.svg', alt: 'Roll of product stickers', illustration: true }
            ]
        },
        sprm: {
            partner: 'Malaysian Anti-Corruption Commission (SPRM)', logo: 'image/sprm.png', sector: 'Government · Federal Agency',
            title: 'Corporate Mugs', scope: 'Merchandise', role: 'Subcontractor',
            text: ['Supplied and delivered corporate mugs to SPRM as a subcontractor.'],
            images: [
                { src: 'image/projects/mugs-1.svg', alt: 'Corporate mug', illustration: true },
                { src: 'image/projects/mugs-2.svg', alt: 'Set of corporate mugs', illustration: true },
                { src: 'image/projects/mugs-3.svg', alt: 'Mugs boxed for delivery', illustration: true }
            ]
        }
    };

    var cards = document.querySelectorAll('.project[data-project]');
    if (cards.length) {
        var modal = document.createElement('div');
        modal.className = 'pmodal';
        modal.hidden = true;
        modal.innerHTML =
            '<div class="pmodal-backdrop" data-close></div>' +
            '<div class="pmodal-panel" role="dialog" aria-modal="true" aria-labelledby="pmTitle">' +
                '<div class="pm-top">' +
                    '<p class="pm-kicker">Project Case Study <span class="pm-pos"></span></p>' +
                    '<button class="pmodal-close" type="button" aria-label="Close" data-close><i class="fas fa-times"></i></button>' +
                '</div>' +
                '<div class="pm-stage">' +
                    '<img class="pm-main" alt="">' +
                    '<span class="pm-badge">Illustration</span>' +
                    '<button class="pm-nav pm-prev" type="button" aria-label="Previous picture"><i class="fas fa-chevron-left"></i></button>' +
                    '<button class="pm-nav pm-next" type="button" aria-label="Next picture"><i class="fas fa-chevron-right"></i></button>' +
                    '<span class="pm-count"></span>' +
                '</div>' +
                '<div class="pm-thumbs"></div>' +
                '<div class="pm-body">' +
                    '<div class="pm-overview">' +
                        '<p class="pm-sector"></p>' +
                        '<h3 class="pm-title" id="pmTitle"></h3>' +
                        '<div class="pm-partner"><span class="pm-logo"><img alt=""></span><span><small>Partner</small><strong></strong></span></div>' +
                        '<h4 class="pm-h">Overview</h4>' +
                        '<div class="pm-desc"></div>' +
                    '</div>' +
                    '<aside class="pm-facts">' +
                        '<h4 class="pm-h">Project Details</h4>' +
                        '<dl class="pm-meta"></dl>' +
                        '<a href="contact.html" class="btn btn-primary pm-cta">Request a Similar Quotation</a>' +
                    '</aside>' +
                '</div>' +
                '<div class="pm-pager">' +
                    '<button type="button" class="pm-page pm-page-prev"><i class="fas fa-arrow-left"></i><span><small>Previous project</small><strong></strong></span></button>' +
                    '<button type="button" class="pm-page pm-page-next"><span><small>Next project</small><strong></strong></span><i class="fas fa-arrow-right"></i></button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modal);

        var panel = modal.querySelector('.pmodal-panel');
        var mainImg = modal.querySelector('.pm-main');
        var stage = modal.querySelector('.pm-stage');
        var badge = modal.querySelector('.pm-badge');
        var thumbs = modal.querySelector('.pm-thumbs');
        var count = modal.querySelector('.pm-count');
        var currentId = null, current = null, index = 0, opener = null;

        function escP(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

        function showImage(i) {
            var imgs = current.images;
            index = (i + imgs.length) % imgs.length;
            var im = imgs[index];
            mainImg.src = im.src;
            mainImg.alt = im.alt || current.title;
            badge.hidden = !im.illustration;
            count.textContent = (index + 1) + ' / ' + imgs.length;
            Array.prototype.forEach.call(thumbs.children, function (t, n) {
                t.classList.toggle('active', n === index);
                t.setAttribute('aria-current', n === index ? 'true' : 'false');
            });
        }

        function fill(id) {
            currentId = id;
            current = PROJECTS[id];
            var pos = ORDER.indexOf(id);
            modal.querySelector('.pm-pos').textContent = (pos + 1) + ' of ' + ORDER.length;
            modal.querySelector('.pm-sector').textContent = current.sector;
            modal.querySelector('.pm-title').textContent = current.title;
            modal.querySelector('.pm-logo img').src = current.logo;
            modal.querySelector('.pm-partner strong').textContent = current.partner;
            modal.querySelector('.pm-desc').innerHTML = current.text.map(function (p) { return '<p>' + escP(p) + '</p>'; }).join('');
            modal.querySelector('.pm-meta').innerHTML = [
                ['Partner', current.partner], ['Sector', current.sector], ['Scope', current.scope], ['Our Role', current.role]
            ].map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + escP(r[1]) + '</dd></div>'; }).join('');
            thumbs.innerHTML = current.images.map(function (im, n) {
                return '<button type="button" class="pm-thumb" aria-label="Picture ' + (n + 1) + '"><img src="' + im.src + '" alt=""></button>';
            }).join('');
            Array.prototype.forEach.call(thumbs.children, function (t, n) { t.addEventListener('click', function () { showImage(n); }); });
            modal.classList.toggle('single', current.images.length < 2);
            var prev = PROJECTS[ORDER[(pos - 1 + ORDER.length) % ORDER.length]];
            var next = PROJECTS[ORDER[(pos + 1) % ORDER.length]];
            modal.querySelector('.pm-page-prev strong').textContent = prev.title;
            modal.querySelector('.pm-page-next strong').textContent = next.title;
            showImage(0);
            panel.scrollTop = 0;
        }

        function openProject(id, from) {
            if (!PROJECTS[id]) return;
            opener = from || null;
            fill(id);
            modal.hidden = false;
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(function () { modal.classList.add('open'); });
            modal.querySelector('.pmodal-close').focus();
        }

        function closeProject() {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            setTimeout(function () { modal.hidden = true; }, 200);
            if (opener) opener.focus();
        }

        function step(d) { fill(ORDER[(ORDER.indexOf(currentId) + d + ORDER.length) % ORDER.length]); }

        Array.prototype.forEach.call(cards, function (card) {
            card.addEventListener('click', function () { openProject(card.getAttribute('data-project'), card); });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(card.getAttribute('data-project'), card); }
            });
        });
        modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeProject(); });
        modal.querySelector('.pm-prev').addEventListener('click', function () { showImage(index - 1); });
        modal.querySelector('.pm-next').addEventListener('click', function () { showImage(index + 1); });
        modal.querySelector('.pm-page-prev').addEventListener('click', function () { step(-1); });
        modal.querySelector('.pm-page-next').addEventListener('click', function () { step(1); });
        document.addEventListener('keydown', function (e) {
            if (modal.hidden) return;
            if (e.key === 'Escape') closeProject();
            else if (e.key === 'ArrowLeft') showImage(index - 1);
            else if (e.key === 'ArrowRight') showImage(index + 1);
        });
        // swipe between pictures on phones
        var startX = null;
        stage.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
        stage.addEventListener('touchend', function (e) {
            if (startX === null) return;
            var dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) showImage(index + (dx < 0 ? 1 : -1));
            startX = null;
        });
    }

    // contact form: send in the background through FormSubmit, show the result on the page,
    // and fall back to a pre-filled email if sending fails, so no enquiry is lost.
    var form = document.getElementById('enquiryForm');
    if (form && window.fetch) {
        var status = document.getElementById('formStatus');
        var button = form.querySelector('button[type="submit"]');
        var buttonHTML = button.innerHTML;
        var TO = 'supplysynergymy@gmail.com';

        function show(kind, html) {
            status.className = 'form-status ' + kind;
            status.innerHTML = html;
            status.hidden = false;
        }
        function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

        function failed(mailto, reason) {
            show('err', '<i class="fas fa-exclamation-circle"></i><div><strong>Your enquiry could not be sent.</strong>' +
                 (reason ? '<span class="form-reason">' + esc(reason) + '</span>' : '') +
                 '<span>Please <a href="' + mailto + '">send it by email instead</a> (your details are already filled in), ' +
                 'or WhatsApp us at <a href="https://wa.me/601114945722" target="_blank" rel="noopener">+60 11-1494 5722</a>.</span></div>');
        }

        // returning from a normal (fallback) submission
        if (/[?&]sent=1/.test(location.search)) {
            show('ok', '<i class="fas fa-check-circle"></i><div><strong>Thank you. Your enquiry has been sent.</strong>' +
                 '<span>A confirmation has been sent to your email. Our team will get back to you as soon as possible.</span></div>');
            history.replaceState(null, '', location.pathname);
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            // spam trap: a hidden checkbox that people never see and browser autofill never ticks
            if (form.hp_check && form.hp_check.checked) return;

            var data = {};
            new FormData(form).forEach(function (v, k) { data[k] = v; });
            delete data.hp_check;
            data._subject = 'Quotation request: ' + data.service + ' – ' + data.company;

            var body = 'Name: ' + data.name + '\nCompany: ' + data.company + '\nEmail: ' + data.email +
                       '\nPhone: ' + (data.phone || '-') + '\nService needed: ' + data.service + '\n\nDetails:\n' + data.message;
            var mailto = 'mailto:' + TO + '?subject=' + encodeURIComponent(data._subject) + '&body=' + encodeURIComponent(body);

            // the form service only accepts enquiries from the live website, not from a file opened on a computer
            if (location.protocol === 'file:') {
                failed(mailto, 'This page is opened as a file on this computer. The form only sends from the live website.');
                return;
            }

            button.disabled = true;
            button.innerHTML = 'Sending… <i class="fas fa-circle-notch fa-spin"></i>';
            status.hidden = true;

            fetch('https://formsubmit.co/ajax/' + TO, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (String(res.success) === 'true') {
                    show('ok', '<i class="fas fa-check-circle"></i><div><strong>Thank you, ' + esc(data.name) + '. Your enquiry has been sent.</strong>' +
                         '<span>A confirmation has been sent to ' + esc(data.email) + '. Our team will get back to you as soon as possible.</span></div>');
                    form.reset();
                } else {
                    // e.g. the form has not been activated yet: show the service's own explanation
                    failed(mailto, /activat/i.test(res.message || '')
                        ? 'The enquiry form is still being set up (activation pending).'
                        : (res.message || 'The form service did not accept the enquiry.'));
                }
            })
            .catch(function () {
                // The background request was blocked (ad-blocker, private DNS, in-app browser...).
                // Retry as a normal form submission, which blockers usually allow; FormSubmit then
                // returns the visitor to this page with ?sent=1.
                if (navigator.onLine === false) {
                    failed(mailto, 'You appear to be offline. Please check your internet connection.');
                    return;
                }
                form._subject.value = data._subject;
                var next = form.querySelector('input[name="_next"]') || document.createElement('input');
                next.type = 'hidden'; next.name = '_next';
                next.value = location.origin + location.pathname + '?sent=1#enquiryForm';
                form.appendChild(next);
                HTMLFormElement.prototype.submit.call(form);   // normal POST, skips this handler
            })
            .then(function () {
                button.disabled = false;
                button.innerHTML = buttonHTML;
            });
        });
    }

    // typing line under the name
    var typedEl = document.getElementById('typed');
    var roles = ['Managing Director', 'Business Leader', 'Entrepreneur', 'Strategic Partner'];
    if (typedEl && !reduceMotion) {
        var r = 0, i = roles[0].length, deleting = true;
        (function tick() {
            var word = roles[r];
            typedEl.textContent = word.slice(0, i);
            var delay = deleting ? 45 : 90;
            if (!deleting && i === word.length) { deleting = true; delay = 1800; }
            else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 350; }
            i += deleting ? -1 : 1;
            setTimeout(tick, delay);
        })();
    }

    // fade sections in as they scroll into view
    var targets = document.querySelectorAll('.sec-head, .sec-title, .profile-card, .about-body, .cred, .role, .str, .company, .contact-box, ' +
        '.biz-facts, .service, .values, .project, .process, .md-card, .md-letter, .marquee, .location, .vm-card, .join-card, ' +
        '.segment, .facts-grid, .leader, .info-table, .svc-visual, .industries > div, .logo-grid, .apply > div, ' +
        '.value, .biz-about > div, .legal-body, .contact-box, .sec-intro, .values-row, .divisions, .leader-feature, .docs, .pm-row');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    var el = e.target;
                    el.classList.add('in');
                    io.unobserve(el);
                    // once it has faded in, hand control back to the card's own hover effects
                    setTimeout(function () {
                        el.classList.remove('reveal', 'in');
                        el.style.transitionDelay = '';
                    }, 1200);
                }
            });
        }, { threshold: 0.15 });
        targets.forEach(function (el, n) {
            el.classList.add('reveal');
            // small stagger for cards sitting side by side
            if (el.classList.contains('project') || el.classList.contains('segment') || el.classList.contains('join-card') ||
                el.classList.contains('value') || el.classList.contains('pillar')) {
                el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) * 0.12) + 's';
            }
            if (el.classList.contains('str')) {
                el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) * 0.08) + 's';
            }
            io.observe(el);
        });
    }
})();
