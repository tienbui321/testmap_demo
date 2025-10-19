/**
 * @file planning-manager.js
 * @description Manages the Leaflet controls for switching map types and planning overlays.
 */
const PlanningManager = {
    map: null,
    tileLayers: null,
    activePlanningLayer: null,
    currentMapMode: 'traffic',

    /**
     * Initializes the PlanningManager.
     * @param {L.Map} map - The Leaflet map instance.
     * @param {object} tileLayers - An object containing all tile layer instances.
     */
    init: function(map, tileLayers) {
        this.map = map;
        this.tileLayers = tileLayers;
        this._createControls();
        this.updateBasemap();
    },

    /**
     * Updates the base map layer (traffic or satellite).
     */
    updateBasemap: function() {
        if (this.currentMapMode === 'satellite') {
            if (!this.map.hasLayer(this.tileLayers.satellite)) this.map.addLayer(this.tileLayers.satellite);
            if (this.map.hasLayer(this.tileLayers.traffic)) this.map.removeLayer(this.tileLayers.traffic);
        } else { // Default to traffic
            if (!this.map.hasLayer(this.tileLayers.traffic)) this.map.addLayer(this.tileLayers.traffic);
            if (this.map.hasLayer(this.tileLayers.satellite)) this.map.removeLayer(this.tileLayers.satellite);
        }
    },

    /**
     * Creates and adds all custom controls to the map.
     * @private
     */
    _createControls: function() {
        const createCustomControl = (options) => {
            return L.Control.extend({
                onAdd: (map) => {
                    const container = L.DomUtil.create('div', 'leaflet-control-custom-button');
                    container.style.position = 'relative';

                    container.innerHTML = `
                        <div id="${options.id}-options" class="custom-options-popup">
                            ${options.buttons.map(btn => `<button data-key="${btn.key}">${btn.text}</button>`).join('')}
                        </div>
                        <a id="${options.id}-btn" href="#" title="${options.title}">
                            <i data-lucide="${options.icon}" class="w-4 h-4"></i>
                            <span id="${options.id}-text">${options.defaultText}</span>
                        </a>
                    `;

                    L.DomEvent.disableClickPropagation(container);
                    
                    const optionsContainer = container.querySelector(`#${options.id}-options`);
                    L.DomEvent.on(optionsContainer, 'click', (e) => {
                        if (e.target.tagName === 'BUTTON') {
                            options.callback(e.target.dataset.key);
                        }
                    });
                    
                    setTimeout(() => lucide.createIcons(), 0);
                    return container;
                },
                onRemove: function(map) {}
            });
        };

        const MapTypeControl = createCustomControl({
            id: 'map-type',
            icon: 'map',
            title: 'Chọn loại bản đồ',
            defaultText: 'Bản đồ',
            buttons: [
                { key: 'traffic', text: 'Giao thông' },
                { key: 'satellite', text: 'Vệ tinh' }
            ],
            callback: (key) => {
                this.currentMapMode = key;
                this.updateBasemap();
            }
        });

        const PlanningControl = createCustomControl({
            id: 'planning',
            icon: 'square-asterisk',
            title: 'Xem quy hoạch',
            defaultText: 'Quy hoạch',
            buttons: [
                { key: 'qhsdd', text: 'Quy hoạch sử dụng đất' },
                { key: 'khsdd', text: 'Kế hoạch sử dụng đất' },
                { key: 'off', text: 'Tắt' }
            ],
            callback: (key) => this._togglePlanningLayer(key)
        });

        new PlanningControl({ position: 'bottomright' }).addTo(this.map);
        new MapTypeControl({ position: 'bottomright' }).addTo(this.map);
    },

    /**
     * Toggles the visibility and opacity of planning layers.
     * @private
     * @param {string} key - The key of the planning layer to toggle.
     */
    _togglePlanningLayer: function(key) {
        const opacityContainer = document.getElementById('opacity-slider-container');
        
        document.querySelectorAll('#planning-options button').forEach(btn => btn.classList.remove('active'));
        
        if (this.activePlanningLayer) {
            const oldPaneName = this.activePlanningLayer.options.pane;
            if(oldPaneName) {
                const oldPane = this.map.getPane(oldPaneName);
                if(oldPane) oldPane.style.opacity = 1;
            }
            this.map.removeLayer(this.activePlanningLayer);
            this.activePlanningLayer = null;
        }

        if (key !== 'off') {
            this.activePlanningLayer = this.tileLayers[key];
            this.map.addLayer(this.activePlanningLayer);
            document.querySelector(`#planning-options button[data-key="${key}"]`).classList.add('active');

            if (opacityContainer) {
                opacityContainer.style.display = 'block';
                const slider = opacityContainer.querySelector('.opacity-slider');
                slider.value = 1;
                
                const setOpacity = (value) => {
                     if (typeof this.activePlanningLayer.setOpacity === 'function') {
                        this.activePlanningLayer.setOpacity(value);
                    } else {
                        const paneName = this.activePlanningLayer.options.pane;
                        if (paneName) {
                            const pane = this.map.getPane(paneName);
                            if (pane) pane.style.opacity = value;
                        }
                    }
                };
                
                setOpacity(1);
                slider.oninput = () => setOpacity(slider.value);
            }
        } else {
            if (opacityContainer) {
                opacityContainer.style.display = 'none';
            }
        }
    }
};
