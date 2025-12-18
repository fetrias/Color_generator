ну деплой в гитха<template>
  <div id="app">
    <header class="app-header">
      <h1>Генератор цветовых палитр</h1>
      
      <nav class="main-nav">
        <router-link to="/" class="nav-link">Генератор</router-link>
        <router-link to="/library" class="nav-link">Библиотека</router-link>
        <router-link to="/export" class="nav-link">Экспорт</router-link>
      </nav>
    </header>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
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
  width: 100%;
  margin: 0;
}

.app-header h1 {
  margin-bottom: 0;
  font-size: 2.5rem;
}

/* Навигация */
.main-nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
}

/* Основное содержимое */
.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
