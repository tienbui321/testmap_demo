function removeDiacritics(str) {
            if (!str) return '';
            return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
        }
		
const FilterManager = {
	allProperties: [],
	updateCallback: null,
	sortCallback: null,

	init: function(allProps, onUpdate, onSort) {
		this.allProperties = allProps;
		this.updateCallback = onUpdate;
		this.sortCallback = onSort;

		const filterBtn = document.getElementById('filter-btn');
		const sortSelect = document.getElementById('sort-select');

		// Property Type
		const propertyTypes = ["Tất cả", "Chung cư", "Nhà riêng", "Biệt thự", "Liền kề", "Nhà mặt phố", "Shophouse", "Đất nền"];
		const dropdown = document.getElementById('property-type-dropdown');
		propertyTypes.forEach(type => {
			dropdown.innerHTML += `<label class="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer"><input type="checkbox" class="property-type-checkbox" value="${type}" ${type === 'Tất cả' ? 'checked' : ''}> ${type}</label>`;
		});
		document.querySelectorAll('.property-type-checkbox').forEach(cb => {
			cb.addEventListener('change', () => {
				const allCheckbox = document.querySelector('.property-type-checkbox[value="Tất cả"]');
				if (cb.value === "Tất cả" && cb.checked) {
					document.querySelectorAll('.property-type-checkbox').forEach(otherCb => { if (otherCb !== cb) otherCb.checked = false; });
				} else if (cb.value !== "Tất cả" && cb.checked) {
					allCheckbox.checked = false;
				}
				const selected = Array.from(document.querySelectorAll('.property-type-checkbox:checked')).map(c => c.value);
				const btnText = document.getElementById('property-type-text');
				if (selected.length === 0 || selected.includes("Tất cả")) btnText.textContent = "Loại nhà";
				else if (selected.length > 2) btnText.textContent = `${selected.length} loại`;
				else btnText.textContent = selected.join(', ');
			});
		});

		// Price Filter
		const minPriceInput = document.getElementById('min-price');
		const maxPriceInput = document.getElementById('max-price');
		const priceSlider = document.getElementById('price-range');
		const priceQuickBtns = document.getElementById('price-quick-btns');
		const priceOptions = [
			{ label: "Dưới 2 tỷ", min: 0, max: 2000 }, { label: "2 - 5 tỷ", min: 2000, max: 5000 },
			{ label: "5 - 10 tỷ", min: 5000, max: 10000 }, { label: "Trên 10 tỷ", min: 10000, max: 50000 },
			{ label: "Trên 30 tỷ", min: 30000, max: 50000 }, { label: "Thỏa thuận", min: -1, max: -1 },
		];
		priceOptions.forEach(opt => {
			const btn = document.createElement('button');
			btn.textContent = opt.label;
			btn.onclick = () => {
				minPriceInput.value = opt.min !== -1 ? opt.min / 1000 : '';
				maxPriceInput.value = opt.max !== -1 ? opt.max / 1000 : '';
				priceSlider.value = opt.max / 1000;
				if(opt.min === -1) { maxPriceInput.value = 'Thỏa thuận'; minPriceInput.value = ''; }
				document.querySelectorAll('#price-quick-btns button').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
			};
			priceQuickBtns.appendChild(btn);
		});
		priceSlider.addEventListener('input', () => { maxPriceInput.value = priceSlider.value; document.querySelectorAll('#price-quick-btns button').forEach(b => b.classList.remove('active')); });
		maxPriceInput.addEventListener('input', () => { priceSlider.value = maxPriceInput.value || 50; document.querySelectorAll('#price-quick-btns button').forEach(b => b.classList.remove('active')); });
		minPriceInput.addEventListener('input', () => document.querySelectorAll('#price-quick-btns button').forEach(b => b.classList.remove('active')));

		// Area Filter
		const minAreaInput = document.getElementById('min-area');
		const maxAreaInput = document.getElementById('max-area');
		const areaSlider = document.getElementById('area-range');
		const areaQuickBtns = document.getElementById('area-quick-btns');
		 const areaOptions = [
			{ label: "Dưới 30m²", min: 0, max: 30 }, { label: "30 - 50m²", min: 30, max: 50 },
			{ label: "50 - 80m²", min: 50, max: 80 }, { label: "80 - 120m²", min: 80, max: 120 },
			{ label: "Trên 120m²", min: 120, max: 500 },
		];
		areaOptions.forEach(opt => {
			const btn = document.createElement('button');
			btn.textContent = opt.label;
			btn.onclick = () => {
				minAreaInput.value = opt.min;
				maxAreaInput.value = opt.max;
				areaSlider.value = opt.max;
				 document.querySelectorAll('#area-quick-btns button').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
			};
			areaQuickBtns.appendChild(btn);
		});
		areaSlider.addEventListener('input', () => { maxAreaInput.value = areaSlider.value; document.querySelectorAll('#area-quick-btns button').forEach(b => b.classList.remove('active')); });
		maxAreaInput.addEventListener('input', () => { areaSlider.value = maxAreaInput.value || 500; document.querySelectorAll('#area-quick-btns button').forEach(b => b.classList.remove('active')); });
		minAreaInput.addEventListener('input', () => document.querySelectorAll('#area-quick-btns button').forEach(b => b.classList.remove('active')));
		
		// Bedrooms Filter
		const minBedsInput = document.getElementById('min-beds');
		const maxBedsInput = document.getElementById('max-beds');
		const bedsSlider = document.getElementById('beds-range');
		const bedsQuickBtns = document.getElementById('beds-quick-btns');
		const bedOptions = [
			{ label: "1+", min: 1, max: 10 }, { label: "2+", min: 2, max: 10 },
			{ label: "3+", min: 3, max: 10 }, { label: "4+", min: 4, max: 10 },
			{ label: "5+", min: 5, max: 10 },
		];
		bedOptions.forEach(opt => {
			const btn = document.createElement('button');
			btn.textContent = opt.label;
			btn.onclick = () => {
				minBedsInput.value = opt.min;
				maxBedsInput.value = '';
				bedsSlider.value = opt.max;
				document.querySelectorAll('#beds-quick-btns button').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
			};
			bedsQuickBtns.appendChild(btn);
		});
		bedsSlider.addEventListener('input', () => { maxBedsInput.value = bedsSlider.value == 10 ? '' : bedsSlider.value; document.querySelectorAll('#beds-quick-btns button').forEach(b => b.classList.remove('active'));});
		maxBedsInput.addEventListener('input', () => { bedsSlider.value = maxBedsInput.value || 10; document.querySelectorAll('#beds-quick-btns button').forEach(b => b.classList.remove('active'));});
		minBedsInput.addEventListener('input', () => document.querySelectorAll('#beds-quick-btns button').forEach(b => b.classList.remove('active')));
		
		filterBtn.addEventListener('click', () => this.applyFilters());
		sortSelect.addEventListener('change', () => this.sortCallback());
	},

	applyFilters: function() {
		const searchText = document.getElementById('search-input').value.toLowerCase();
		const normalizedSearchText = removeDiacritics(searchText);
		const selectedTypes = Array.from(document.querySelectorAll('.property-type-checkbox:checked')).map(cb => cb.value);
		
		const minPrice = parseFloat(document.getElementById('min-price').value) * 1000 || 0;
		const maxPriceVal = document.getElementById('max-price').value;
		const isDeal = maxPriceVal.toLowerCase() === 'thỏa thuận';
		const maxPrice = parseFloat(maxPriceVal) * 1000 || Infinity;
		
		const minArea = parseFloat(document.getElementById('min-area').value) || 0;
		const maxArea = parseFloat(document.getElementById('max-area').value) || Infinity;

		const minBeds = parseFloat(document.getElementById('min-beds').value) || 0;
		const maxBeds = parseFloat(document.getElementById('max-beds').value) || Infinity;

		const newFilteredProperties = this.allProperties.filter(prop => {
			const typeMatch = selectedTypes.includes("Tất cả") || selectedTypes.length === 0 || selectedTypes.some(type => prop.type && prop.type.includes(type));
			
			let priceMatch = false;
			if(isDeal) {
				priceMatch = prop.priceValue === -1;
			} else {
				priceMatch = (prop.priceValue === -1 || (prop.priceValue >= minPrice && prop.priceValue <= maxPrice));
			}

			const areaMatch = prop.areaValue === null || (prop.areaValue >= minArea && prop.areaValue <= maxArea);
			const bedsMatch = prop.bedrooms >= minBeds && prop.bedrooms <= maxBeds;
			const searchMatch = !searchText || removeDiacritics(prop.title.toLowerCase()).includes(normalizedSearchText);

			return typeMatch && priceMatch && bedsMatch && searchMatch && areaMatch;
		});
		
		this.updateCallback(newFilteredProperties);
	}
};