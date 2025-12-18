<template>
  <div class="library-view">
    <h2>Библиотека палитр</h2>
    
    <!-- Уведомление -->
    <div v-if="showNotification" class="notification" :class="notificationType">
      {{ notificationMessage }}
    </div>
    
    <!-- Поиск и фильтры -->
    <div class="search-section">
      <input 
        v-model="searchQuery" 
        placeholder="Поиск по названию..." 
        class="search-input"
      >
      <select v-model="filterType" class="filter-select">
        <option value="all">Все типы</option>
        <option value="analogous">Аналогичные</option>
        <option value="monochromatic">Монохромные</option>
        <option value="triadic">Триада</option>
        <option value="complementary">Комплементарные</option>
      </select>
      <select v-model="filterMood" class="filter-select">
        <option value="all">Все настроения</option>
        <option value="calm">Спокойные</option>
        <option value="energetic">Энергичные</option>
        <option value="professional">Профессиональные</option>
      </select>
    </div>

    <!-- Список палитр -->
    <div v-if="filteredPalettes.length === 0" class="empty-state">
      <p>Нет сохранённых палитр</p>
      <router-link to="/" class="link-button">Создать первую палитру</router-link>
    </div>

    <div v-else class="palettes-grid">
      <div 
        v-for="palette in filteredPalettes" 
        :key="palette.id"
        class="palette-card"
      >
        <div class="palette-header">
          <h3>{{ palette.name }}</h3>
          <div class="palette-actions">
            <button @click="editPalette(palette)" class="action-button">
              ✏️
            </button>
            <button @click="deletePalette(palette.id)" class="action-button delete">
              🗑️
            </button>
          </div>
        </div>

        <div class="palette-colors">
          <div 
            v-for="(color, index) in palette.colors" 
            :key="index"
            class="color-swatch"
            :style="{ backgroundColor: color }"
            :title="color"
          ></div>
        </div>

        <div class="palette-meta">
          <span class="meta-badge">{{ typeLabels[palette.type] }}</span>
          <span class="meta-badge">{{ moodLabels[palette.mood] }}</span>
          <span class="meta-date">{{ formatDate(palette.createdAt) }}</span>
        </div>

        <button @click="loadPalette(palette)" class="load-button">
          Загрузить в генератор
        </button>
      </div>
    </div>

    <!-- Модальное окно редактирования -->
    <div v-if="editingPalette" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <h3>Редактирование палитры</h3>
        <input 
          v-model="editingPalette.name" 
          placeholder="Название палитры"
          class="edit-input"
        >
        
        <div class="edit-colors">
          <div 
            v-for="(color, index) in editingPalette.colors" 
            :key="index"
            class="edit-color-item"
          >
            <input 
              type="color" 
              v-model="editingPalette.colors[index]"
              class="color-picker-small"
            >
            <input 
              type="text" 
              v-model="editingPalette.colors[index]"
              class="color-input"
            >
          </div>
        </div>

        <div class="modal-actions">
          <button @click="saveEdit" class="save-edit-button">Сохранить</button>
          <button @click="closeEditModal" class="cancel-button">Отмена</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="deletingPaletteId" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content confirm-modal" @click.stop>
        <h3>Удалить палитру?</h3>
        <p>Вы уверены, что хотите удалить палитру "{{ getPaletteName(deletingPaletteId) }}"?</p>
        <div class="modal-actions">
          <button @click="confirmDelete" class="delete-confirm-button">Удалить</button>
          <button @click="cancelDelete" class="cancel-button">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'LibraryView',
  
  setup() {
    const router = useRouter()
    const palettes = ref([])
    const searchQuery = ref('')
    const filterType = ref('all')
    const filterMood = ref('all')
    const editingPalette = ref(null)
    const deletingPaletteId = ref(null)
    const showNotification = ref(false)
    const notificationMessage = ref('')
    const notificationType = ref('success')

    const showNotif = (message, type = 'success') => {
      notificationMessage.value = message
      notificationType.value = type
      showNotification.value = true
      setTimeout(() => {
        showNotification.value = false
      }, 3000)
    }

    const typeLabels = {
      analogous: 'Аналогичная',
      monochromatic: 'Монохромная',
      triadic: 'Триада',
      complementary: 'Комплементарная'
    }

    const moodLabels = {
      calm: 'Спокойная',
      energetic: 'Энергичная',
      professional: 'Профессиональная'
    }

    // Загрузка палитр
    const loadPalettes = () => {
      const saved = localStorage.getItem('savedPalettes')
      palettes.value = saved ? JSON.parse(saved) : []
    }

    // Фильтрация палитр
    const filteredPalettes = computed(() => {
      let result = palettes.value

      // Поиск по названию
      if (searchQuery.value) {
        result = result.filter(p => 
          p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }

      // Фильтр по типу
      if (filterType.value !== 'all') {
        result = result.filter(p => p.type === filterType.value)
      }

      // Фильтр по настроению
      if (filterMood.value !== 'all') {
        result = result.filter(p => p.mood === filterMood.value)
      }

      // Сортировка по дате
      return result.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    })

    // Форматирование даты
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }

    // Редактирование
    const editPalette = (palette) => {
      editingPalette.value = { ...palette, colors: [...palette.colors] }
    }

    const closeEditModal = () => {
      editingPalette.value = null
    }

    const saveEdit = () => {
      const index = palettes.value.findIndex(p => p.id === editingPalette.value.id)
      if (index !== -1) {
        palettes.value[index] = editingPalette.value
        localStorage.setItem('savedPalettes', JSON.stringify(palettes.value))
        showNotif(`Палитра "${editingPalette.value.name}" обновлена`)
        closeEditModal()
      }
    }

    // Удаление
    const deletePalette = (id) => {
      deletingPaletteId.value = id
    }

    const confirmDelete = () => {
      const palette = palettes.value.find(p => p.id === deletingPaletteId.value)
      palettes.value = palettes.value.filter(p => p.id !== deletingPaletteId.value)
      localStorage.setItem('savedPalettes', JSON.stringify(palettes.value))
      showNotif(`Палитра "${palette.name}" удалена`, 'error')
      deletingPaletteId.value = null
    }

    const cancelDelete = () => {
      deletingPaletteId.value = null
    }

    const getPaletteName = (id) => {
      return palettes.value.find(p => p.id === id)?.name || ''
    }

    // Загрузка в генератор
    const loadPalette = (palette) => {
      const paletteData = palette.colors.map(hex => ({
        hex,
        rgb: hexToRgb(hex),
        locked: false
      }))
      localStorage.setItem('currentPalette', JSON.stringify(paletteData))
      showNotif(`Палитра "${palette.name}" загружена`)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }

    // Загружаем данные при монтировании
    loadPalettes()

    return {
      palettes,
      searchQuery,
      filterType,
      filterMood,
      filteredPalettes,
      editingPalette,
      deletingPaletteId,
      showNotification,
      notificationMessage,
      notificationType,
      typeLabels,
      moodLabels,
      formatDate,
      editPalette,
      closeEditModal,
      saveEdit,
      deletePalette,
      confirmDelete,
      cancelDelete,
      getPaletteName,
      loadPalette
    }
  }
}
</script>

<style scoped>
.library-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  animation: fadeIn 0.3s ease;
  z-index: 1000;
  font-weight: 600;
  font-size: 1.1rem;
}

.notification.success {
  color: #28a745;
}

.notification.info {
  color: #17a2b8;
}

.notification.error {
  color: #dc3545;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.search-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.filter-select {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-width: 180px;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.empty-state p {
  color: #666;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.link-button {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #34a853;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s;
}

.link-button:hover {
  background: #2d8e47;
}

.palettes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.palette-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.palette-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.palette-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.palette-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.action-button:hover {
  background: #f0f0f0;
}

.action-button.delete:hover {
  background: #ffebee;
}

.palette-colors {
  display: flex;
  gap: 4px;
  height: 80px;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.color-swatch {
  flex: 1;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-swatch:hover {
  transform: scale(1.05);
}

.palette-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.meta-date {
  color: #999;
  font-size: 0.85rem;
  margin-left: auto;
}

.load-button {
  width: 100%;
  padding: 0.75rem;
  background: #34a853;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.load-button:hover {
  background: #2d8e47;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.edit-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 14px;
}

.edit-colors {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.edit-color-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker-small {
  width: 50px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.color-input {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.save-edit-button {
  flex: 1;
  padding: 0.75rem;
  background: #34a853;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.save-edit-button:hover {
  background: #2d8e47;
}

.cancel-button {
  flex: 1;
  padding: 0.75rem;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button:hover {
  background: #d0d0d0;
}

/* Модальное окно подтверждения */
.confirm-modal {
  text-align: center;
}

.confirm-modal h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.confirm-modal p {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.delete-confirm-button {
  flex: 1;
  padding: 0.75rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-confirm-button:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .search-section {
    flex-direction: column;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .palettes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
