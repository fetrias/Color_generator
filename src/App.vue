<template>
  <div id="app">
    <header class="app-header">
      <h1>Генератор цветовых палитр</h1>
    </header>

    <main class="main-content">
      <ColorGenerator />
    </main>

    <footer class="app-footer">
      <p>Vue 3 + Vite • Практика 27</p>
    </footer>
  </div>
</template>

<script>
import ColorGenerator from './components/ColorGenerator.vue'

export default {
  name: 'App',
  
  components: {
    ColorGenerator
  }
}
</script>

<style>
/* Глобальные стили */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Стили шапки */
.app-header {
  background: linear-gradient(135deg, #34a853 0%, #0f9d58 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.app-header h1 {
  margin-bottom: 0;
  font-size: 2.5rem;
}

/* Основное содержимое */
.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Подвал */
.app-footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}
</style>
