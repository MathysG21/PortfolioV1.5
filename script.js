// Variables globales
let activeWindow = null;
let zIndexCounter = 100;
let isDragging = false;
let draggedWindow = null;
let offsetX = 0;
let offsetY = 0;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    initializeIcons();
    initializeWindows();
    initializeTaskbar();
    initializeStartMenu();
    initializeClock();
    initializeTheme();
    initializeSkills();
    initializeContactForm();
    initializeLanguage();
});

// Gestion des icônes du bureau
function initializeIcons() {
    const icons = document.querySelectorAll('.icon');
    
    icons.forEach(icon => {
        icon.addEventListener('click', () => {
            const windowName = icon.getAttribute('data-window');
            openWindow(windowName);
        });
    });
}

// Gestion des fenêtres
function initializeWindows() {
    const windows = document.querySelectorAll('.window');
    
    windows.forEach(window => {
        // Position initiale aléatoire mais centrée
        const maxX = window.innerWidth - 800;
        const maxY = window.innerHeight - 600;
        const randomX = Math.max(100, Math.random() * maxX);
        const randomY = Math.max(50, Math.random() * maxY);
        
        window.style.left = randomX + 'px';
        window.style.top = randomY + 'px';
        
        // Ajouter les poignées de redimensionnement
        addResizeHandles(window);
        
        // Boutons de contrôle
        const minimizeBtn = window.querySelector('.window-control.minimize');
        const maximizeBtn = window.querySelector('.window-control.maximize');
        const closeBtn = window.querySelector('.window-control.close');
        
        minimizeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            minimizeWindow(window);
        });
        
        maximizeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMaximize(window);
        });
        
        closeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            closeWindow(window);
        });
        
        // Drag & Drop
        const titlebar = window.querySelector('.window-titlebar');
        titlebar?.addEventListener('mousedown', (e) => startDragging(e, window));
        
        // Activation au clic
        window.addEventListener('mousedown', () => setActiveWindow(window));
    });
}

function openWindow(windowName) {
    const window = document.getElementById(`${windowName}-window`);
    if (!window) return;
    
    if (window.style.display === 'flex') {
        // Si déjà ouvert, juste activer
        setActiveWindow(window);
        return;
    }
    
    // Définir une taille par défaut si la fenêtre n'en a pas encore
    if (!window.style.width) {
        // Taille plus grande pour la fenêtre des projets, format mobile pour compétences
        if (windowName === 'projects') {
            window.style.width = '1100px';
        } else if (windowName === 'skills') {
            window.style.width = '400px';
        } else {
            window.style.width = '800px';
        }
    }
    if (!window.style.height) {
        if (windowName === 'projects') {
            window.style.height = '750px';
        } else if (windowName === 'skills') {
            window.style.height = '700px';
        } else {
            window.style.height = '600px';
        }
    }
    
    window.style.display = 'flex';
    window.classList.add('opening');
    
    setTimeout(() => {
        window.classList.remove('opening');
    }, 300);
    
    setActiveWindow(window);
    addTaskbarItem(windowName, window);
    
    // Animer les barres de compétences si c'est la fenêtre skills
    if (windowName === 'skills') {
        setTimeout(() => animateSkills(), 100);
    }
}

function closeWindow(window) {
    window.classList.add('closing');
    
    setTimeout(() => {
        window.style.display = 'none';
        window.classList.remove('closing', 'active');
        removeTaskbarItem(window);
        
        // Si c'était la fenêtre active, réinitialiser
        if (activeWindow === window) {
            activeWindow = null;
        }
    }, 200);
}

function minimizeWindow(window) {
    window.classList.add('minimizing');
    
    setTimeout(() => {
        window.style.display = 'none';
        window.classList.remove('minimizing', 'active');
        
        // Garder l'item dans la barre des tâches
        const windowName = window.getAttribute('data-window');
        const taskbarItem = document.querySelector(`.taskbar-item[data-window="${windowName}"]`);
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
        
        if (activeWindow === window) {
            activeWindow = null;
        }
    }, 300);
}

function toggleMaximize(window) {
    if (window.classList.contains('maximized')) {
        // Restaurer
        window.style.width = window.dataset.originalWidth || '800px';
        window.style.height = window.dataset.originalHeight || '600px';
        window.style.left = window.dataset.originalLeft || '100px';
        window.style.top = window.dataset.originalTop || '100px';
        window.classList.remove('maximized');
    } else {
        // Maximiser
        window.dataset.originalWidth = window.style.width || '800px';
        window.dataset.originalHeight = window.style.height || '600px';
        window.dataset.originalLeft = window.style.left;
        window.dataset.originalTop = window.style.top;
        
        const taskbarHeight = 48; // Hauteur de la barre des tâches en pixels
        window.style.width = '100vw';
        window.style.height = `calc(100vh - ${taskbarHeight}px)`;
        window.style.left = '0';
        window.style.top = '0';
        window.classList.add('maximized');
    }
}

function setActiveWindow(window) {
    // Retirer l'état actif de toutes les fenêtres
    document.querySelectorAll('.window').forEach(w => {
        w.classList.remove('active');
    });
    
    // Activer la fenêtre
    window.classList.add('active');
    window.style.zIndex = ++zIndexCounter;
    activeWindow = window;
    
    // Mettre à jour la barre des tâches
    const windowName = window.getAttribute('data-window');
    document.querySelectorAll('.taskbar-item').forEach(item => {
        item.classList.remove('active');
    });
    const taskbarItem = document.querySelector(`.taskbar-item[data-window="${windowName}"]`);
    if (taskbarItem) {
        taskbarItem.classList.add('active');
    }
}

// Drag & Drop
function startDragging(e, window) {
    if (window.classList.contains('maximized')) return;
    
    isDragging = true;
    draggedWindow = window;
    
    const rect = window.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    window.style.cursor = 'move';
    window.classList.add('dragging');
    
    document.addEventListener('mousemove', dragWindow);
    document.addEventListener('mouseup', stopDragging);
}

function dragWindow(e) {
    if (!isDragging || !draggedWindow) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Limites de l'écran
    const maxX = window.innerWidth - draggedWindow.offsetWidth;
    const maxY = window.innerHeight - draggedWindow.offsetHeight - 48; // taskbar height
    
    draggedWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    draggedWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
}

function stopDragging() {
    if (draggedWindow) {
        draggedWindow.style.cursor = 'default';
        draggedWindow.classList.remove('dragging');
    }
    
    isDragging = false;
    draggedWindow = null;
    
    document.removeEventListener('mousemove', dragWindow);
    document.removeEventListener('mouseup', stopDragging);
}

// Barre des tâches
function initializeTaskbar() {
    const taskbarItems = document.querySelector('.taskbar-items');
    
    // Délégation d'événements pour les items de la barre des tâches
    taskbarItems?.addEventListener('click', (e) => {
        const item = e.target.closest('.taskbar-item');
        if (!item) return;
        
        const windowName = item.getAttribute('data-window');
        const window = document.getElementById(`${windowName}-window`);
        
        if (window.style.display === 'none') {
            openWindow(windowName);
        } else if (window === activeWindow) {
            minimizeWindow(window);
        } else {
            setActiveWindow(window);
        }
    });
}

function addTaskbarItem(windowName, window) {
    // Vérifier si l'item existe déjà
    if (document.querySelector(`.taskbar-item[data-window="${windowName}"]`)) {
        return;
    }
    
    const taskbarItems = document.querySelector('.taskbar-items');
    const item = document.createElement('button');
    item.className = 'taskbar-item active';
    item.setAttribute('data-window', windowName);
    
    const icon = window.querySelector('.window-icon').cloneNode(true);
    const title = window.querySelector('.window-title').textContent.trim();
    
    const span = document.createElement('span');
    span.textContent = title;
    
    item.appendChild(icon);
    item.appendChild(span);
    
    taskbarItems.appendChild(item);
}

function removeTaskbarItem(window) {
    const windowName = window.getAttribute('data-window');
    const item = document.querySelector(`.taskbar-item[data-window="${windowName}"]`);
    item?.remove();
}

// Menu Démarrer
function initializeStartMenu() {
    const startButton = document.querySelector('.start-button');
    const startMenu = document.querySelector('.start-menu');
    const startMenuItems = document.querySelectorAll('.start-menu-item');
    
    startButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('open');
        startButton.classList.toggle('active');
    });
    
    startMenuItems?.forEach(item => {
        item.addEventListener('click', () => {
            const windowName = item.getAttribute('data-window');
            openWindow(windowName);
            startMenu.classList.remove('open');
            startButton.classList.remove('active');
        });
    });
    
    // Fermer le menu au clic ailleurs
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
            startMenu.classList.remove('open');
            startButton.classList.remove('active');
        }
    });
}

// Horloge
function initializeClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeElement = document.querySelector('.time');
    const dateElement = document.querySelector('.date');
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    
    if (timeElement) timeElement.textContent = `${hours}:${minutes}`;
    if (dateElement) dateElement.textContent = `${day}/${month}/${year}`;
}

// Thème
function initializeTheme() {
    const themeToggle = document.querySelector('.theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
    
    themeToggle?.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
    });
    
    function updateThemeIcons(theme) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
}

// Animation des compétences
function initializeSkills() {
    // Les animations se déclencheront à l'ouverture de la fenêtre
}

function animateSkills() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const masteryLevels = {
        'faible': 40,
        'moyenne': 60,
        'bonne': 77,
        'autonome': 92
    };
    
    skillBars.forEach((bar, index) => {
        const mastery = bar.getAttribute('data-mastery');
        const width = masteryLevels[mastery] || 50;
        
        setTimeout(() => {
            bar.style.width = width + '%';
        }, index * 100);
    });
}

// Formulaire de contact
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        // Simulation d'envoi
        showNotification('Message envoyé !', 'Votre message a été envoyé avec succès.', 'success');
        
        // Réinitialiser le formulaire
        contactForm.reset();
        
        console.log('Formulaire soumis:', formData);
    });
}

// Notifications
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        border-radius: 8px;
        padding: 16px 20px;
        box-shadow: var(--shadow-lg);
        min-width: 300px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-color);">${title}</div>
        <div style="font-size: 14px; color: var(--text-secondary);">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Ajouter l'animation CSS si elle n'existe pas
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Raccourcis clavier
document.addEventListener('keydown', (e) => {
    // Échap pour fermer la fenêtre active
    if (e.key === 'Escape' && activeWindow) {
        closeWindow(activeWindow);
    }
    
    // Alt + Tab pour changer de fenêtre (simulation simple)
    if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const openWindows = Array.from(document.querySelectorAll('.window'))
            .filter(w => w.style.display === 'flex');
        
        if (openWindows.length > 1) {
            const currentIndex = openWindows.indexOf(activeWindow);
            const nextIndex = (currentIndex + 1) % openWindows.length;
            setActiveWindow(openWindows[nextIndex]);
        }
    }
});

// Gestion du double-clic sur la barre de titre pour maximiser
document.querySelectorAll('.window-titlebar').forEach(titlebar => {
    titlebar.addEventListener('dblclick', (e) => {
        if (e.target === titlebar || e.target.classList.contains('window-title')) {
            const window = titlebar.closest('.window');
            toggleMaximize(window);
        }
    });
});

// Animations au survol des cartes de projet
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Effet parallaxe sur le fond d'écran
let mouseX = 0;
let mouseY = 0;
const wallpaper = document.querySelector('.wallpaper');

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
    
    if (wallpaper) {
        const moveX = (mouseX - 0.5) * 20;
        const moveY = (mouseY - 0.5) * 20;
        wallpaper.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
});

// Easter egg: Konami Code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        activateEasterEgg();
    }
});

function activateEasterEgg() {
    showNotification(
        '🎉 Code secret activé !',
        'Vous avez découvert l\'Easter Egg ! Bravo !',
        'success'
    );
    
    // Effet visuel amusant
    document.body.style.animation = 'rainbow 2s ease infinite';
    
    if (!document.querySelector('#easter-egg-styles')) {
        const style = document.createElement('style');
        style.id = 'easter-egg-styles';
        style.textContent = `
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        document.body.style.animation = '';
    }, 5000);
}

// Performances: réduire les animations si préférence utilisateur
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
}

// Log de bienvenue dans la console
console.log('%c🚀 Bienvenue sur mon Portfolio !', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cCe portfolio a été créé avec HTML, CSS et JavaScript vanilla.', 'font-size: 14px; color: #764ba2;');
console.log('%cN\'hésitez pas à explorer le code source !', 'font-size: 12px; color: #999;');

// ===== Navigation interne dans la fenêtre Projets =====
function navigateToProjectDetail(projectId) {
    // Cacher la liste des projets
    document.getElementById('projects-list').style.display = 'none';
    
    // Afficher le conteneur de détails
    document.getElementById('project-details').style.display = 'block';
    
    // Afficher la barre de navigation
    document.querySelector('.project-nav').style.display = 'flex';
    
    // Cacher tous les détails
    document.querySelectorAll('.project-detail').forEach(detail => {
        detail.style.display = 'none';
    });
    
    // Afficher le détail demandé
    const detailElement = document.getElementById(`detail-${projectId}`);
    if (detailElement) {
        detailElement.style.display = 'block';
    }
    
    // Scroll en haut de la fenêtre
    const windowContent = document.querySelector('#projects-window .window-content');
    if (windowContent) {
        windowContent.scrollTop = 0;
    }
}

function navigateToProjectList() {
    // Forcer le recalcul de l'animation en retirant puis rajoutant la classe
    const projectsList = document.getElementById('projects-list');
    projectsList.style.animation = 'none';
    
    // Afficher la liste des projets
    projectsList.style.display = 'grid';
    
    // Forcer un reflow pour redémarrer l'animation
    void projectsList.offsetWidth;
    projectsList.style.animation = 'slideInLeft 0.3s ease';
    
    // Cacher le conteneur de détails
    document.getElementById('project-details').style.display = 'none';
    
    // Cacher la barre de navigation
    document.querySelector('.project-nav').style.display = 'none';
    
    // Scroll en haut de la fenêtre
    const windowContent = document.querySelector('#projects-window .window-content');
    if (windowContent) {
        windowContent.scrollTop = 0;
    }
}

// ===== Redimensionnement des fenêtres =====
let isResizing = false;
let resizeDirection = '';
let resizeWindow = null;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let resizeStartLeft = 0;
let resizeStartTop = 0;

function addResizeHandles(window) {
    const directions = ['top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    directions.forEach(direction => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${direction}`;
        handle.addEventListener('mousedown', (e) => startResize(e, window, direction));
        window.appendChild(handle);
    });
}

function startResize(e, window, direction) {
    if (window.classList.contains('maximized')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    resizeDirection = direction;
    resizeWindow = window;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    const rect = window.getBoundingClientRect();
    resizeStartWidth = rect.width;
    resizeStartHeight = rect.height;
    resizeStartLeft = rect.left;
    resizeStartTop = rect.top;
    
    window.classList.add('resizing');
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

function handleResize(e) {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;
    
    const minWidth = 400;
    const minHeight = 300;
    
    let newWidth = resizeStartWidth;
    let newHeight = resizeStartHeight;
    let newLeft = resizeStartLeft;
    let newTop = resizeStartTop;
    
    // Gérer les différentes directions
    if (resizeDirection.includes('right')) {
        newWidth = Math.max(minWidth, resizeStartWidth + deltaX);
    }
    if (resizeDirection.includes('left')) {
        const potentialWidth = resizeStartWidth - deltaX;
        if (potentialWidth >= minWidth) {
            newWidth = potentialWidth;
            newLeft = resizeStartLeft + deltaX;
        }
    }
    if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(minHeight, resizeStartHeight + deltaY);
    }
    if (resizeDirection.includes('top')) {
        const potentialHeight = resizeStartHeight - deltaY;
        if (potentialHeight >= minHeight) {
            newHeight = potentialHeight;
            newTop = resizeStartTop + deltaY;
        }
    }
    
    resizeWindow.style.width = newWidth + 'px';
    resizeWindow.style.height = newHeight + 'px';
    resizeWindow.style.left = newLeft + 'px';
    resizeWindow.style.top = newTop + 'px';
}

function stopResize() {
    if (!isResizing) return;
    
    isResizing = false;
    resizeWindow.classList.remove('resizing');
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    resizeWindow = null;
}

// ===== Modal pour afficher les images en grand =====
function openImageModal(screenshotItem) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    
    const img = screenshotItem.querySelector('.screenshot-img');
    const caption = screenshotItem.querySelector('.screenshot-caption');
    
    modal.style.display = 'flex';
    modal.classList.add('active');
    modalImg.src = img.src;
    modalCaption.textContent = caption.textContent;
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    
    // Réactiver le scroll du body
    document.body.style.overflow = '';
}

// Fermer le modal au clic
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('image-modal');
    const closeBtn = document.querySelector('.modal-close');
    
    // Fermer avec le bouton X
    if (closeBtn) {
        closeBtn.addEventListener('click', closeImageModal);
    }
    
    // Fermer en cliquant en dehors de l'image
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
    
    // Fermer avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
});

// Système de traduction i18n
const translations = {
    fr: {
        // Icônes bureau et menu
        profile: "Profil",
        skills: "Compétences",
        projects: "Projets",
        contact: "Contact",
        
        // Profil
        "profile.subtitle": "Étudiant à l'ENSIM (École Nationale Supérieure d'Ingénieurs du Mans)<br>En alternance chez COVEA - Automatisation de tests",
        "profile.about.title": "À propos",
        "profile.about.text": "Passionné par le développement informatique et l'innovation technologique, j'ai un parcours marqué par des projets concrets réalisés tout au long de mes deux formations que ce soit en Java, avec Unity ou encore tout ce qui touche aux technologies web (HTML/CSS, PHP, JavaScript).",
        "profile.experience.title": "Parcours professionnel",
        "profile.experience.covea.date": "Août 2025 - Présent",
        "profile.experience.covea.title": "Alternance chez COVEA - Automatisation de tests",
        "profile.experience.bleez2.date": "Juillet 2025 - Août 2025",
        "profile.experience.bleez2.title": "CDD chez Bleez - Développeur de logiciel",
        "profile.experience.bleez2.desc": "Développement d'une API bancaire pour un logiciel de comptabilité",
        "profile.experience.lium.date": "Mars 2024 - Juillet 2024",
        "profile.experience.lium.title": "Stage au LIUM (Laboratoire d'Informatique de l'Université du Mans) - Ingénierie de données",
        "profile.experience.bleez1.date": "Avril 2023 - Août 2023",
        "profile.experience.bleez1.title": "Stage et CDD chez Bleez - Automatisation de tests",
        "profile.education.title": "Formations",
        "profile.education.ensim.date": "Septembre 2024 - Juin 2027",
        "profile.education.ensim.school": "ENSIM - École Nationale Supérieure d'Ingénieurs du Mans - Université du Mans, France",
        "profile.education.ensim.program": "Informatique - Formation initiale en 3e année puis alternance",
        "profile.education.iut.date": "Septembre 2021 - Juin 2024",
        "profile.education.iut.school": "IUT de Laval - Université du Mans, France",
        "profile.education.iut.program": "Parcours réalisation d'applications",
        "profile.interests.title": "Centres d'intérêt",
        "profile.interests.tag.uiux": "Design UI/UX",
        "profile.interests.tag.tech": "Nouvelles Technologies",
        "profile.interests.tag.games": "Jeux Vidéo",
        "profile.interests.tag.car": "Automobile",
        "profile.interests.tag.ai": "Intelligence Artificielle",
        
        // Compétences
        "skills.legend.title": "Légende des niveaux de maîtrise",
        "skills.level.weak": "Faible maîtrise",
        "skills.level.average": "Maîtrise moyenne",
        "skills.level.good": "Bonne maîtrise",
        "skills.level.autonomous": "Autonome",
        "skills.category.frontend": "Front-End",
        "skills.category.backend": "Back-End & Langages",
        "skills.category.tools": "Outils & Frameworks",
        
        // Projets
        "projects.title": "Mes Projets",
        "projects.list": "Liste des projets",
        "projects.tags": "Technologies",
        "projects.links": "Liens",
        "projects.button.details": "Détails",
        "projects.button.download": "Télécharger",
        "projects.button.back": "Retour aux projets",
        
        // Projets individuels
        "projects.serious-game.title": "Interface de contrôle pour jeu sérieux",
        "projects.serious-game.desc": "Réalisation d'une interface pour jeu sérieux permettant la révision des tables de multiplication. Elle est destinée aux professeurs pour régler les paramètres de jeu et voir la progression de chaque élève.",
        "projects.mastermind.title": "Réalisation d'un Mastermind",
        "projects.mastermind.desc": "Reproduction du célèbre jeu de réflexion au format numérique. Réalisé dans le cadre d'une évaluation pour observer les compétences en algorithmie et structures de données.",
        "projects.library.title": "Site web de gestion de livres d'une librairie",
        "projects.library.desc": "Gestionnaire de livres d'une librairie fictive permettant la réservation de livres en ligne. Évaluation des compétences sur les technologies web en réalisant un site dynamique.",
        "projects.toeic.title": "Site web d'entrainement au TOEIC",
        "projects.toeic.desc": "Plateforme d'entrainement à la certification d'anglais. Projet transversal visant à créer une plateforme sur laquelle les étudiants de l'ENSIM peuvent s'entrainer, réviser et se tester.",
        "projects.covea.title": "Tests Automatisés - COVEA",
        "projects.covea.desc": "Réalisation de tests automatisés pour les applications du groupe COVEA. Alternance en cours ayant pour objectifs :",
        "projects.covea.obj1": "Sécuriser les services vitaux (services essentiels au bon fonctionnement de l'entreprise)",
        "projects.covea.obj2": "Réaliser des peuplements de données",
        "projects.covea.obj3": "Réaliser les campagnes de tests automatisés selon les versions des logiciels internes",
        "projects.lium.title": "Pipeline de données - LIUM",
        "projects.lium.desc": "Réalisation d'un pipeline de données pour traiter et analyser des données vibro-acoustiques suivant différents cas d'utilisateur. Stage de 16 semaines au laboratoire LIUM.",
        "projects.bleez.title": "Tests Fonctionnels Automatisés - Bleez",
        "projects.bleez.desc": "Réalisation de tests fonctionnels automatisés (TFA) simulant le comportement d'un utilisateur sur la nouvelle interface du logiciel de comptabilité. Stage de 12 semaines chez Bleez (ex-Compta.com).",
        
        // Contact
        "contact.title": "Restons en contact",
        "contact.description": "N'hésitez pas à me contacter pour discuter de vos projets ou simplement échanger !",
        "contact.email.title": "Email",
        "contact.linkedin.title": "LinkedIn",
        "contact.github.title": "GitHub",
        "contact.github.text": "Voir profil",
        "contact.button.email": "M'envoyer un email",
        "contact.button.linkedin": "Voir mon profil LinkedIn",
        
        // Menu et barre des tâches
        "menu.user": "Mathys Geslin",
        "theme.toggle": "Changer le thème",
        "lang.toggle": "Changer la langue",
        "power.button": "Options d'alimentation",
        
        // Détail projet Jeu Sérieux
        "projects.serious-game.detail.desc-title": "Description du projet",
        "projects.serious-game.detail.desc-text": "Ce projet avait pour but de développer une interface de contrôle et de suivi de progression sur un jeu sérieux existant. Le jeu en question reprend certains codes des jeux Zelda, à savoir la résolution d'énigmes et l'obtention d'objets permettant de progresser. Avec cette interface, les professeurs peuvent regrouper par classe les élèves puis choisir pour chacun d'eux un parcours d'apprentissage.",
        "projects.serious-game.detail.features-title": "Fonctionnalités principales",
        "projects.serious-game.detail.feature1-title": "Gestion des classes",
        "projects.serious-game.detail.feature1-desc": "Organisation et regroupement des élèves par classe",
        "projects.serious-game.detail.feature2-title": "Parcours personnalisés",
        "projects.serious-game.detail.feature2-desc": "Configuration de parcours d'apprentissage individuels",
        "projects.serious-game.detail.feature3-title": "Suivi de progression",
        "projects.serious-game.detail.feature3-desc": "Visualisation détaillée des statistiques et de la progression",
        "projects.serious-game.detail.screenshots-title": "Aperçus de l'interface",
        "projects.serious-game.detail.screen1": "Liste des classes",
        "projects.serious-game.detail.screen2": "Liste des élèves",
        "projects.serious-game.detail.screen3": "Paramétrage du parcours",
        "projects.serious-game.detail.screen4": "Progression d'un élève",
        "projects.serious-game.detail.screen5": "Progression détaillée",
        "projects.serious-game.detail.screen6": "Statistiques complètes",
        "projects.serious-game.detail.confidential": "* Les captures d'écran réelles du jeu ne peuvent pas être montrées pour des raisons de confidentialité.",
        "projects.serious-game.detail.objectives-title": "Objectifs pédagogiques",
        "projects.serious-game.detail.objectives-text": "L'interface permet aux professeurs d'adapter le niveau de difficulté et de suivre la progression de chaque élève individuellement. Le jeu sérieux vise à réviser les tables de multiplication de manière ludique et engageante, en utilisant des mécaniques de jeu inspirées des jeux d'aventure classiques.",
        "projects.serious-game.detail.tech-title": "Technologies utilisées",
        "projects.serious-game.detail.tech1": "Moteur de jeu pour le développement de l'interface",
        "projects.serious-game.detail.tech2": "Langage de programmation pour la logique applicative",
        
        // Détail projet Librairie
        "projects.library.detail.context-title": "Contexte du projet",
        "projects.library.detail.context-text": "Ce projet est issu d'une évaluation dans laquelle nous devions réaliser un site web dynamique. Nous avons choisi de créer un site de gestion de livres pour une librairie fictive étant donné qu'il est nécessaire d'avoir, à minima, du PHP pour gérer les stocks de livres et la connexion de l'utilisateur en plus de l'HTML et du CSS.",
        "projects.library.detail.features-title": "Fonctionnalités principales",
        "projects.library.detail.feature1-title": "Catalogue de livres",
        "projects.library.detail.feature1-desc": "Page d'accueil affichant tous les livres disponibles ou non",
        "projects.library.detail.feature2-title": "Recherche avancée",
        "projects.library.detail.feature2-desc": "Recherche par titre d'œuvre ou par auteur",
        "projects.library.detail.feature3-title": "Système d'authentification",
        "projects.library.detail.feature3-desc": "Connexion et inscription des utilisateurs",
        "projects.library.detail.feature4-title": "Gestion de panier",
        "projects.library.detail.feature4-desc": "Réservation de livres avec mise à jour automatique de la disponibilité",
        "projects.library.detail.journey-title": "Parcours utilisateur",
        "projects.library.detail.journey1-title": "Page d'accueil",
        "projects.library.detail.journey1-desc": "Affichage de tous les livres avec leur statut de disponibilité. Possibilité de rechercher un livre spécifique.",
        "projects.library.detail.journey2-title": "Authentification",
        "projects.library.detail.journey2-desc": "Pour réserver des livres, l'utilisateur doit se connecter ou créer un compte.",
        "projects.library.detail.journey3-title": "Réservation",
        "projects.library.detail.journey3-desc": "Une fois connecté, l'utilisateur peut ajouter des livres au panier. Les livres réservés sont marqués comme \"Indisponible\".",
        "projects.library.detail.screenshots-title": "Aperçus du site",
        "projects.library.detail.screen1": "Page d'accueil du site",
        "projects.library.detail.screen2": "Résultat d'une recherche",
        "projects.library.detail.screen3": "Page de connexion",
        "projects.library.detail.screen4": "Page d'inscription",
        "projects.library.detail.tech-title": "Technologies utilisées",
        "projects.library.detail.tech1-desc": "Structure et mise en forme de l'interface utilisateur",
        "projects.library.detail.tech2-desc": "Gestion côté serveur, authentification et logique métier",
        "projects.library.detail.tech3-desc": "Gestion de la base de données (livres, utilisateurs, réservations)",
        "projects.library.detail.tech4-desc": "Gestion de version et collaboration",
        "projects.library.detail.objectives-title": "Objectifs du projet",
        "projects.library.detail.objectives-intro": "L'objectif principal était d'évaluer les compétences acquises sur les technologies web en réalisant un site dynamique complet. Ce projet a permis de mettre en pratique :",
        "projects.library.detail.objective1": "La création d'une architecture web trois tiers (présentation, logique, données)",
        "projects.library.detail.objective2": "La gestion de sessions et d'authentification utilisateur",
        "projects.library.detail.objective3": "Les opérations CRUD sur une base de données",
        "projects.library.detail.objective4": "La sécurisation des formulaires et des requêtes SQL",
        "projects.library.detail.objective5": "La gestion d'état et de disponibilité des ressources"
    },
    en: {
        // Desktop and menu icons
        profile: "Profile",
        skills: "Skills",
        projects: "Projects",
        contact: "Contact",
        
        // Profile
        "profile.subtitle": "Student at ENSIM (National School of Engineering of Le Mans)<br>Working at COVEA - Test Automation",
        "profile.about.title": "About",
        "profile.about.text": "Passionate about software development and technological innovation, I have a background marked by concrete projects carried out throughout my two training programs, whether in Java, with Unity or everything related to web technologies (HTML/CSS, PHP, JavaScript).",
        "profile.experience.title": "Professional Experience",
        "profile.experience.covea.date": "August 2025 - Present",
        "profile.experience.covea.title": "Apprenticeship at COVEA - Test Automation",
        "profile.experience.bleez2.date": "July 2025 - August 2025",
        "profile.experience.bleez2.title": "Fixed-term contract at Bleez - Software Developer",
        "profile.experience.bleez2.desc": "Development of a banking API for accounting software",
        "profile.experience.lium.date": "March 2024 - July 2024",
        "profile.experience.lium.title": "Internship at LIUM (Computer Science Laboratory of Le Mans University) - Data Engineering",
        "profile.experience.bleez1.date": "April 2023 - August 2023",
        "profile.experience.bleez1.title": "Internship and Fixed-term contract at Bleez - Test Automation",
        "profile.education.title": "Education",
        "profile.education.ensim.date": "September 2024 - June 2027",
        "profile.education.ensim.school": "ENSIM - National School of Engineering of Le Mans - Le Mans University, France",
        "profile.education.ensim.program": "Computer Science - Initial training in 3rd year then apprenticeship",
        "profile.education.iut.date": "September 2021 - June 2024",
        "profile.education.iut.school": "IUT of Laval - Le Mans University, France",
        "profile.education.iut.program": "Application development track",
        "profile.interests.title": "Interests",
        "profile.interests.tag.uiux": "UI/UX Design",
        "profile.interests.tag.tech": "New Technologies",
        "profile.interests.tag.games": "Video Games",
        "profile.interests.tag.car": "Automotive",
        "profile.interests.tag.ai": "Artificial Intelligence",
        
        // Skills
        "skills.legend.title": "Mastery Levels Legend",
        "skills.level.weak": "Basic knowledge",
        "skills.level.average": "Average mastery",
        "skills.level.good": "Good mastery",
        "skills.level.autonomous": "Autonomous",
        "skills.category.frontend": "Front-End",
        "skills.category.backend": "Back-End & Languages",
        "skills.category.tools": "Tools & Frameworks",
        
        // Projects
        "projects.title": "My Projects",
        "projects.list": "Projects list",
        "projects.tags": "Technologies",
        "projects.links": "Links",
        "projects.button.details": "Details",
        "projects.button.download": "Download",
        "projects.button.back": "Back to projects",
        
        // Individual projects
        "projects.serious-game.title": "Control Interface for Serious Game",
        "projects.serious-game.desc": "Development of an interface for a serious game enabling multiplication tables practice. It is designed for teachers to configure game settings and monitor each student's progress.",
        "projects.mastermind.title": "Mastermind Game Implementation",
        "projects.mastermind.desc": "Digital reproduction of the famous logic game. Developed as part of an evaluation to demonstrate skills in algorithms and data structures.",
        "projects.library.title": "Bookstore Management Website",
        "projects.library.desc": "Book management system for a fictional bookstore enabling online book reservations. Assessment of web technology skills by creating a dynamic website.",
        "projects.toeic.title": "TOEIC Training Website",
        "projects.toeic.desc": "English certification training platform. Cross-functional project aimed at creating a platform where ENSIM students can train, review and test themselves.",
        "projects.covea.title": "Automated Testing - COVEA",
        "projects.covea.desc": "Development of automated tests for COVEA group applications. Ongoing apprenticeship with the following objectives:",
        "projects.covea.obj1": "Secure vital services (essential services for company operations)",
        "projects.covea.obj2": "Perform data population",
        "projects.covea.obj3": "Execute automated test campaigns according to internal software versions",
        "projects.lium.title": "Data Pipeline - LIUM",
        "projects.lium.desc": "Development of a data pipeline to process and analyze vibro-acoustic data for different user cases. 16-week internship at LIUM laboratory.",
        "projects.bleez.title": "Automated Functional Testing - Bleez",
        "projects.bleez.desc": "Development of automated functional tests (AFT) simulating user behavior on the new accounting software interface. 12-week internship at Bleez (formerly Compta.com).",
        
        // Contact
        "contact.title": "Let's stay in touch",
        "contact.description": "Feel free to contact me to discuss your projects or simply to exchange!",
        "contact.email.title": "Email",
        "contact.linkedin.title": "LinkedIn",
        "contact.github.title": "GitHub",
        "contact.github.text": "View profile",
        "contact.button.email": "Send me an email",
        "contact.button.linkedin": "View my LinkedIn profile",
        
        // Menu and taskbar
        "menu.user": "Mathys Geslin",
        "theme.toggle": "Change theme",
        "lang.toggle": "Change language",
        "power.button": "Power options",
        
        // Serious Game project detail
        "projects.serious-game.detail.desc-title": "Project Description",
        "projects.serious-game.detail.desc-text": "This project aimed to develop a control and progress tracking interface for an existing serious game. The game adopts certain codes from Zelda games, namely puzzle solving and obtaining items to progress. With this interface, teachers can group students by class and choose a learning path for each of them.",
        "projects.serious-game.detail.features-title": "Main Features",
        "projects.serious-game.detail.feature1-title": "Class Management",
        "projects.serious-game.detail.feature1-desc": "Organization and grouping of students by class",
        "projects.serious-game.detail.feature2-title": "Personalized Paths",
        "projects.serious-game.detail.feature2-desc": "Configuration of individual learning paths",
        "projects.serious-game.detail.feature3-title": "Progress Tracking",
        "projects.serious-game.detail.feature3-desc": "Detailed visualization of statistics and progress",
        "projects.serious-game.detail.screenshots-title": "Interface Preview",
        "projects.serious-game.detail.screen1": "Class list",
        "projects.serious-game.detail.screen2": "Student list",
        "projects.serious-game.detail.screen3": "Path configuration",
        "projects.serious-game.detail.screen4": "Student progress",
        "projects.serious-game.detail.screen5": "Detailed progress",
        "projects.serious-game.detail.screen6": "Complete statistics",
        "projects.serious-game.detail.confidential": "* Actual game screenshots cannot be shown for confidentiality reasons.",
        "projects.serious-game.detail.objectives-title": "Educational Objectives",
        "projects.serious-game.detail.objectives-text": "The interface allows teachers to adapt the difficulty level and track each student's progress individually. The serious game aims to review multiplication tables in a fun and engaging way, using game mechanics inspired by classic adventure games.",
        "projects.serious-game.detail.tech-title": "Technologies Used",
        "projects.serious-game.detail.tech1": "Game engine for interface development",
        "projects.serious-game.detail.tech2": "Programming language for application logic",
        
        // Library project detail
        "projects.library.detail.context-title": "Project Context",
        "projects.library.detail.context-text": "This project came from an assessment in which we had to create a dynamic website. We chose to create a book management site for a fictional bookstore since it requires, at minimum, PHP to manage book inventory and user login in addition to HTML and CSS.",
        "projects.library.detail.features-title": "Main Features",
        "projects.library.detail.feature1-title": "Book Catalog",
        "projects.library.detail.feature1-desc": "Homepage displaying all available or unavailable books",
        "projects.library.detail.feature2-title": "Advanced Search",
        "projects.library.detail.feature2-desc": "Search by work title or author",
        "projects.library.detail.feature3-title": "Authentication System",
        "projects.library.detail.feature3-desc": "User login and registration",
        "projects.library.detail.feature4-title": "Cart Management",
        "projects.library.detail.feature4-desc": "Book reservation with automatic availability update",
        "projects.library.detail.journey-title": "User Journey",
        "projects.library.detail.journey1-title": "Homepage",
        "projects.library.detail.journey1-desc": "Display of all books with their availability status. Ability to search for a specific book.",
        "projects.library.detail.journey2-title": "Authentication",
        "projects.library.detail.journey2-desc": "To reserve books, users must log in or create an account.",
        "projects.library.detail.journey3-title": "Reservation",
        "projects.library.detail.journey3-desc": "Once logged in, users can add books to the cart. Reserved books are marked as \"Unavailable\".",
        "projects.library.detail.screenshots-title": "Website Preview",
        "projects.library.detail.screen1": "Website homepage",
        "projects.library.detail.screen2": "Search result",
        "projects.library.detail.screen3": "Login page",
        "projects.library.detail.screen4": "Registration page",
        "projects.library.detail.tech-title": "Technologies Used",
        "projects.library.detail.tech1-desc": "User interface structure and styling",
        "projects.library.detail.tech2-desc": "Server-side management, authentication and business logic",
        "projects.library.detail.tech3-desc": "Database management (books, users, reservations)",
        "projects.library.detail.tech4-desc": "Version control and collaboration",
        "projects.library.detail.objectives-title": "Project Objectives",
        "projects.library.detail.objectives-intro": "The main objective was to evaluate the skills acquired in web technologies by creating a complete dynamic website. This project allowed to put into practice:",
        "projects.library.detail.objective1": "Creating a three-tier web architecture (presentation, logic, data)",
        "projects.library.detail.objective2": "Session management and user authentication",
        "projects.library.detail.objective3": "CRUD operations on a database",
        "projects.library.detail.objective4": "Securing forms and SQL queries",
        "projects.library.detail.objective5": "Resource state and availability management"
    }
};

let currentLang = 'fr';

// Initialiser le système de langue
function initializeLanguage() {
    // Charger la langue sauvegardée ou utiliser le français par défaut
    const savedLang = localStorage.getItem('language') || 'fr';
    currentLang = savedLang;
    
    // Configurer le bouton de langue
    const langToggle = document.querySelector('.lang-toggle');
    if (langToggle) {
        updateLanguageButton();
        langToggle.addEventListener('click', toggleLanguage);
    }
    
    // Appliquer la langue
    applyLanguage(currentLang);
}

// Changer de langue
function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    localStorage.setItem('language', currentLang);
    applyLanguage(currentLang);
    updateLanguageButton();
}

// Mettre à jour le bouton de langue
function updateLanguageButton() {
    const langToggle = document.querySelector('.lang-toggle');
    const flagIcon = langToggle?.querySelector('.flag-icon');
    
    if (flagIcon) {
        flagIcon.textContent = currentLang === 'fr' ? '🇫🇷' : '🇬🇧';
    }
    
    if (langToggle) {
        langToggle.title = translations[currentLang]['lang.toggle'];
    }
}

// Appliquer les traductions
function applyLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang][key];
        
        if (translation) {
            // Si l'élément contient du HTML (balises br, span, etc.), utiliser innerHTML
            if (translation.includes('<br>') || translation.includes('<')) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Traduire les skill-level
    const skillLevels = document.querySelectorAll('.skill-level');
    const levelMap = {
        'fr': {
            'Faible maîtrise': 'Faible maîtrise',
            'Maîtrise moyenne': 'Maîtrise moyenne',
            'Bonne maîtrise': 'Bonne maîtrise',
            'Autonome': 'Autonome',
            'Basic knowledge': 'Faible maîtrise',
            'Average mastery': 'Maîtrise moyenne',
            'Good mastery': 'Bonne maîtrise',
            'Autonomous': 'Autonome'
        },
        'en': {
            'Faible maîtrise': 'Basic knowledge',
            'Maîtrise moyenne': 'Average mastery',
            'Bonne maîtrise': 'Good mastery',
            'Autonome': 'Autonomous',
            'Basic knowledge': 'Basic knowledge',
            'Average mastery': 'Average mastery',
            'Good mastery': 'Good mastery',
            'Autonomous': 'Autonomous'
        }
    };
    
    skillLevels.forEach(level => {
        const currentText = level.textContent.trim();
        const newText = levelMap[lang][currentText];
        if (newText) {
            level.textContent = newText;
        }
    });
    
    // Mettre à jour l'attribut lang du HTML
    document.documentElement.lang = lang;
    
    // Mettre à jour les titres des boutons
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.title = translations[lang]['theme.toggle'];
    }
    
    const powerButton = document.querySelector('.power-button');
    if (powerButton) {
        powerButton.title = translations[lang]['power.button'];
    }
}

