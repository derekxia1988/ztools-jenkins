<template>
  <div class="favorites-panel">
    <div class="panel-header">
      <h3>收藏</h3>
      <span class="count">{{ favorites.length }}</span>
    </div>

    <div v-if="!currentInstance" class="empty">
      <p>请先选择 Jenkins 实例</p>
    </div>

    <div v-else-if="favorites.length === 0" class="empty">
      <p>暂无收藏</p>
      <span class="hint">在任务列表中点击星标收藏</span>
    </div>

    <div v-else class="favorites-list">
      <div
        v-for="fav in favorites"
        :key="fav._id"
        class="favorite-item"
        :class="{ active: selectedJob === fav.jobName }"
        @click="handleSelect(fav)"
      >
        <div class="favorite-info">
          <span class="favorite-name" :title="fav.jobName">{{ fav.jobName }}</span>
          <span class="favorite-view" v-if="fav.viewName">{{ fav.viewName }}</span>
        </div>
        <button
          class="build-btn"
          @click.stop="handleQuickBuild(fav)"
          title="快速触发构建"
        >
          <span class="play-icon"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useInstances } from '../composables/useInstances'
import { useFavorites } from '../composables/useFavorites'
import type { Favorite } from '../types'

const props = defineProps<{
  selectedJob?: string
}>()

const emit = defineEmits<{
  (e: 'select-favorite', fav: Favorite): void
}>()

const { currentInstance, currentClient } = useInstances()
const { favorites: allFavorites } = useFavorites()

const favorites = computed(() => {
  if (!currentInstance.value) return []
  return allFavorites.value
    .filter(f => f.instanceId === currentInstance.value?._id)
    .sort((a, b) => b.addedAt - a.addedAt)
})

const handleSelect = (fav: Favorite) => {
  emit('select-favorite', fav)
}

const handleQuickBuild = async (fav: Favorite) => {
  if (!currentClient.value) return
  if (!confirm(`确定要触发 ${fav.jobName} 的构建吗？`)) return

  const result = await currentClient.value.triggerBuild(fav.jobName)
  if (result.error) {
    window.ztools.showNotification(`构建触发失败: ${fav.jobName} - ${result.error}`, 'Jenkins Lite')
  } else {
    window.ztools.showNotification(`${fav.jobName} 构建已触发`, 'Jenkins Lite')
  }
}
</script>

<style scoped>
.favorites-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #fff);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #333);
}

.count {
  background: var(--primary-bg, rgba(0,120,212,0.15));
  color: var(--primary-color, #0078d4);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--text-secondary, #888);
  font-size: 13px;
  gap: 8px;
}

.empty .hint {
  font-size: 11px;
  color: var(--text-secondary, #999);
}

.favorites-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.favorite-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.favorite-item:hover {
  background: var(--bg-hover, rgba(0,120,212,0.1));
}

.favorite-item.active {
  background: var(--primary-bg, rgba(0,120,212,0.15));
  border-left: 3px solid var(--primary-color, #0078d4);
}

.favorite-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.favorite-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-view {
  font-size: 10px;
  color: var(--text-secondary, #888);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.build-btn {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #888);
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
  margin-left: 4px;
  padding: 0;
}

.build-btn:hover {
  background: var(--primary-color, #0078d4);
  color: #fff;
}

.play-icon {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 8px solid currentColor;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  margin-left: 2px;
}
</style>