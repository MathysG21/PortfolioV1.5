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

