const PropertyListManager = {
    propertyListContent: null,
    resultsCount: null,
    propertyListContainer: null,
    onCardClick: null,
    onCardMouseover: null,
    onCardMouseout: null,
    currentlyVisibleProperties: [],
    listCurrentPage: 1,
    LIST_PAGE_SIZE: 10,

    init: function(onCardClick, onCardMouseover, onCardMouseout) {
        this.propertyListContent = document.getElementById('property-list-content');
        this.resultsCount = document.getElementById('results-count');
        this.propertyListContainer = document.getElementById('property-list-container');
        this.onCardClick = onCardClick;
        this.onCardMouseover = onCardMouseover;
        this.onCardMouseout = onCardMouseout;
        
        this.propertyListContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = this.propertyListContainer;
            if (scrollHeight - scrollTop - clientHeight < 200) {
                this._appendNextPageToList();
            }
        });
    },

    render: function(properties) {
        this.currentlyVisibleProperties = properties;
        this.resultsCount.textContent = `${this.currentlyVisibleProperties.length} kết quả trong khu vực`;
        this.propertyListContent.innerHTML = '';
        this.listCurrentPage = 1;
        this.propertyListContainer.scrollTop = 0;
        this._appendNextPageToList();
    },

    highlight: function(ids) {
        document.querySelectorAll('.property-card.highlight').forEach(c => c.classList.remove('highlight'));
        if (ids) {
            ids.forEach(id => document.getElementById(`card-${id}`)?.classList.add('highlight'));
        }
    },

    scrollToCard: function(ids) {
        if (!ids || ids.length === 0) return;
        const card = document.getElementById(`card-${ids[0]}`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

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
                ? `<div class="flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full" title="Chứng chỉ an toàn pháp lý"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i><span>An toàn</span></div>`
                : '';

            card.innerHTML = `
                <div class="card-gallery relative">
                    <img src="${images[0] || 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image'}" alt="Property Image" class="w-full h-40 object-cover" data-images='${JSON.stringify(images)}' data-index="0" loading="lazy">
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

            card.addEventListener('click', e => { if (!e.target.closest('.gallery-btn, .fav-btn')) this.onCardClick(prop.id); });
            card.addEventListener('mouseover', () => this.onCardMouseover([prop.id]));
            card.addEventListener('mouseout', () => this.onCardMouseout(null));
            this.propertyListContent.appendChild(card);
            
            // Attach gallery events
            this._attachGalleryEvents(card);
        });

        lucide.createIcons();
        this.listCurrentPage++;
    },

    _attachGalleryEvents: function(card) {
        const galleryImg = card.querySelector('.card-gallery img');
        const prevBtn = card.querySelector('.gallery-btn.prev');
        const nextBtn = card.querySelector('.gallery-btn.next');
        
        if (galleryImg && prevBtn && nextBtn) {
            try {
                const images = JSON.parse(galleryImg.dataset.images || '[]');
                if (images.length > 1) {
                    nextBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let currentIndex = parseInt(galleryImg.dataset.index || '0');
                        currentIndex = (currentIndex + 1) % images.length;
                        galleryImg.src = images[currentIndex] || 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image';
                        galleryImg.dataset.index = currentIndex;
                    });

                    prevBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let currentIndex = parseInt(galleryImg.dataset.index || '0');
                        currentIndex = (currentIndex - 1 + images.length) % images.length;
                        galleryImg.src = images[currentIndex] || 'https://placehold.co/300x200/e2e8f0/64748b?text=No+Image';
                        galleryImg.dataset.index = currentIndex;
                    });
                }
            } catch(err) {
                console.error("Failed to parse gallery images for card:", err);
            }
        }
    }
};

