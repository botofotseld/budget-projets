/**
 * AttachmentService - Offline image storage for project sub-groups.
 * Images are compressed before being stored in IndexedDB so localStorage
 * remains reserved for the application's structured data.
 */
const AttachmentService = {
    DB_NAME: "budgetProjetsMediaV1",
    STORE_NAME: "attachments",
    MAX_FILE_SIZE: 25 * 1024 * 1024,
    MAX_IMAGE_EDGE: 1600,
    JPEG_QUALITY: 0.82,
    _dbPromise: null,
    _galleryUrls: new Map(),
    _previewUrl: null,

    openDatabase() {
        if (this._dbPromise) return this._dbPromise;
        this._dbPromise = new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                reject(new Error("Le stockage de photos n'est pas disponible sur cet appareil."));
                return;
            }

            const request = indexedDB.open(this.DB_NAME, 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (db.objectStoreNames.contains(this.STORE_NAME)) return;
                const store = db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
                store.createIndex("projectId", "projectId", { unique: false });
                store.createIndex("scope", ["projectId", "tabId"], { unique: false });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Impossible d'ouvrir le stockage des photos."));
        });
        return this._dbPromise;
    },

    async _request(mode, operation) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, mode);
            const store = transaction.objectStore(this.STORE_NAME);
            let request;
            try {
                request = operation(store);
            } catch (error) {
                reject(error);
                return;
            }
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || transaction.error);
        });
    },

    _loadImage(file) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                URL.revokeObjectURL(url);
                resolve(image);
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Cette image ne peut pas être lue."));
            };
            image.src = url;
        });
    },

    async _prepareImage(file) {
        if (!file || !String(file.type || "").startsWith("image/")) {
            throw new Error("Sélectionnez uniquement des images.");
        }
        if (file.size > this.MAX_FILE_SIZE) {
            throw new Error(`L'image « ${file.name} » est trop volumineuse.`);
        }

        try {
            const image = await this._loadImage(file);
            const largestEdge = Math.max(image.naturalWidth, image.naturalHeight);
            const ratio = Math.min(1, this.MAX_IMAGE_EDGE / largestEdge);
            const width = Math.max(1, Math.round(image.naturalWidth * ratio));
            const height = Math.max(1, Math.round(image.naturalHeight * ratio));
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0, width, height);

            const compressed = await new Promise(resolve => {
                canvas.toBlob(resolve, "image/jpeg", this.JPEG_QUALITY);
            });
            return compressed || file;
        } catch (error) {
            // Some phone formats (for example HEIC) cannot be drawn to a canvas
            // by every browser. Keeping the original still allows compatible
            // devices to store and display it.
            console.warn("Image compression skipped", error);
            return file;
        }
    },

    async addFiles(projectId, tabId, files, caption = "") {
        const list = Array.from(files || []);
        if (!projectId || !tabId || !list.length) return [];

        const saved = [];
        for (const file of list) {
            const blob = await this._prepareImage(file);
            const record = {
                id: uid(),
                projectId: String(projectId),
                tabId: String(tabId),
                caption: caption.trim() || file.name || "Photo",
                fileName: file.name || "photo.jpg",
                type: blob.type || file.type || "image/jpeg",
                size: blob.size,
                createdAt: new Date().toISOString(),
                blob
            };
            await this._request("readwrite", store => store.put(record));
            saved.push(record);
        }
        return saved;
    },

    get(id) {
        return this._request("readonly", store => store.get(id));
    },

    getAll() {
        return this._request("readonly", store => store.getAll());
    },

    async getByScope(projectId, tabId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, "readonly");
            const index = transaction.objectStore(this.STORE_NAME).index("scope");
            const request = index.getAll(IDBKeyRange.only([String(projectId), String(tabId)]));
            request.onsuccess = () => resolve((request.result || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            request.onerror = () => reject(request.error || transaction.error);
        });
    },

    remove(id) {
        return this._request("readwrite", store => store.delete(id));
    },

    async deleteByProject(projectId) {
        const records = (await this.getAll()).filter(item => item.projectId === String(projectId));
        for (const record of records) await this.remove(record.id);
    },

    async clear() {
        await this._request("readwrite", store => store.clear());
        this.releaseGalleryUrls();
        this.closePreview();
    },

    _escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    },

    releaseGalleryUrls() {
        this._galleryUrls.forEach(urls => urls.forEach(url => URL.revokeObjectURL(url)));
        this._galleryUrls.clear();
    },

    async renderGallery(projectId, tabId) {
        const galleryId = `photoGallery_${projectId}_${tabId}`;
        const gallery = document.getElementById(galleryId);
        if (!gallery) return;

        const oldUrls = this._galleryUrls.get(galleryId) || [];
        oldUrls.forEach(url => URL.revokeObjectURL(url));
        this._galleryUrls.delete(galleryId);

        try {
            const records = await this.getByScope(projectId, tabId);
            if (!document.getElementById(galleryId)) return;
            if (!records.length) {
                gallery.innerHTML = '<div class="photo-empty">Aucune photo dans ce sous-groupe.</div>';
                return;
            }

            const urls = [];
            gallery.innerHTML = records.map(record => {
                const url = URL.createObjectURL(record.blob);
                urls.push(url);
                const date = new Date(record.createdAt).toLocaleDateString("fr-FR");
                return `
                    <figure class="photo-card">
                        <button type="button" class="photo-open" data-action="open-attachment" data-attachment-id="${record.id}" aria-label="Agrandir ${this._escape(record.caption)}">
                            <img src="${url}" alt="${this._escape(record.caption)}" loading="lazy" />
                        </button>
                        <figcaption>
                            <strong>${this._escape(record.caption)}</strong>
                            <small>${date}</small>
                            <button type="button" class="link-btn danger" data-action="delete-attachment" data-attachment-id="${record.id}" data-project-id="${record.projectId}" data-tab-id="${record.tabId}">Supprimer</button>
                        </figcaption>
                    </figure>`;
            }).join("");
            this._galleryUrls.set(galleryId, urls);
        } catch (error) {
            console.error("Photo gallery error", error);
            gallery.innerHTML = '<div class="alert danger">Impossible de charger les photos sur cet appareil.</div>';
        }
    },

    async handleInput(input) {
        const files = Array.from(input.files || []);
        if (!files.length) return;
        const projectId = input.dataset.projectId;
        const tabId = input.dataset.tabId;
        const captionInput = document.getElementById(`photoCaption_${projectId}_${tabId}`);
        const status = document.getElementById(`photoStatus_${projectId}_${tabId}`);

        input.disabled = true;
        if (status) status.textContent = files.length > 1 ? "Ajout des photos…" : "Ajout de la photo…";
        try {
            await this.addFiles(projectId, tabId, files, captionInput?.value || "");
            if (captionInput) captionInput.value = "";
            input.value = "";
            if (status) status.textContent = files.length > 1 ? `${files.length} photos ajoutées.` : "Photo ajoutée.";
            await this.renderGallery(projectId, tabId);
        } catch (error) {
            console.error("Photo add error", error);
            if (status) status.textContent = "";
            alert(error.message || "Impossible d'ajouter cette photo.");
        } finally {
            input.disabled = false;
        }
    },

    async deleteAttachment(id, projectId, tabId) {
        if (!confirm("Supprimer définitivement cette photo ?")) return;
        await this.remove(id);
        await this.renderGallery(projectId, tabId);
    },

    async openPreview(id) {
        const record = await this.get(id);
        if (!record) return;
        this.closePreview();
        const dialog = document.getElementById("attachmentPreview");
        const image = document.getElementById("attachmentPreviewImage");
        const caption = document.getElementById("attachmentPreviewCaption");
        if (!dialog || !image || !caption) return;
        this._previewUrl = URL.createObjectURL(record.blob);
        image.src = this._previewUrl;
        image.alt = record.caption || "Photo du projet";
        caption.textContent = record.caption || record.fileName || "Photo";
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
    },

    closePreview() {
        const dialog = document.getElementById("attachmentPreview");
        const image = document.getElementById("attachmentPreviewImage");
        if (dialog?.open && typeof dialog.close === "function") dialog.close();
        else dialog?.removeAttribute("open");
        if (image) image.removeAttribute("src");
        if (this._previewUrl) URL.revokeObjectURL(this._previewUrl);
        this._previewUrl = null;
    },

    _blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    },

    _dataUrlToBlob(dataUrl) {
        const [header, body] = String(dataUrl).split(",");
        const mime = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
        const bytes = atob(body || "");
        const output = new Uint8Array(bytes.length);
        for (let index = 0; index < bytes.length; index += 1) output[index] = bytes.charCodeAt(index);
        return new Blob([output], { type: mime });
    },

    async exportAll() {
        const records = await this.getAll();
        return Promise.all(records.map(async ({ blob, ...metadata }) => ({
            ...metadata,
            dataUrl: await this._blobToDataUrl(blob)
        })));
    },

    async replaceAll(records = []) {
        await this.clear();
        for (const item of records) {
            if (!item?.id || !item?.dataUrl) continue;
            const blob = this._dataUrlToBlob(item.dataUrl);
            await this._request("readwrite", store => store.put({
                ...item,
                projectId: String(item.projectId),
                tabId: String(item.tabId),
                type: item.type || blob.type,
                size: item.size || blob.size,
                blob,
                dataUrl: undefined
            }));
        }
    }
};
