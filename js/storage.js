/**
 * Storage Module - Paint Canvas Retro
 * Handles saving, loading, listing, and deleting canvas projects in localStorage.
 */
window.Paint = window.Paint || {};

window.Paint.Storage = (function () {
    const STORAGE_KEY = 'paint_canvas_retro_files';
    const ACTIVE_KEY = 'paint_canvas_retro_active_id';

    /**
     * Retrieves all saved project records from localStorage sorted by updatedAt descending.
     * @returns {Array} Array of project objects
     */
    function listProjects() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const list = JSON.parse(raw);
            return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
        } catch (e) {
            console.error('Error reading projects from localStorage:', e);
            return [];
        }
    }

    /**
     * Gets a single project by ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    function getProject(id) {
        const projects = listProjects();
        return projects.find(p => p.id === id) || null;
    }

    /**
     * Saves a canvas project to localStorage.
     * @param {HTMLCanvasElement} canvas 
     * @param {string} title 
     * @param {string|null} existingId 
     * @returns {Object} Saved project object
     */
    function saveProject(canvas, title = 'Sin título.png', existingId = null) {
        if (!canvas) return null;

        const projects = listProjects();
        const id = existingId || `proj_${Date.now()}`;
        const cleanTitle = (title && title.trim()) ? title.trim() : 'Sin título.png';
        const dataUrl = canvas.toDataURL('image/png');

        const projectData = {
            id: id,
            title: cleanTitle,
            width: canvas.width,
            height: canvas.height,
            dataUrl: dataUrl,
            updatedAt: Date.now()
        };

        const existingIdx = projects.findIndex(p => p.id === id);
        if (existingIdx >= 0) {
            projects[existingIdx] = projectData;
        } else {
            projects.unshift(projectData);
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            setActiveProjectId(id);
            return projectData;
        } catch (e) {
            console.error('Error saving project to localStorage:', e);
            // Handle quota exceeded gracefully
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                if (window.Paint && window.Paint.Modal) {
                    window.Paint.Modal.alert(
                        'El almacenamiento de LocalStorage está lleno. Elimine algunos proyectos antiguos para guardar este dibujo.',
                        'Error de Almacenamiento'
                    );
                }
            }
            return null;
        }
    }

    /**
     * Deletes a project by ID from localStorage.
     * @param {string} id 
     * @returns {boolean} Success status
     */
    function deleteProject(id) {
        let projects = listProjects();
        const initialCount = projects.length;
        projects = projects.filter(p => p.id !== id);

        if (projects.length !== initialCount) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
                if (getActiveProjectId() === id) {
                    const remaining = projects[0];
                    setActiveProjectId(remaining ? remaining.id : null);
                }
                return true;
            } catch (e) {
                console.error('Error deleting project from localStorage:', e);
            }
        }
        return false;
    }

    /**
     * Gets the current active project ID.
     */
    function getActiveProjectId() {
        return localStorage.getItem(ACTIVE_KEY) || null;
    }

    /**
     * Sets the active project ID in localStorage.
     */
    function setActiveProjectId(id) {
        if (id) {
            localStorage.setItem(ACTIVE_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_KEY);
        }
    }

    /**
     * Loads a project into the canvas object.
     * @param {Object} project 
     * @param {Object} CanvasModule 
     * @returns {Promise<boolean>}
     */
    function loadProject(project, CanvasModule) {
        return new Promise((resolve) => {
            if (!project || !project.dataUrl || !CanvasModule) {
                resolve(false);
                return;
            }

            const img = new Image();
            img.onload = () => {
                // Resize canvas to match project dimensions
                CanvasModule.resize(project.width || img.width, project.height || img.height);
                const ctx = CanvasModule.getContext();
                if (ctx) {
                    ctx.clearRect(0, 0, project.width, project.height);
                    ctx.drawImage(img, 0, 0);
                    CanvasModule.saveHistory();
                }
                setActiveProjectId(project.id);
                resolve(true);
            };
            img.onerror = () => resolve(false);
            img.src = project.dataUrl;
        });
    }

    return {
        listProjects,
        getProject,
        saveProject,
        deleteProject,
        getActiveProjectId,
        setActiveProjectId,
        loadProject
    };
})();
