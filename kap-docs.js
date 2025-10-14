let materialsData = null;
let selectedCategory = 'すべて';
let searchQuery = '';
let sortOrder = 'new';
let favorites = [];
let completed = [];
let filters = {
  favorites: false,
  completed: false,
  uncompleted: false
};
let zoomLevel = 1;
let wheelEventListener = null;

function loadFromLocalStorage() {
  const storedFavorites = localStorage.getItem('kap-favorites');
  const storedCompleted = localStorage.getItem('kap-completed');
  
  favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
  completed = storedCompleted ? JSON.parse(storedCompleted) : [];
}

function saveToLocalStorage() {
  localStorage.setItem('kap-favorites', JSON.stringify(favorites));
  localStorage.setItem('kap-completed', JSON.stringify(completed));
}

function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(fav => fav !== id);
  } else {
    favorites.push(id);
  }
  saveToLocalStorage();
  displayMaterials();
}

function toggleCompleted(id) {
  if (completed.includes(id)) {
    completed = completed.filter(comp => comp !== id);
  } else {
    completed.push(id);
  }
  saveToLocalStorage();
  displayMaterials();
}

async function loadMaterials() {
  try {
    const response = await fetch('https://syari-api.onrender.com/kap-materials.json');
    if (!response.ok) {
      throw new Error('資料データの読み込みに失敗しました');
    }
    materialsData = await response.json();
    
    loadFromLocalStorage();
    displayCategories();
    displayMaterials();
    setupEventListeners();
  } catch (error) {
    console.error('資料の読み込みエラー:', error);
    const materialsGrid = document.getElementById('materials-grid');
    materialsGrid.innerHTML = '<p class="no-results">資料データの読み込みに失敗しました。ページを再読み込みしてください。</p>';
  }
}

function displayCategories() {
  const categoryList = document.getElementById('category-list');
  categoryList.innerHTML = '';
  
  const allCategory = document.createElement('div');
  allCategory.className = 'category-item active';
  allCategory.textContent = 'すべて';
  allCategory.addEventListener('click', () => selectCategory('すべて', allCategory));
  categoryList.appendChild(allCategory);
  
  materialsData.categories.forEach(category => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.textContent = category;
    categoryItem.addEventListener('click', () => selectCategory(category, categoryItem));
    categoryList.appendChild(categoryItem);
  });
}

function selectCategory(category, element) {
  selectedCategory = category;
  
  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.remove('active');
  });
  element.classList.add('active');
  
  displayMaterials();
}

function displayMaterials() {
  const materialsGrid = document.getElementById('materials-grid');
  materialsGrid.innerHTML = '';
  
  let filteredMaterials = selectedCategory === 'すべて' 
    ? [...materialsData.materials]
    : materialsData.materials.filter(m => {
        if (Array.isArray(m.category)) {
          return m.category.includes(selectedCategory);
        }
        return m.category === selectedCategory;
      });
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredMaterials = filteredMaterials.filter(m => 
      m.title.toLowerCase().includes(query) || 
      m.description.toLowerCase().includes(query)
    );
  }
  
  if (filters.favorites) {
    filteredMaterials = filteredMaterials.filter(m => favorites.includes(m.id));
  }
  
  if (filters.completed) {
    filteredMaterials = filteredMaterials.filter(m => completed.includes(m.id));
  } else if (filters.uncompleted) {
    filteredMaterials = filteredMaterials.filter(m => !completed.includes(m.id));
  }
  
  filteredMaterials.sort((a, b) => {
    if (sortOrder === 'new') {
      return b.id - a.id;
    } else {
      return a.id - b.id;
    }
  });
  
  if (filteredMaterials.length === 0) {
    materialsGrid.innerHTML = '<p class="no-results">該当する資料がありません</p>';
    return;
  }
  
  filteredMaterials.forEach(material => {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    const img = document.createElement('img');
    img.src = material.image;
    img.alt = material.title;
    img.className = 'material-image';
    img.loading = 'lazy';
    
    const info = document.createElement('div');
    info.className = 'material-info';
    
    const title = document.createElement('h3');
    title.textContent = material.title;
    title.className = 'material-title';
    
    const category = document.createElement('span');
    category.textContent = Array.isArray(material.category) 
      ? material.category.join(' / ') 
      : material.category;
    category.className = 'material-category';
    
    const description = document.createElement('p');
    description.textContent = material.description;
    description.className = 'material-description';
    
    const actions = document.createElement('div');
    actions.className = 'material-actions';
    
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'action-button favorite-button';
    favoriteBtn.innerHTML = favorites.includes(material.id) ? '⭐' : '☆';
    favoriteBtn.title = favorites.includes(material.id) ? 'お気に入りから削除' : 'お気に入りに追加';
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(material.id);
    });
    
    const completedBtn = document.createElement('button');
    completedBtn.className = 'action-button completed-button';
    completedBtn.innerHTML = completed.includes(material.id) ? '✓' : '○';
    completedBtn.title = completed.includes(material.id) ? '未読に戻す' : '読了済みにする';
    completedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCompleted(material.id);
    });
    
    actions.appendChild(favoriteBtn);
    actions.appendChild(completedBtn);
    
    info.appendChild(title);
    info.appendChild(category);
    info.appendChild(description);
    info.appendChild(actions);
    
    card.appendChild(img);
    card.appendChild(info);
    
    img.addEventListener('click', () => openModal(material.image));
    
    materialsGrid.appendChild(card);
  });
}

function openModal(imageSrc) {
  if (!imageSrc) {
    console.error('画像のパスが指定されていません');
    return;
  }
  
  const modal = document.getElementById('modal-overlay');
  const modalImage = document.getElementById('modal-image');
  
  modalImage.src = imageSrc;
  modal.classList.add('active');
  
  zoomLevel = 1;
  modalImage.style.transform = `scale(${zoomLevel})`;
  
  wheelEventListener = (e) => {
    e.preventDefault();
    
    const zoomSpeed = 0.1;
    
    if (e.deltaY < 0) {
      zoomLevel = Math.min(zoomLevel + zoomSpeed, 5);
    } else {
      zoomLevel = Math.max(zoomLevel - zoomSpeed, 1);
    }
    
    modalImage.style.transform = `scale(${zoomLevel})`;
    
    if (zoomLevel > 1) {
      modalImage.classList.add('zoomed');
    } else {
      modalImage.classList.remove('zoomed');
    }
  };
  
  modal.addEventListener('wheel', wheelEventListener, { passive: false });
}

function closeModal() {
  const modal = document.getElementById('modal-overlay');
  modal.classList.remove('active');
  
  if (wheelEventListener) {
    modal.removeEventListener('wheel', wheelEventListener);
    wheelEventListener = null;
  }
  
  const modalImage = document.getElementById('modal-image');
  modalImage.style.transform = 'scale(1)';
  modalImage.classList.remove('zoomed');
  zoomLevel = 1;
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    displayMaterials();
  });
  
  const sortNewButton = document.getElementById('sort-new');
  const sortOldButton = document.getElementById('sort-old');
  
  sortNewButton.addEventListener('click', () => {
    sortOrder = 'new';
    sortNewButton.classList.add('active');
    sortOldButton.classList.remove('active');
    displayMaterials();
  });
  
  sortOldButton.addEventListener('click', () => {
    sortOrder = 'old';
    sortOldButton.classList.add('active');
    sortNewButton.classList.remove('active');
    displayMaterials();
  });
  
  const filterFavorites = document.getElementById('filter-favorites');
  const filterCompleted = document.getElementById('filter-completed');
  const filterUncompleted = document.getElementById('filter-uncompleted');
  
  filterFavorites.addEventListener('click', () => {
    filters.favorites = !filters.favorites;
    if (filters.favorites) {
      filterFavorites.classList.add('active');
    } else {
      filterFavorites.classList.remove('active');
    }
    displayMaterials();
  });
  
  filterCompleted.addEventListener('click', () => {
    filters.completed = !filters.completed;
    if (filters.completed) {
      filterCompleted.classList.add('active');
      filters.uncompleted = false;
      filterUncompleted.classList.remove('active');
    } else {
      filterCompleted.classList.remove('active');
    }
    displayMaterials();
  });
  
  filterUncompleted.addEventListener('click', () => {
    filters.uncompleted = !filters.uncompleted;
    if (filters.uncompleted) {
      filterUncompleted.classList.add('active');
      filters.completed = false;
      filterCompleted.classList.remove('active');
    } else {
      filterUncompleted.classList.remove('active');
    }
    displayMaterials();
  });
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') {
    closeModal();
  }
});

loadMaterials();
