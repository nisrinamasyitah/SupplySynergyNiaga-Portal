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
        nav.classList.toggle('open', open);
        menu.setAttribute('aria-expanded', open);
        menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';
    }
    menu.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
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

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (form._honey && form._honey.value) return;          // bot filled the hidden field

            var data = {};
            new FormData(form).forEach(function (v, k) { data[k] = v; });
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
                failed(mailto, 'The connection to the form service failed. Please check your internet connection.');
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
