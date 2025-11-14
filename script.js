document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.gh-glitch').forEach(el => {
        const normalized = el.textContent.replace(/\s+/g, ' ').trim();
        el.setAttribute('data-text', normalized);
    });

    const aosElements = document.querySelectorAll('[data-aos]');
    aosElements.forEach(el => {
        el.classList.add('aos-init');
    });

    document.querySelectorAll('[data-aos-duration]').forEach(el => {
        const current = parseInt(el.getAttribute('data-aos-duration'), 10);
        if (!Number.isNaN(current)) {
            const faster = Math.max(400, Math.round(current * 0.75));
            el.setAttribute('data-aos-duration', faster);
        }
    });

    document.querySelectorAll('[data-aos-delay]').forEach(el => {
        const current = parseInt(el.getAttribute('data-aos-delay'), 10);
        if (!Number.isNaN(current) && current > 0) {
            const trimmed = Math.max(0, Math.round(current * 0.7));
            el.setAttribute('data-aos-delay', trimmed);
        }
    });
    
    AOS.init({
        duration: 600,
        once: true,
        offset: 50,
        easing: 'ease-out-cubic',
        delay: 0,
        disableMutationObserver: false
    });
    
    window.addEventListener('hashchange', function() {
        setTimeout(function() {
            AOS.refresh();
        }, 100);
    });

    const heroSection = document.querySelector('.hero-bg');
    
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            heroSection.style.transform = `scale(1.1) translateY(${scrollPosition * 0.05}px)`;
        });
    }
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const aosElements = target.querySelectorAll('[data-aos]');
                aosElements.forEach(el => {
                    el.classList.add('aos-animate');
                });
                
                const mobileMenu = document.querySelector('[x-data]');
                if (mobileMenu && mobileMenu.__x) {
                    mobileMenu.__x.$data.mobileMenuOpen = false;
                }
                
                document.querySelectorAll('nav a').forEach(navLink => {
                    navLink.classList.remove('text-gh-light-purple');
                    if (navLink.getAttribute('href') === targetId) {
                        navLink.classList.add('text-gh-light-purple');
                    }
                });
                
                const startPosition = window.pageYOffset;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                const distance = targetPosition - startPosition;
                const duration = 800;
                const startTime = performance.now();
                
                function scrollAnimation(currentTime) {
                    const elapsedTime = currentTime - startTime;
                    
                    if (elapsedTime < duration) {
                        const progress = easeInOutCubic(elapsedTime / duration);
                        window.scrollTo(0, startPosition + distance * progress);
                        requestAnimationFrame(scrollAnimation);
                    } else {
                        window.scrollTo(0, targetPosition);
                        window.history.pushState('', '', targetId);
                    }
                }
                
                requestAnimationFrame(scrollAnimation);
            }
        });
    });
    
    const fluentCards = document.querySelectorAll('.fluent-card:not(.no-tilt)');
    
    fluentCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            if (window.innerWidth <= 768) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;
            
            card.style.transform = `perspective(1000px) rotateX(${deltaY * -2}deg) rotateY(${deltaX * 2}deg) translateY(-5px)`;
            
            card.style.boxShadow = `
                0 20px 30px -10px rgba(138, 43, 226, 0.3),
                ${deltaX * 10}px ${deltaY * 10}px 20px -15px rgba(138, 43, 226, 0.2)
            `;
            
            const gradientX = 100 * (x / rect.width);
            const gradientY = 100 * (y / rect.height);
            card.style.background = `
                radial-gradient(
                    circle at ${gradientX}% ${gradientY}%, 
                    rgba(138, 43, 226, 0.1) 0%, 
                    rgba(0, 0, 0, 0) 50%
                ), rgba(255, 255, 255, 0.05)
            `;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = '';
            card.style.boxShadow = '';
            card.style.background = '';
        });
    });
    
    const { Client, Functions } = Appwrite;
    const client = new Client()
        .setEndpoint('https://discord.glitchhounds.games/v1')
        .setProject('684439b6001f3f53a474');
    const functions = new Functions(client);
    
    const contactForm = document.querySelector('#contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            if (!name || !email || !message) {
                showFluentNotification('Please fill in all fields', 'error');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showFluentNotification('Please enter a valid email address', 'error');
                return;
            }
            
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
            submitButton.disabled = true;
            
            addRippleEffect(submitButton);
            
            try {
                const result = await functions.createExecution(
                    '687d3431002b73460e6c',
                    JSON.stringify({ name, email, message }),
                    false,
                    '/',
                    'POST'
                );

                const data = JSON.parse(result.responseBody);
                
                if (data.success) {
                    contactForm.reset();
                    submitButton.innerHTML = '<i class="fas fa-check mr-2"></i> Message Sent!';
                    showFluentNotification('Your message has been sent successfully!', 'success');
                } else {
                    showFluentNotification(data.error || 'Failed to send message', 'error');
                    submitButton.innerHTML = originalButtonText;
                }
            } catch (error) {
                showFluentNotification('Failed to connect to server', 'error');
                submitButton.innerHTML = originalButtonText;
            }
            
            setTimeout(() => {
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }, 3000);
        });
    }
    
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('nav a');
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight && sectionId) {
                currentSection = '#' + sectionId;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('text-gh-light-purple');
            if (link.getAttribute('href') === currentSection) {
                link.classList.add('text-gh-light-purple');
            }
        });
    });
    
    const portfolioItems = document.querySelectorAll('#portfolio .group');
    
    portfolioItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const image = item.querySelector('img');
            if (image) {
                image.style.transform = 'scale(1.05)';
            }
            
            const overlay = item.querySelector('.absolute');
            if (overlay) {
                overlay.style.opacity = '1';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            const image = item.querySelector('img');
            if (image) {
                image.style.transform = '';
            }
            
            const overlay = item.querySelector('.absolute');
            if (overlay) {
                overlay.style.opacity = '';
            }
        });
    });
    
createBackToTopButton();
createScrollRevealEffects();

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function showFluentNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.fluent-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    const notification = document.createElement('div');
    notification.className = 'fluent-notification fixed top-4 right-4 p-4 rounded-lg z-50 backdrop-blur-md shadow-lg transform transition-all duration-500 translate-y-[-20px] opacity-0';
    
    if (type === 'error') {
        notification.classList.add('bg-red-500/80', 'text-white');
        notification.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${message}`;
    } else if (type === 'success') {
        notification.classList.add('bg-green-500/80', 'text-white');
        notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${message}`;
    } else {
        notification.classList.add('bg-blue-500/80', 'text-white');
        notification.innerHTML = `<i class="fas fa-info-circle mr-2"></i> ${message}`;
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateY(-20px)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 4000);
}

function addRippleEffect(button) {
    const ripple = document.createElement('span');
    ripple.className = 'absolute inset-0 rounded-md overflow-hidden';
    
    const animation = document.createElement('span');
    animation.className = 'absolute w-full h-full bg-white opacity-30 transform scale-0 origin-center rounded-full';
    animation.style.animation = 'ripple 0.6s ease-out forwards';
    
    if (!document.querySelector('#rippleAnimation')) {
        const style = document.createElement('style');
        style.id = 'rippleAnimation';
        style.textContent = `
            @keyframes ripple {
                0% { transform: scale(0); opacity: 0.5; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    ripple.appendChild(animation);
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 700);
}

function createBackToTopButton() {
    const button = document.createElement('button');
    button.className = 'fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gh-purple/80 text-white flex items-center justify-center opacity-0 transform translate-y-10 transition-all duration-300 backdrop-blur-sm hover:bg-gh-purple shadow-lg shadow-purple-500/20';
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.setAttribute('aria-label', 'Back to top');
    
    const progressCircle = document.createElement('svg');
    progressCircle.className = 'absolute inset-0 w-full h-full -rotate-90';
    progressCircle.innerHTML = `
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"></circle>
        <circle cx="24" cy="24" r="20" fill="none" stroke="white" stroke-width="2" stroke-dasharray="125.6" stroke-dashoffset="125.6" class="progress-circle"></circle>
    `;
    
    button.prepend(progressCircle);
    document.body.appendChild(button);
    
    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const scrollProgress = scrolled / scrollHeight;
        
        const progressOffset = 125.6 * (1 - scrollProgress);
        const circle = document.querySelector('.progress-circle');
        if (circle) {
            circle.style.strokeDashoffset = progressOffset;
        }
        
        if (scrolled > 300) {
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        } else {
            button.style.opacity = '0';
            button.style.transform = 'translateY(10px)';
        }
    });
    
    button.addEventListener('click', () => {
        addRippleEffect(button);
        
        const startPosition = window.pageYOffset;
        const duration = 800;
        const startTime = performance.now();
        
        function scrollToTop(currentTime) {
            const elapsedTime = currentTime - startTime;
            
            if (elapsedTime < duration) {
                const progress = 1 - (1 - elapsedTime / duration) * (1 - elapsedTime / duration);
                window.scrollTo(0, startPosition * (1 - progress));
                requestAnimationFrame(scrollToTop);
            } else {
                window.scrollTo(0, 0);
            }
        }
        
        requestAnimationFrame(scrollToTop);
    });
}

function createScrollRevealEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    const revealElements = document.querySelectorAll('.fluent-card, h2, p');
    revealElements.forEach((el, index) => {
        if (!el.getAttribute('data-aos')) {
            el.classList.add('reveal-element');
            const delay = Math.min(index * 0.02, 0.3);
            el.style.transitionDelay = `${delay}s`;
            observer.observe(el);
        }
    });
    
    if (!document.querySelector('#revealAnimations')) {
        const style = document.createElement('style');
        style.id = 'revealAnimations';
        style.textContent = `
            .reveal-element {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.45s ease, transform 0.45s ease;
            }
            .reveal-visible {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const meshGradient = document.querySelector('.mesh-gradient');
    const heroSection = document.querySelector('.acrylic-panel');
    
    if (meshGradient && heroSection) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'mesh-particles';
        heroSection.querySelector('.absolute.inset-0.z-0').appendChild(particlesContainer);
        
        for (let i = 0; i < 20; i++) {
            createParticle(particlesContainer);
        }
        
        setInterval(() => createParticle(particlesContainer), 800);
        
        heroSection.addEventListener('mousemove', function(e) {
            const rect = heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = Math.floor((x / rect.width) * 100);
            const yPercent = Math.floor((y / rect.height) * 100);
            
            meshGradient.style.backgroundPosition = `${xPercent}% ${yPercent}%, 0% 0%, 0% 0%`;
            
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.width = `${Math.random() * 4 + 2}px`;
                particle.style.height = particle.style.width;
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                particle.style.animation = `float-particle ${Math.random() * 3 + 2}s ease-out forwards`;
                particlesContainer.appendChild(particle);
                
                setTimeout(() => {
                    particle.remove();
                }, 5000);
            }, 50);
        });
        
        window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;
            const currentRect = heroSection.getBoundingClientRect();
            if (scrollY < currentRect.height) {
                meshGradient.style.transform = `scale(1.2) translateY(${scrollY * 0.05}px)`;
            }
        });
    }
});

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    const duration = Math.random() * 2 + 3;
    particle.style.animation = `float-particle ${duration}s ease-out forwards`;
    
    container.appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    const heroSection = document.querySelector('.acrylic-panel');
    const heroContent = heroSection.querySelector('.container');
    
    if (heroSection && heroContent) {
        const oldMeshGradient = heroSection.querySelector('.mesh-gradient');
        if (oldMeshGradient) {
            oldMeshGradient.style.animation = 'gradientFlow 15s ease infinite';
            oldMeshGradient.style.backgroundSize = '400% 400%, 100% 100%, 100% 100%';
        }
        
        const oldParticlesContainer = heroSection.querySelector('.mesh-particles');
        if (oldParticlesContainer) {
            oldParticlesContainer.remove();
        }
        
        const bgEffect = document.createElement('div');
        bgEffect.className = 'hero-bg-effect absolute inset-0 z-0';
        bgEffect.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-br from-gh-purple/20 to-transparent opacity-40 blur-3xl"></div>
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(138,43,226,0.2),transparent_70%)]"></div>
            <div class="absolute -top-1/2 -right-1/2 w-full h-full bg-gh-purple/10 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gh-light-purple/10 rounded-full blur-3xl"></div>
            <div class="absolute inset-0 opacity-30">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full">
                    <defs>
                        <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stop-color="rgba(138, 43, 226, 0.3)"></stop>
                            <stop offset="100%" stop-color="rgba(0, 0, 0, 0)"></stop>
                        </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="30" fill="url(#glow)" class="animate-pulse-slow"></circle>
                </svg>
            </div>
        `;
        
        const backgroundContainer = heroSection.querySelector('.absolute.inset-0.z-0');
        if (backgroundContainer) {
            backgroundContainer.appendChild(bgEffect);
        } else {
            const newBgContainer = document.createElement('div');
            newBgContainer.className = 'absolute inset-0 z-0 overflow-hidden';
            newBgContainer.appendChild(bgEffect);
            heroSection.appendChild(newBgContainer);
        }
        
        heroSection.addEventListener('mousemove', function(e) {
            if (window.innerWidth <= 768) return;
            
            const rect = heroSection.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const moveX = ((mouseX / rect.width) - 0.5) * 10;
            const moveY = ((mouseY / rect.height) - 0.5) * 10;
            
            heroContent.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
            
            const lightEffect = document.querySelector('.cursor-light-effect') || document.createElement('div');
            if (!lightEffect.classList.contains('cursor-light-effect')) {
                lightEffect.className = 'cursor-light-effect absolute w-96 h-96 rounded-full pointer-events-none z-0 opacity-20 bg-radial-light';
                lightEffect.style.background = 'radial-gradient(circle, rgba(183, 110, 255, 0.2) 0%, rgba(0, 0, 0, 0) 70%)';
                lightEffect.style.transform = 'translate(-50%, -50%)';
                heroSection.appendChild(lightEffect);
            }
            
            lightEffect.style.left = `${mouseX}px`;
            lightEffect.style.top = `${mouseY}px`;
        });
        
        heroSection.addEventListener('mouseleave', function() {
            heroContent.style.transform = 'translate3d(0, 0, 0)';
        });
        
        heroContent.style.transition = 'transform 0.2s ease-out';
        
        if (!document.querySelector('#hero-animations')) {
            const style = document.createElement('style');
            style.id = 'hero-animations';
            style.textContent = `
                @keyframes pulse-slow {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(0.95); opacity: 0.5; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
            `;
            document.head.appendChild(style);
        }
    }
    });
})
