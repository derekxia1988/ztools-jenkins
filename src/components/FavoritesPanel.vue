<template>
  <div class="favorites-panel">
    <div class="panel-header">
      <h3>⭐ 收藏</h3>
      <span class="count">{{ currentInstanceFavorites.length }}</span>
    </div>

    <div v-if="!currentInstance" class="empty">
      <p>请先选择 Jenkins 实例</p>
    </div>

    <div v-else-if="currentInstanceFavorites.length === 0" class="empty">
      <p>暂无收藏</p>
      <span class="hint">在任务列表中点击星标收藏</span>
    </div>

    <div v-else class="favorites-list">
      <div
        v-for="fav in currentInstanceFavorites"
        :key="fav._id"
        class="favorite-item"
        :class="{ active: selectedJob === fav.jobName }"
        @click="$emit('favorite-click', fav)"
      >
        <div class="favorite-info">
          <span class="favorite-name" :title="fav.jobName">{{ fav.jobName }}</span>
          <span class="favorite-view" v-if="fav.viewName">📁 {{ fav.viewName }}</span>
        </div>
        <div class="favorite-actions">
          <button
            class="action-btn build-btn"
            @click.stop="handleQuickBuild(fav)"
            title="快速触发构建"
          >
            <span class="play-icon"></span>
          </button>
          <button
            class="action-btn unfav-btn"
            @click.stop="handleRemoveFavorite(fav)"
            title="取消收藏"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useInstances } from '../composables/useInstances'
import { useFavorites } from '../composables/useFavorites'
import type { Favorite } from '../types'

defineProps<{
  selectedJob?: string
}>()

const emit = defineEmits<{
  (e: 'favorite-click', fav: Favorite): void
}>()

const { currentInstance, currentClient } = useInstances()
const { favorites, removeFavorite } = useFavorites()

/**
 * 当前实例的收藏列表
 */
const currentInstanceFavorites = computed(() => {
  if (!currentInstance.value) return []
  return favorites.value
    .filter(f => f.instanceId === currentInstance.value?._id)
    .sort((a, b) => b.addedAt - a.addedAt)
})

/**
 * 快速触发构建
 */
const handleQuickBuild = async (fav: Favorite) => {
  if (!currentClient.value) return
  if (!confirm(`确定要触发 ${fav.jobName} 的构建吗？`)) return

  const result = await currentClient.value.triggerBuild(fav.jobName)
  if (result.error) {
    window.ztools.showNotification(`❌ ${fav.jobName} 构建触发失败: ${result.error}`, 'Jenkins Lite')
  } else {
    window.ztools.showNotification(`🚀 ${fav.jobName} 构建已触发`, 'Jenkins Lite')
  }
}

/**
 * 取消收藏
 */
const handleRemoveFavorite = (fav: Favorite) => {
  removeFavorite(fav.instanceId, fav.jobName)
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color, #333);
}

.count {
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-secondary, #888);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
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
  padding: 8px 10px;
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
}

.favorite-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.favorite-name {
  font-size: 12px;
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

.favorite-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.favorite-item:hover .favorite-actions,
.favorite-item.active .favorite-actions {
  opacity: 1;
}

.action-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-secondary, #888);
  transition: background 0.15s;
}

.action-btn:hover {
  background: var(--bg-hover, rgba(0,0,0,0.08));
}

.build-btn:hover {
  color: var(--primary-color, #0078d4);
}

.unfav-btn:hover {
  color: #ff4d4f;
}

.play-icon {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 6px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  margin-left: 1px;
}
</style>