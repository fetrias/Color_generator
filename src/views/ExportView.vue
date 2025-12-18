<template>
  <div class="export-view">
    <h2>Экспорт палитры</h2>
    <!-- Выбор палитры -->
    <div class="palette-selector">
      <h3>Выберите палитру для экспорта</h3>
      <div v-if="currentPalette.length === 0" class="no-palette">
        <p>Нет активной палитры</p>
        <router-link to="/" class="link-button">Создать палитру</router-link>
      </div>
      <div v-else class="current-palette">
        <div class="palette-preview">
          <div 
            v-for="(color, index) in currentPalette" 
            :key="index"
            class="color-preview"
            :style="{ backgroundColor: color.hex }"
          ></div>
        </div>
        <button @click="toggleLibraryList" class="load-library-button">
          {{ showLibraryList ? 'Скрыть библиотеку' : 'Загрузить из библиотеки' }}
        </button>
      </div>
      <!-- Список палитр из библиотеки -->
      <div v-if="showLibraryList" class="library-list">
        <div v-if="savedPalettes.length === 0" class="empty-library">
          <p>Нет сохранённых палитр</p>
        </div>
        <div v-else class="saved-palettes">
          <div 
            v-for="palette in savedPalettes" 
            :key="palette.id"
            class="saved-palette-item"
            @click="loadSavedPalette(palette)"
          >
            <div class="palette-info">
              <span class="palette-name">{{ palette.name }}</span>
            </div>
            <div class="palette-colors-mini">
              <div 
                v-for="(color, index) in palette.colors" 
                :key="index"
                class="color-mini"
                :style="{ backgroundColor: color }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Форматы экспорта -->
    <div v-if="currentPalette.length > 0" class="export-formats">
      <h3>Форматы экспорта</h3>
      <!-- CSS Variables -->
      <div class="format-section">
        <div class="format-header">
          <h4>CSS Variables</h4>
          <button @click="copyCode('css')" class="copy-button">
            {{ copiedFormat === 'css' ? '✓ Скопировано' : 'Копировать' }}
          </button>
        </div>
        <pre class="code-block"><code>{{ cssVariables }}</code></pre>
      </div>
      <!-- SCSS Variables -->
      <div class="format-section">
        <div class="format-header">
          <h4>SCSS Variables</h4>
          <button @click="copyCode('scss')" class="copy-button">
            {{ copiedFormat === 'scss' ? '✓ Скопировано' : 'Копировать' }}
          </button>
        </div>
        <pre class="code-block"><code>{{ scssVariables }}</code></pre>
      </div>
      <!-- Tailwind Config -->
      <div class="format-section">
        <div class="format-header">
          <h4>Tailwind Config</h4>
          <button @click="copyCode('tailwind')" class="copy-button">
            {{ copiedFormat === 'tailwind' ? '✓ Скопировано' : 'Копировать' }}
          </button>
        </div>
        <pre class="code-block"><code>{{ tailwindConfig }}</code></pre>
      </div>
      <!-- CSS Classes -->
      <div class="format-section">
        <div class="format-header">
          <h4>CSS Classes</h4>
          <button @click="copyCode('classes')" class="copy-button">
            {{ copiedFormat === 'classes' ? '✓ Скопировано' : 'Копировать' }}
          </button>
        </div>
        <pre class="code-block"><code>{{ cssClasses }}</code></pre>
      </div>
      <!-- Шаринговая ссылка -->
      <div class="share-section">
        <h3>Поделиться палитрой</h3>
        <div class="share-controls">
          <input 
            :value="shareUrl" 
            readonly 
            class="share-input"
            @click="selectAll"
          >
          <button @click="copyShareUrl" class="share-button">
            {{ shareUrlCopied ? '✓ Скопировано' : 'Копировать ссылку' }}
          </button>
        </div>
        <p class="share-hint">
          Эта ссылка содержит вашу палитру в параметрах URL
        </p>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
export default {
  name: 'ExportView',
  setup() {
    const router = useRouter()
    const currentPalette = ref([])
    const savedPalettes = ref([])
    const showLibraryList = ref(false)
    const copiedFormat = ref('')
    const shareUrlCopied = ref(false)
    const loadCurrentPalette = () => {
      const saved = localStorage.getItem('currentPalette')
      if (saved) {
        currentPalette.value = JSON.parse(saved)
      }
    }
    const loadSavedPalettes = () => {
      const saved = localStorage.getItem('savedPalettes')
      savedPalettes.value = saved ? JSON.parse(saved) : []
    }
    const toggleLibraryList = () => {
      showLibraryList.value = !showLibraryList.value
      if (showLibraryList.value) {
        loadSavedPalettes()
      }
    }
    const loadSavedPalette = (palette) => {
      currentPalette.value = palette.colors.map(hex => ({
        hex,
        rgb: hexToRgb(hex)
      }))
      localStorage.setItem('currentPalette', JSON.stringify(currentPalette.value))
      showLibraryList.value = false
    }
    const cssVariables = computed(() => {
      if (currentPalette.value.length === 0) return ''
      let css = ':root {\n'
      currentPalette.value.forEach((color, index) => {
        css += `  --color-${index + 1}: ${color.hex};\n`
      })
      css += '}'
      return css
    })
    const scssVariables = computed(() => {
      if (currentPalette.value.length === 0) return ''
      let scss = ''
      currentPalette.value.forEach((color, index) => {
        scss += `$color-${index + 1}: ${color.hex};\n`
      })
      return scss
    })
    const tailwindConfig = computed(() => {
      if (currentPalette.value.length === 0) return ''
      let config = 'module.exports = {\n'
      config += '  theme: {\n'
      config += '    extend: {\n'
      config += '      colors: {\n'
      currentPalette.value.forEach((color, index) => {
        config += `        'palette-${index + 1}': '${color.hex}',\n`
      })
      config += '      }\n'
      config += '    }\n'
      config += '  }\n'
      config += '}'
      return config
    })
    const cssClasses = computed(() => {
      if (currentPalette.value.length === 0) return ''
      let classes = ''
      currentPalette.value.forEach((color, index) => {
        const className = `color-${index + 1}`
        classes += `.bg-${className} {\n`
        classes += `  background-color: ${color.hex};\n`
        classes += `}\n\n`
        classes += `.text-${className} {\n`
        classes += `  color: ${color.hex};\n`
        classes += `}\n\n`
        classes += `.border-${className} {\n`
        classes += `  border-color: ${color.hex};\n`
        classes += `}\n\n`
      })
      return classes.trim()
    })
    const shareUrl = computed(() => {
      if (currentPalette.value.length === 0) return ''
      const colors = currentPalette.value.map(c => c.hex.substring(1)).join('-')
      const baseUrl = window.location.origin + '/Color_generator/'
      return `${baseUrl}?colors=${colors}`
    })
    const copyCode = async (format) => {
      let code = ''
      switch (format) {
        case 'css':
          code = cssVariables.value
          break
        case 'scss':
          code = scssVariables.value
          break
        case 'tailwind':
          code = tailwindConfig.value
          break
        case 'classes':
          code = cssClasses.value
          break
      }
      await navigator.clipboard.writeText(code)
      copiedFormat.value = format
      setTimeout(() => {
        copiedFormat.value = ''
      }, 2000)
    }
    const copyShareUrl = async () => {
      await navigator.clipboard.writeText(shareUrl.value)
      shareUrlCopied.value = true
      setTimeout(() => {
        shareUrlCopied.value = false
      }, 2000)
    }
    const selectAll = (event) => {
      event.target.select()
    }
    onMounted(() => {
      loadCurrentPalette()
      const urlParams = new URLSearchParams(window.location.search)
      const colors = urlParams.get('colors')
      if (colors) {
        const colorArray = colors.split('-').map(c => '#' + c)
        currentPalette.value = colorArray.map(hex => ({
          hex,
          rgb: hexToRgb(hex),
          locked: false
        }))
        localStorage.setItem('currentPalette', JSON.stringify(currentPalette.value))
      }
    })
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }
    return {
      currentPalette,
      savedPalettes,
      showLibraryList,
      copiedFormat,
      shareUrlCopied,
      cssVariables,
      scssVariables,
      tailwindConfig,
      cssClasses,
      shareUrl,
      toggleLibraryList,
      loadSavedPalette,
      copyCode,
      copyShareUrl,
      selectAll
    }
  }
}
</script>
<style scoped>
.export-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
h2 {
  margin-bottom: 2rem;
  color: #2c3e50;
}
h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.2rem;
}
/* Выбор палитры */
.palette-selector {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}
.no-palette {
  text-align: center;
  padding: 2rem;
}
.no-palette p {
  color: #666;
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
.current-palette {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.palette-preview {
  flex: 1;
  display: flex;
  gap: 4px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}
.color-preview {
  flex: 1;
}
.load-library-button {
  padding: 0.75rem 1.5rem;
  background: #34a853;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.load-library-button:hover {
  background: #2d8e47;
}
/* Список библиотеки */
.library-list {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
}
.empty-library {
  text-align: center;
  color: #666;
  padding: 2rem;
}
.saved-palettes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.saved-palette-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}
.saved-palette-item:hover {
  border-color: #34a853;
  transform: translateX(4px);
}
.palette-info {
  flex: 1;
}
.palette-name {
  font-weight: 600;
  color: #2c3e50;
}
.palette-colors-mini {
  display: flex;
  gap: 2px;
  height: 30px;
  border-radius: 4px;
  overflow: hidden;
}
.color-mini {
  width: 20px;
  flex-shrink: 0;
}
/* Форматы экспорта */
.export-formats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.format-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.format-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.format-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}
.copy-button {
  padding: 0.5rem 1rem;
  background: #34a853;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.copy-button:hover {
  background: #2d8e47;
}
.code-block {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
}
.code-block code {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #2c3e50;
  line-height: 1.6;
}
/* Шаринг */
.share-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.share-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.share-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.9rem;
  background: #f8f9fa;
}
.share-button {
  padding: 0.75rem 1.5rem;
  background: #34a853;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.share-button:hover {
  background: #2d8e47;
}
.share-hint {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
@media (max-width: 768px) {
  .current-palette {
    flex-direction: column;
  }
  .share-controls {
    flex-direction: column;
  }
}
</style>
