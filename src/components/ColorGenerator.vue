<template>
  <div class="color-generator">
    <h2>Генератор цветовых палитр</h2>
    <!-- Панель управления -->
    <div class="controls">
      <button @click="generatePalette" class="generate-button">
        Случайная палитра
      </button>
      <div class="control-group">
        <label>Количество цветов:</label>
        <select v-model.number="colorCount" @change="generatePalette" class="select-input">
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="7">7</option>
        </select>
      </div>
      <div class="control-group">
        <label>Формат:</label>
        <select v-model="colorFormat" class="select-input">
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
        </select>
      </div>
    </div>
    <!-- Уведомление о копировании -->
    <div v-if="showCopyNotification" class="notification">
      Скопировано: {{ copiedColor }}
    </div>
    <!-- Палитра цветов -->
    <div class="palette">
      <div 
        v-for="(color, index) in palette" 
        :key="index"
        class="color-card"
        :style="{ backgroundColor: color.hex }"
        @click="copyToClipboard(color)"
      >
        <button 
          @click.stop="toggleLock(index)" 
          class="lock-button"
          :class="{ locked: color.locked }"
        >
          <span class="lock-icon">{{ color.locked ? '🔒' : '🔓' }}</span>
        </button>
        <div class="color-info">
          <span class="color-value">{{ getColorValue(color) }}</span>
        </div>
      </div>
    </div>
    <!-- Превью -->
    <div class="preview-section">
      <h3>Превью</h3>
      <div class="preview-controls">
        <button 
          @click="previewBackground = 'light'" 
          :class="{ active: previewBackground === 'light' }"
          class="preview-toggle"
        >
          Светлый фон
        </button>
        <button 
          @click="previewBackground = 'dark'" 
          :class="{ active: previewBackground === 'dark' }"
          class="preview-toggle"
        >
          Тёмный фон
        </button>
      </div>
      <div class="preview-mockup" :class="{ 'dark-bg': previewBackground === 'dark' }">
        <!-- Карточка профиля с использованием всех цветов палитры -->
        <div class="profile-card">
          <!-- Хедер с первым цветом -->
          <div class="profile-header" :style="{ backgroundColor: palette[0]?.hex }">
            <!-- Аватар со вторым цветом -->
            <div class="profile-avatar" :style="{ backgroundColor: palette[1]?.hex, color: getTextColor(palette[1]?.hex) }">
              Б
            </div>
          </div>
          <!-- Тело карточки с третьим цветом фона -->
          <div class="profile-body" :style="{ backgroundColor: palette[2]?.hex }">
            <!-- Имя с автоматическим цветом текста -->
            <h3 :style="{ color: getTextColor(palette[2]?.hex) }">Боня</h3>
            <!-- Кнопка с использованием всех оставшихся цветов -->
            <button 
              class="profile-button" 
              :style="{ 
                backgroundColor: palette[3]?.hex, 
                color: getTextColor(palette[3]?.hex)
              }"
            >
              Подписаться
            </button>
            <!-- Статистика - используем все цвета палитры -->
            <div class="profile-stats">
              <div 
                v-for="(color, index) in palette" 
                :key="index"
                class="stat-item"
              >
                <div class="stat-circle" :style="{ backgroundColor: color.hex }">
                  <strong :style="{ color: getTextColor(color.hex) }">{{ index + 1 }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted } from 'vue'
export default {
  name: 'ColorGenerator',
  setup() {
    const palette = ref([])
    const colorCount = ref(5)
    const colorFormat = ref('hex')
    const showCopyNotification = ref(false)
    const copiedColor = ref('')
    const previewBackground = ref('light')
    const hslToHex = (h, s, l) => {
      l /= 100
      const a = s * Math.min(l, 1 - l) / 100
      const f = n => {
        const k = (n + h / 30) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color).toString(16).padStart(2, '0')
      }
      return `#${f(0)}${f(8)}${f(4)}`
    }
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }
    const generateHarmonicPalette = (count) => {
      const baseHue = Math.floor(Math.random() * 360)
      const baseSaturation = 60 + Math.floor(Math.random() * 30)
      const colors = []
      const schemes = ['analogous', 'complementary', 'triadic', 'tetradic']
      const scheme = schemes[Math.floor(Math.random() * schemes.length)]
      if (scheme === 'analogous') {
        for (let i = 0; i < count; i++) {
          const hue = (baseHue + (i * 30)) % 360
          const lightness = 45 + (i * 10) % 40
          colors.push(hslToHex(hue, baseSaturation, lightness))
        }
      } else if (scheme === 'complementary') {
        for (let i = 0; i < count; i++) {
          const hue = i % 2 === 0 ? baseHue : (baseHue + 180) % 360
          const lightness = 40 + (i * 15) % 50
          colors.push(hslToHex(hue, baseSaturation, lightness))
        }
      } else if (scheme === 'triadic') {
        for (let i = 0; i < count; i++) {
          const hue = (baseHue + (i * 120)) % 360
          const lightness = 45 + (i * 10) % 40
          colors.push(hslToHex(hue, baseSaturation, lightness))
        }
      } else {
        for (let i = 0; i < count; i++) {
          const hue = (baseHue + (i * 90)) % 360
          const lightness = 45 + (i * 10) % 40
          colors.push(hslToHex(hue, baseSaturation, lightness))
        }
      }
      return colors
    }
    const generatePalette = () => {
      const newPalette = []
      const harmonicColors = generateHarmonicPalette(colorCount.value)
      for (let i = 0; i < colorCount.value; i++) {
        if (palette.value[i]?.locked) {
          newPalette.push(palette.value[i])
        } else {
          const hex = harmonicColors[i]
          newPalette.push({
            hex,
            rgb: hexToRgb(hex),
            locked: false
          })
        }
      }
      palette.value = newPalette
      savePalette()
    }
    const getColorValue = (color) => {
      if (!color) return ''
      if (colorFormat.value === 'hex') {
        return color.hex.toUpperCase()
      } else {
        return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
      }
    }
    const copyToClipboard = (color) => {
      const value = getColorValue(color)
      navigator.clipboard.writeText(value).then(() => {
        copiedColor.value = value
        showCopyNotification.value = true
        setTimeout(() => {
          showCopyNotification.value = false
        }, 2000)
      })
    }
    const toggleLock = (index) => {
      palette.value[index].locked = !palette.value[index].locked
      savePalette()
    }
    const getTextColor = (hexColor) => {
      if (!hexColor) return '#000000'
      const r = parseInt(hexColor.slice(1, 3), 16)
      const g = parseInt(hexColor.slice(3, 5), 16)
      const b = parseInt(hexColor.slice(5, 7), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 128 ? '#000000' : '#ffffff'
    }
    const savePalette = () => {
      localStorage.setItem('colorPalette', JSON.stringify(palette.value))
    }
    const loadPalette = () => {
      const saved = localStorage.getItem('colorPalette')
      if (saved) {
        try {
          palette.value = JSON.parse(saved)
        } catch (e) {
          generatePalette()
        }
      } else {
        generatePalette()
      }
    }
    onMounted(() => {
      loadPalette()
    })
    return {
      palette,
      colorCount,
      colorFormat,
      showCopyNotification,
      copiedColor,
      previewBackground,
      generatePalette,
      getColorValue,
      copyToClipboard,
      toggleLock,
      getTextColor
    }
  }
}
</script>
<style scoped>
.color-generator {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
  flex-wrap: wrap;
}
.generate-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #34a853 0%, #0f9d58 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}
.generate-button:hover {
  transform: translateY(-2px);
}
.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.control-group label {
  font-weight: bold;
}
.select-input {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #28a745;
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.palette {
  display: flex;
  gap: 10px;
  margin-bottom: 40px;
  min-height: 200px;
}
.color-card {
  flex: 1;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  position: relative;
}
.color-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.lock-button {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  padding: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.lock-button:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.lock-icon {
  font-size: 18px;
}
.color-info {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 6px;
}
.color-value {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}
.preview-section {
  margin-top: 40px;
}
.preview-section h3 {
  margin-bottom: 15px;
}
.preview-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.preview-toggle {
  padding: 8px 16px;
  border: 2px solid #34a853;
  background-color: white;
  color: #34a853;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.preview-toggle:hover {
  background-color: #34a853;
  color: white;
}
.preview-toggle.active {
  background-color: #34a853;
  color: white;
}
.preview-mockup {
  padding: 40px;
  border-radius: 12px;
  background-color: #f5f5f5;
  transition: background-color 0.3s;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-mockup.dark-bg {
  background-color: #2c3e50;
}
.profile-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 450px;
}
.profile-header {
  height: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  position: relative;
}
.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  border: 6px solid white;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  position: relative;
  z-index: 1;
}
.profile-body {
  padding: 30px 30px 30px;
  text-align: center;
}
.profile-body h3 {
  margin: 0 0 25px 0;
  font-size: 28px;
  font-weight: bold;
}
.profile-button {
  padding: 14px 40px;
  border: none;
  border-radius: 30px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 16px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.profile-button:hover {
  transform: translateY(-2px);
}
.profile-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 25px;
  border-top: 2px solid rgba(0,0,0,0.05);
  flex-wrap: wrap;
  gap: 15px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  transition: transform 0.2s;
}
.stat-circle:hover {
  transform: scale(1.1);
}
.stat-circle strong {
  font-size: 18px;
  font-weight: bold;
}
.mockup-card {
  max-width: 400px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.mockup-card h4 {
  margin: 0 0 10px 0;
  font-size: 24px;
}
.mockup-card p {
  margin: 0 0 20px 0;
  opacity: 0.9;
}
.mockup-button {
  padding: 10px 20px;
  border: 2px solid;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
.mockup-button:hover {
  opacity: 0.8;
}
</style>
