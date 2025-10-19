/**
 * @file utility-manager.js
 * @description Manages fetching, displaying, and filtering map utility layers (schools, hospitals, etc.).
 */
const UtilityManager = {
    map: null,
    utilityConfig: {
        school: { name: 'Trường học', url: 'https://raw.githubusercontent.com/tienbui321/testmap_demo/main/truonghoc.json', icon: 'graduation-cap', color: 'bg-blue-500' },
        hospital: { name: 'Bệnh viện', url: 'https://raw.githubusercontent.com/tienbui321/testmap_demo/main/benhvien.json', icon: 'hospital', color: 'bg-red-500' },
        supermarket: { name: 'Siêu thị', url: 'https://raw.githubusercontent.com/tienbui321/testmap_demo/main/sieuthi.json', icon: 'shopping-cart', color: 'bg-green-500' },
        restaurant: { name: 'Nhà hàng', url: 'https://raw.githubusercontent.com/tienbui321/testmap_demo/main/nhahang.json', icon: 'utensils-crossed', color: 'bg-orange-500' },
        parking: { name: 'Bãi đỗ xe', url: 'https://raw.githubusercontent.com/tienbui321/testmap_demo/main/baidoxe.json', icon: 'parking-circle', color: 'bg-gray-500' },
        gas: { name: 'Trạm xăng', url: 'https://raw.githubusercontent.com/tienbui321/testmap_demo/main/tramxang.json', icon: 'fuel', color: 'bg-yellow-500' },
        ev: { name: 'Trạm sạc', url: 'https://raw.githubusercontent.com/tienbui321/testmap_demo/main/tramsacxedien.json', icon: 'battery-charging', color: 'bg-indigo-500' }
    },
    utilityData: {},
    utilityLayers: {},

    /**
     * Initializes the UtilityManager.
     * @param {L.Map} map - The Leaflet map instance.
     */
    init: async function(map) {
        this.map = map;
        await this._setupDropdown();
        this.update();
    },

    /**
     * Updates the visibility of utility markers based on map bounds and zoom level.
     */
    update: function() {
        const zoom = this.map.getZoom();
        const center = this.map.getCenter();
        const bounds = this.map.getBounds();

        document.querySelectorAll('#utility-dropdown-content .utility-checkbox').forEach(cb => {
            const key = cb.value;
            if (!key || key === 'on') return;
            const layer = this.utilityLayers[key];
            if (!layer) return;

            layer.clearLayers();
            if (!cb.checked) {
                if (this.map.hasLayer(layer)) this.map.removeLayer(layer);
                return;
            }

            if (!this.map.hasLayer(layer)) this.map.addLayer(layer);

            const features = this.utilityData[key];
            if(!features) return;
            
            let pointsToShow = [];

            if (zoom >= 16) {
                pointsToShow = features.filter(feature => {
                    const coords = feature.geometry.coordinates;
                    return coords && bounds.contains([coords[1], coords[0]]);
                });
            } else {
                pointsToShow = features
                    .map(feature => {
                        const coords = feature.geometry.coordinates;
                        return { ...feature, distance: center.distanceTo([coords[1], coords[0]]) };
                    })
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 20);
            }

            pointsToShow.forEach(point => {
                const coords = point.geometry.coordinates;
                const lat = coords[1];
                const lng = coords[0];
                if(!lat || !lng) return;

                const config = this.utilityConfig[key];
                const icon = L.divIcon({
                    html: `<div class="utility-marker ${config.color} w-6 h-6"><i data-lucide="${config.icon}" class="w-4 h-4 text-white"></i></div>`,
                    className: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                const marker = L.marker([lat, lng], { icon });
                
                const ten = point.properties.ten || 'Tên không xác định';
                const diaChi = point.properties.dia_chi || 'Địa chỉ không có';
                const tooltipContent = `<div class="p-1"><div class="font-bold">${ten}</div><div>${diaChi}</div></div>`;
                marker.bindTooltip(tooltipContent);
                
                layer.addLayer(marker);
            });
        });
        lucide.createIcons();
    },

    /**
     * Fetches utility data and sets up the dropdown filter UI.
     * @private
     */
    _setupDropdown: async function() {
        const dropdownContent = document.getElementById('utility-dropdown-content');
        dropdownContent.innerHTML = `
            <label class="col-span-2 flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer text-sm font-bold border-b">
                <input type="checkbox" id="utility-select-all" class="utility-checkbox">
                <span>Hiển thị tất cả</span>
            </label>`;
        dropdownContent.classList.add('grid', 'grid-cols-2', 'gap-x-2');
        
        for (const key in this.utilityConfig) {
            const config = this.utilityConfig[key];
            this.utilityLayers[key] = L.layerGroup();
            try {
                const response = await fetch(config.url);
                if(response.ok) this.utilityData[key] = await response.json();
            } catch(e) {
                console.error("Could not fetch utility data for " + key, e);
                this.utilityData[key] = [];
            }
            
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer text-sm';
            label.innerHTML = `<input type="checkbox" class="utility-checkbox" value="${key}"> ${config.name}`;
            dropdownContent.appendChild(label);
        }

        lucide.createIcons();
        
        const allCheckbox = document.getElementById('utility-select-all');
        const individualCheckboxes = Array.from(document.querySelectorAll('#utility-dropdown-content .utility-checkbox:not(#utility-select-all)'));

        const syncSelectAllState = () => {
            allCheckbox.checked = individualCheckboxes.length > 0 && individualCheckboxes.every(c => c.checked);
        }

        allCheckbox.addEventListener('change', (e) => {
            individualCheckboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
            this.update();
        });

        individualCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                syncSelectAllState();
                this.update();
            });
        });
    }
};
