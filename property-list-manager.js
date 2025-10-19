/**
 * @file property-list-manager.js
 * @description Manages the rendering, sorting, and interaction of the property list view.
 */
const PropertyListManager = {
    propertyListContent: null,
    resultsCount: null,
    propertyListContainer: null,
    
    listCurrentPage: 1,
    LIST_PAGE_SIZE: 10,
    currentlyVisibleProperties: [],

    onCardClickCallback: null,
    onCardMouseoverCallback: null,
    onCardMouseoutCallback: null,

    /**
     * Initializes the PropertyListManager.
     * @param {function} onCardClick - Callback for when a property card is clicked.
     * @param {function} onCardMouseover - Callback for when the mouse enters a card.
     * @param {function} onCardMouseout - Callback for when the mouse leaves a card.
     */
    init: function(onCardClick, onCardMouseover, onCardMouseout) {
        this.propertyListContent = document.getElementById('property-list-content');
        this.resultsCount = document.getElementById('results-count');
        this.propertyListContainer = document.getElementById('property-list-container');
        
        this.onCardClickCallback = onCardClick;
        this.onCardMouseoverCallback = onCardMouseover;
        this.onCardMouseoutCallback = onCardMouseout;

        this.propertyListContainer.addEventListener('scroll', this._handleInfiniteScroll.bind(this));
    },

    /**
     * Renders the property list based on the provided properties and current sort order.
     * @param {Array} properties - An array of property objects to display.
     */
    render: function(properties) {
        this.currentlyVisibleProperties = properties;
        
        this.propertyListContent.innerHTML = '';
        this.resultsCount.textContent = `${this.currentlyVisibleProperties.length} kết quả trong khu vực`;
        this.listCurrentPage = 1;

        this._appendNextPageToList();
        this.propertyListContainer.scrollTop = 0;
    },

    /**
     * Highlights a specific property card in the list.
     * @param {Array<number>|null} ids - An array of property IDs to highlight. Pass null to clear highlights.
     */
    highlight: function(ids) {
        document.querySelectorAll('.property-card.highlight').forEach(c => c.classList.remove('highlight'));
        if (!ids || ids.length === 0) return;
        ids.forEach(id => {
            const card = document.getElementById(`card-${id}`);
            if (card) {
                card.classList.add('highlight');
            }
        });
    },
    
    /**
     * Scrolls the list to the specified property card.
     * @param {Array<number>} ids - An array containing the ID of the card to scroll to.
     */
    scrollToCard: function(ids) {
        if (!ids || ids.length === 0) return;
        const card = document.getElementById(`card-${ids[0]}`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

    /**
     * Appends the next page of properties to the list.
     * @private
     */
    _appendNextPageToList: function() {
        const startIndex = (this.listCurrentPage - 1) * this.LIST_PAGE_SIZE;
        const endIndex = startIndex + this.LIST_PAGE_SIZE;
        const propertiesToRender = this.currentlyVisibleProperties.slice(startIndex, endIndex);

        if (propertiesToRender.length === 0 && this.listCurrentPage > 1) {
            return;
        }

        propertiesToRender.forEach(prop => {
            const card = document.createElement('div');
            card.className = 'property-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all';
            card.id = `card-${prop.id}`;
            const images = prop.allImageUrls ? prop.allImageUrls.split(',').map(s => s.trim()) : [prop.thumbnail];
            const infoParts = [prop.bedrooms ? `${prop.bedrooms} PN` : null, prop.bathrooms ? `${prop.bathrooms} WC` : null, prop.area].filter(Boolean).join(' • ');
            const formattedDate = prop.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const certificateTag = prop.hasVerified
                ? `<div class="flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full" title="Chứng chỉ an toàn pháp lý">
                       <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                       <span>An toàn</span>
                   </div>`
                : '';

            card.innerHTML = `
                <div class="card-gallery relative">
                    <img src="${images[0] || 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'}" alt="Property Image" class="w-full h-40 object-cover" data-images='${JSON.stringify(images)}' data-index="0">
                    ${images.length > 1 ? `<button class="gallery-btn prev"><i data-lucide="chevron-left" class="w-4 h-4"></i></button><button class="gallery-btn next"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>` : ''}
                    <button class="fav-btn"><i data-lucide="heart" class="w-4 h-4"></i></button>
                </div>
                <div class="p-3">
                    <div class="flex justify-between items-start mb-1">
                        <p class="font-bold text-lg text-blue-700 truncate">${prop.price || ''}</p>
                         <div class="flex items-center gap-2 shrink-0">
                            ${certificateTag}
                            <span class="text-xs font-semibold whitespace-nowrap ${prop.posterType === 'owner' ? 'text-green-700 bg-green-100' : 'text-orange-700 bg-orange-100'} px-2 py-1 rounded-full">${prop.posterType === 'owner' ? 'Chính chủ' : 'Môi giới'}</span>
                        </div>
                    </div>
                    <p class="font-semibold text-sm text-slate-700">${infoParts}</p>
                    <p class="text-slate-600 text-sm truncate mt-1">${prop.title || ''}</p>
                    <p class="text-xs text-slate-400 mt-2">Đăng ngày: ${formattedDate}</p>
                </div>`;

            card.addEventListener('click', e => { 
                if (!e.target.closest('.gallery-btn, .fav-btn')) this.onCardClickCallback(prop.id); 
            });
            card.addEventListener('mouseover', () => this.onCardMouseoverCallback([prop.id]));
            card.addEventListener('mouseout', () => this.onCardMouseoutCallback(null));
            this.propertyListContent.appendChild(card);
        });

        lucide.createIcons();
        this.listCurrentPage++;
    },
    
    /**
     * Handles the infinite scroll event.
     * @private
     */
    _handleInfiniteScroll: function() {
        const { scrollTop, scrollHeight, clientHeight } = this.propertyListContainer;
        if (scrollHeight - scrollTop - clientHeight < 200) {
            this._appendNextPageToList();
        }
    }
};
