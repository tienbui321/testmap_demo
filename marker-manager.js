/**
 * @file marker-manager.js
 * @description Manages the creation, clustering, and interaction of property markers on the Leaflet map.
 */
const MarkerManager = {
    map: null,
    markerLayer: null,
    markersById: {},
    onMarkerInteractionCallback: null,
    onPopupClickCallback: null,
    
    /**
     * Initializes the MarkerManager.
     * @param {L.Map} map - The Leaflet map instance.
     * @param {function} onMarkerInteraction - Callback for marker interactions (click, mouseover).
     * @param {function} onPopupClick - Callback for when the popup content is clicked.
     */
    init: function(map, onMarkerInteraction, onPopupClick) {
        this.map = map;
        this.onMarkerInteractionCallback = onMarkerInteraction;
        this.onPopupClickCallback = onPopupClick;
        this.markerLayer = L.layerGroup().addTo(this.map);
    },

    /**
     * Updates markers on the map based on the provided properties.
     * @param {Array} properties - An array of property objects to display.
     */
    update: function(properties) {
        this.markerLayer.clearLayers();
        this.markersById = {};

        // Simple distance-based clustering
        const CLUSTER_RADIUS = 60;
        let unclustered = [...properties];

        while (unclustered.length > 0) {
            let baseProp = unclustered.shift();
            let cluster = [baseProp];
            let remaining = [];
            let basePoint = this.map.latLngToContainerPoint(L.latLng(baseProp.lat, baseProp.lng));

            unclustered.forEach(otherProp => {
                let otherPoint = this.map.latLngToContainerPoint(L.latLng(otherProp.lat, otherProp.lng));
                if (basePoint.distanceTo(otherPoint) < CLUSTER_RADIUS) {
                    cluster.push(otherProp);
                } else {
                    remaining.push(otherProp);
                }
            });
            
            unclustered = remaining;

            const representativeProp = cluster.reduce((min, p) => (p.priceValue < min.priceValue ? p : min), cluster[0]);
            const clusterIds = cluster.map(p => p.id);
            
            const marker = this._createMarker(representativeProp, clusterIds);
            
            clusterIds.forEach(id => { this.markersById[id] = marker; });
            this.markerLayer.addLayer(marker);
        }
    },

    /**
     * Highlights a specific marker on the map.
     * @param {Array<number>|null} ids - An array of property IDs to highlight. Pass null to clear highlights.
     */
    highlight: function(ids) {
        document.querySelectorAll('.price-marker.highlight').forEach(m => m.classList.remove('highlight'));
        if (!ids || ids.length === 0) return;
        
        const marker = this.markersById[ids[0]];
        if (marker && marker._icon) {
            const markerEl = marker._icon.querySelector('.price-marker');
            if (markerEl) {
                markerEl.classList.add('highlight');
            }
        }
    },

    /**
     * Creates a single Leaflet marker.
     * @private
     * @param {object} prop - The representative property for the marker.
     * @param {Array<number>} clusterIds - The IDs of all properties in the cluster.
     * @returns {L.Marker} The created Leaflet marker.
     */
    _createMarker: function(prop, clusterIds) {
        const formattedPrice = this._formatPriceForMarker(prop.priceValue);
        const certificateIcon = prop.hasVerified
            ? `<div class="certificate-badge" title="Chứng chỉ an toàn pháp lý"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></div>`
            : '';
        const iconHtml = `<div class="price-marker">${certificateIcon}${formattedPrice}</div>`;
        const marker = L.marker([prop.lat, prop.lng], { 
            icon: L.divIcon({ html: iconHtml, className: `marker-div-icon`, iconSize: null }) 
        });

        const infoParts = [prop.bedrooms, prop.bathrooms ? `${prop.bathrooms} WC` : null, prop.area].filter(Boolean).join(', ');
        const popupContent = `<div class="property-popup cursor-pointer" data-id="${prop.id}"><img src="${prop.thumbnail || 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'}" alt="Property Image" class="w-full h-32 object-cover"><div class="info"><p class="font-bold text-blue-700 truncate">${prop.price || ''}</p><p class="text-xs text-slate-600">${infoParts}</p></div></div>`;
            
        marker.bindPopup(popupContent, { closeButton: false, minWidth: 250 });

        marker.on('mouseover', () => this.onMarkerInteractionCallback(clusterIds, true)); // isMouseover = true
        marker.on('mouseout', () => this.onMarkerInteractionCallback(null, true));
        marker.on('click', () => this.onMarkerInteractionCallback(clusterIds, false)); // isMouseover = false

        marker.on('popupopen', () => {
            const popupEl = marker.getPopup().getElement();
            if (popupEl) {
                const contentWrapper = popupEl.querySelector('.property-popup');
                if (contentWrapper) {
                    contentWrapper.onclick = (e) => {
                        e.preventDefault();
                        const propId = parseInt(contentWrapper.dataset.id, 10);
                        if (!isNaN(propId)) {
                            this.onPopupClickCallback(propId);
                        }
                    };
                }
            }
        });
        
        return marker;
    },

    /**
     * Formats a numeric price value into a display string (e.g., "1.5 TỶ").
     * @private
     * @param {number} priceValue - The price in millions.
     * @returns {string} The formatted price string.
     */
    _formatPriceForMarker: function(priceValue) {
        if (priceValue === null || isNaN(priceValue)) return '';
        if (priceValue === -1) return 'THỎA THUẬN';
        if (priceValue >= 1000) {
            const ty = priceValue / 1000;
            return ty.toLocaleString('vi-VN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1
            }) + ' TỶ';
        } else {
            return priceValue.toLocaleString('vi-VN') + ' TR';
        }
    }
};
