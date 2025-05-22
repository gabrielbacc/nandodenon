// Espera o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    // Calendar functionality
    class Calendar {
        constructor() {
            this.date = new Date();
            this.currentMonth = this.date.getMonth();
            this.currentYear = this.date.getFullYear();
            this.today = new Date();
            this.monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            
            this.init();
        }

        init() {
            this.prevMonthBtn = document.getElementById('prevMonth');
            this.nextMonthBtn = document.getElementById('nextMonth');
            this.currentMonthElement = document.getElementById('currentMonth');
            this.calendarDays = document.getElementById('calendarDays');
            this.eventsTimeline = document.querySelector('.events-timeline');
            this.filterButtons = document.querySelectorAll('.filter-btn');

            if (this.prevMonthBtn && this.nextMonthBtn) {
                this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
                this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
            }
            
            if (this.filterButtons.length > 0) {
                this.filterButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => this.filterEvents(e));
                });
            }

            this.renderCalendar();
            this.renderEvents('all');
        }

        isPastEvent(date) {
            // Comparar apenas as datas como strings (formato YYYY-MM-DD)
            const today = new Date();
            const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            // Comparação simples de strings
            return date < todayFormatted;
        }

        renderCalendar() {
            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
            const startingDay = firstDay.getDay();
            const totalDays = lastDay.getDate();
            const events = SiteManager.getEvents();

            this.currentMonthElement.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
            this.calendarDays.innerHTML = '';

            // Add empty cells for days before the first day of the month
            for (let i = 0; i < startingDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day empty';
                this.calendarDays.appendChild(emptyDay);
            }

            // Add days of the month
            for (let day = 1; day <= totalDays; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;

                // Format the date string for comparison (mantendo o formato YYYY-MM-DD)
                const currentDate = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = events.filter(event => event.date === currentDate);
                const hasEvents = dayEvents.length > 0;
                
                if (hasEvents) {
                    const isPast = this.isPastEvent(currentDate);
                    dayElement.classList.add(isPast ? 'past-event' : 'has-event');
                    dayElement.setAttribute('data-date', currentDate);
                    
                    // Add tooltip with all event titles
                    const eventTitles = dayEvents.map(event => event.title).join('\n');
                    dayElement.title = `${dayEvents.length} evento${dayEvents.length > 1 ? 's' : ''}:\n${eventTitles}`;
                    
                    // Add indicator for multiple events
                    if (dayEvents.length > 1) {
                        dayElement.classList.add('multiple-events');
                    }
                }

                dayElement.addEventListener('click', () => this.selectDate(currentDate));
                this.calendarDays.appendChild(dayElement);
            }
        }

        changeMonth(delta) {
            this.currentMonth += delta;

            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }

            this.renderCalendar();
        }

        selectDate(date) {
            const events = EventManager.getEvents();
            const selectedEvents = events.filter(event => event.date === date);
            if (selectedEvents.length > 0) {
                this.renderEvents('all', date);
                
                // Remove previous selection
                document.querySelectorAll('.calendar-day.selected').forEach(day => {
                    day.classList.remove('selected');
                });
                
                // Add selection to clicked day
                const dayElement = document.querySelector(`.calendar-day[data-date="${date}"]`);
                if (dayElement) {
                    dayElement.classList.add('selected');
                }
            }
        }

        filterEvents(e) {
            const filter = e.target.dataset.filter;
            
            // Update active filter button
            this.filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            this.renderEvents(filter);
        }

        renderEvents(filter, selectedDate = null) {
            const events = EventManager.getEvents();
            let filteredEvents = [...events];

            // Filter by type if not 'all'
            if (filter !== 'all') {
                filteredEvents = filteredEvents.filter(event => event.type === filter);
            }

            // Filter by selected date if provided
            if (selectedDate) {
                filteredEvents = filteredEvents.filter(event => event.date === selectedDate);
            }

            // Sort events by date (usando localeCompare para evitar criação de objeto Date)
            filteredEvents.sort((a, b) => a.date.localeCompare(b.date));

            this.eventsTimeline.innerHTML = '';

            if (filteredEvents.length === 0) {
                this.eventsTimeline.innerHTML = '<p style="color: rgba(255, 255, 255, 0.7); text-align: center; padding: 20px;">Nenhum evento encontrado</p>';
                return;
            }

            filteredEvents.forEach((event, index) => {
                // Parse date parts diretamente da string YYYY-MM-DD
                const dateParts = event.date.split('-');
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]) - 1; // 0-indexed para mês
                const day = parseInt(dateParts[2]);
                
                // Criar os textos formatados diretamente
                const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                const monthShort = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 
                                   'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                
                const formattedDate = `${day} de ${monthNames[month]} de ${year}`;
                const isPast = this.isPastEvent(event.date);

                const eventElement = document.createElement('div');
                eventElement.className = `event-item${isPast ? ' past-event' : ''}`;
                eventElement.setAttribute('data-type', event.type);
                eventElement.innerHTML = `
                    <div class="event-date">
                        <div class="date-circle">
                            <span class="month">${monthShort[month]}</span>
                            <span class="day">${day}</span>
                            <span class="year">${year}</span>
                        </div>
                    </div>
                    <div class="event-content">
                        <h3>${event.title}</h3>
                        <p><i class="fas fa-clock"></i> ${event.time}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                        ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                    </div>
                `;

                // Add animation delay
                setTimeout(() => {
                    eventElement.classList.add('show');
                }, index * 100);

                this.eventsTimeline.appendChild(eventElement);
            });
        }
    }

    // Initialize Calendar
    const calendar = new Calendar();

    // Remove o preloader quando a página carregar completamente
    window.addEventListener('load', function() {
        const loader = document.getElementById('loader-wrapper');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.remove();
            }, 300);
        }
    });

    // Configuração das Partículas
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 80,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#ff6700'
            },
            shape: {
                type: 'circle'
            },
            opacity: {
                value: 0.5,
                random: true,
                animation: {
                    enable: true,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true,
                animation: {
                    enable: true,
                    speed: 2,
                    size_min: 0.1,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#ff6700',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'repulse'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                repulse: {
                    distance: 100,
                    duration: 0.4
                },
                push: {
                    particles_nb: 4
                }
            }
        },
        retina_detect: true
    });

    // Inicialização AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Inicialização Swiper para Shows
    const thumbsGallery = new Swiper('.thumbs-gallery', {
        spaceBetween: 10,
        slidesPerView: 'auto',
        freeMode: true,
        watchSlidesProgress: true,
        centerInsufficientSlides: true,
        breakpoints: {
            320: {
                slidesPerView: 2,
            },
            480: {
                slidesPerView: 3,
            },
            768: {
                slidesPerView: 4,
            },
            1024: {
                slidesPerView: 5,
            },
        }
    });

    const mainGallery = new Swiper('.main-gallery', {
        spaceBetween: 10,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        thumbs: {
            swiper: thumbsGallery
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    });

    // Inicialização FancyBox
    Fancybox.bind('[data-fancybox="gallery"]', {
        dragToClose: false,
        Toolbar: {
            display: {
                left: [],
                middle: [],
                right: ['close'],
            },
        },
        Images: {
            zoom: false,
        },
        Thumbs: {
            type: 'classic',
        },
        Carousel: {
            transition: 'slide',
        },
        Video: {
            ratio: 16/9,
            autoStart: true,
        }
    });

    // Inicialização dos vídeos
    function initializeVideos() {
        const videos = document.querySelectorAll('.preview-video');
        
        videos.forEach(video => {
            // Garantir que o vídeo comece a rodar assim que carregar
            video.addEventListener('loadeddata', () => {
                video.play().catch(error => {
                    console.log('Autoplay prevented:', error);
                });
            });

            // Se o vídeo parar por algum motivo, tentar rodar novamente
            video.addEventListener('pause', () => {
                if (!video.ended) {
                    video.play().catch(error => {
                        console.log('Replay prevented:', error);
                    });
                }
            });

            // Reiniciar o vídeo quando terminar
            video.addEventListener('ended', () => {
                video.currentTime = 0;
                video.play().catch(error => {
                    console.log('Loop prevented:', error);
                });
            });

            // Tentar iniciar o vídeo imediatamente
            if (video.readyState >= 2) {
                video.play().catch(error => {
                    console.log('Initial autoplay prevented:', error);
                });
            }
        });
    }

    // Chamar a função quando o DOM estiver carregado
    document.addEventListener('DOMContentLoaded', initializeVideos);

    // Chamar novamente quando a página estiver totalmente carregada
    window.addEventListener('load', initializeVideos);

    // Observer para garantir que os vídeos continuem rodando mesmo quando não estão visíveis
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(error => {
                    console.log('Autoplay prevented on scroll:', error);
                });
            }
        });
    }, { threshold: 0.1 });

    // Observar todos os vídeos
    document.querySelectorAll('.preview-video').forEach(video => {
        videoObserver.observe(video);
    });

    // Animações GSAP para a seção de Shows
    gsap.from('.video-showcase', {
        scrollTrigger: {
            trigger: '.shows-section',
            start: 'top center',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2
    });

    gsap.from('.shows-cta', {
        scrollTrigger: {
            trigger: '.shows-cta',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        y: 30,
        opacity: 0,
        duration: 0.8
    });

    // Inicialização Swiper
    const galeriaSwiper = new Swiper('.galeria-swiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 1,
                spaceBetween: 20,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 30,
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30,
            },
        }
    });

    // Header Scroll Class
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Menu Toggle para Mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Fechar menu ao clicar em link de navegação
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    // Smooth scroll para as âncoras
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        });
    });

    // Back to Top Button
    const backToTopButton = document.querySelector('.back-to-top');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 700) {
            backToTopButton.classList.add('active');
        } else {
            backToTopButton.classList.remove('active');
        }
    });

    // Atualizar classe ativa no menu de navegação durante o scroll
    window.addEventListener('scroll', updateActiveNavLink);

    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    // Contador de números
    const counterElements = document.querySelectorAll('.counter');
    const statsSection = document.querySelector('.stats-container');
    
    let counted = false;
    
    window.addEventListener('scroll', function() {
        if (isInViewport(statsSection) && !counted) {
            counted = true;
            counterElements.forEach(counter => {
                const target = +counter.textContent;
                let count = 0;
                const increment = target / 30;
                
                const updateCount = () => {
                    if (count < target) {
                        count += increment;
                        counter.textContent = Math.floor(count);
                        setTimeout(updateCount, 50);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCount();
            });
        }
    });

    // Verifica se um elemento está visível na viewport
    function isInViewport(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0
        );
    }

    // Formulário de Contato
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            this.reset();
            alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        });
    }

    // Animações GSAP
    gsap.registerPlugin(ScrollTrigger);

    // Animações da Seção Inicial
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
        .from('.neon-text', { 
            duration: 1.5, 
            opacity: 0, 
            y: 50,
            scale: 0.9,
            filter: 'blur(10px)',
            textShadow: 'none'
        })
        .from('.neon-underline', {
            duration: 1,
            width: 0,
            opacity: 0
        }, '-=0.5')
        .from('.neon-symbol', {
            duration: 1.2,
            opacity: 0,
            scale: 0.5,
            filter: 'blur(20px)',
            ease: 'back.out(1.7)'
        }, '-=0.3')
        .from('.neon-description', {
            duration: 1,
            opacity: 0,
            y: 30,
            filter: 'blur(5px)'
        }, '-=0.8')
        .from('.hero-buttons .btn', {
            duration: 0.8,
            opacity: 0,
            y: 20,
            stagger: 0.2
        }, '-=0.5')
        .from('.social-bar a', {
            duration: 0.5,
            opacity: 0,
            x: -20,
            stagger: 0.1
        }, '-=0.5')
        .from('.scroll-indicator', {
            duration: 0.5,
            opacity: 0,
            y: -20
        }, '-=0.3');

    // Animações de Scroll para elementos de seção
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: 0.8
        });
    });

    // Efeito Parallax para as imagens de fundo sutis
    gsap.utils.toArray('.subtle-bg-image').forEach(bg => {
        gsap.to(bg, {
            backgroundPosition: `${Math.random() * 10 - 5}% ${Math.random() * 10 - 5}%`,
            ease: "none",
            scrollTrigger: {
                trigger: bg.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
    });

    // Video Cards Interaction
    const videoCards = document.querySelectorAll('.video-card');
    const videoModal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalTitle = document.getElementById('modalTitle');
    const modalLocation = document.getElementById('modalLocation');
    const modalEventType = document.getElementById('modalEventType');
    const closeModal = document.querySelector('.close-modal');
    let currentVideo = null;

    // Handle video card hover
    videoCards.forEach(card => {
        const video = card.querySelector('.preview-video');
        
        // Start loading the video
        video.load();

        card.addEventListener('mouseenter', () => {
            video.play().catch(err => console.log('Video autoplay prevented'));
        });

        card.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });

        // Handle click to open modal
        card.addEventListener('click', () => {
            const videoSrc = video.getAttribute('src');
            const title = card.querySelector('h3').textContent;
            const location = card.querySelector('p').textContent;
            const eventType = card.querySelector('.event-type').textContent;

            modalVideo.src = videoSrc;
            modalTitle.textContent = title;
            modalLocation.textContent = location;
            modalEventType.textContent = eventType;

            videoModal.classList.add('active');
            modalVideo.play().catch(err => console.log('Modal video autoplay prevented'));
            currentVideo = modalVideo;

            // Pause the preview video
            video.pause();
        });
    });

    // Close modal functionality
    const closeVideoModal = () => {
        if (currentVideo) {
            currentVideo.pause();
            currentVideo.currentTime = 0;
        }
        videoModal.classList.remove('active');
    };

    closeModal.addEventListener('click', closeVideoModal);

    // Close modal when clicking outside
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });

    // Partículas no CTA
    particlesJS('cta-particles', {
        particles: {
            number: {
                value: 40,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#ff6700'
            },
            shape: {
                type: 'circle'
            },
            opacity: {
                value: 0.5,
                random: true
            },
            size: {
                value: 3,
                random: true
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#ff6700',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 0.5
                    }
                }
            }
        },
        retina_detect: true
    });

    // Animações GSAP para a seção Shows
    gsap.from('.video-card', {
        scrollTrigger: {
            trigger: '.videos-grid',
            start: 'top center',
            toggleActions: 'play none none reverse'
        },
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2
    });

    gsap.from('.shows-cta', {
        scrollTrigger: {
            trigger: '.shows-cta',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.8
    });

    // Shows Filter Functionality
    const showsFilterBtns = document.querySelectorAll('.shows-filter-btn');
    const showVideoCards = document.querySelectorAll('.video-card');

    showsFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            showsFilterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            // Filter video cards
            showVideoCards.forEach(card => {
                const eventType = card.querySelector('.event-type').textContent.toLowerCase();
                
                if (filter === 'all' || eventType === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 100);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}); 